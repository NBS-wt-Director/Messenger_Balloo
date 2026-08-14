import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { nowTimestamp } from '@balloo/shared';

const prisma = new PrismaClient();

// ============================================================
// Получить список пользователей (GET /api/admin/users)
// ============================================================

export const listUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, role, status, page, limit, sortBy, sortOrder } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Фильтры
    const where: Record<string, any> = {};

    if (q && typeof q === 'string' && q.trim().length > 0) {
      const query = q.trim();
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (role && typeof role === 'string') {
      where.role = role;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Сортировка
    const sortField = (sortBy as string) || 'createdAt';
    const sortDir = (sortOrder as string) === 'asc' ? 'asc' : 'desc';
    const orderBy: Record<string, any> = {};
    orderBy[sortField] = sortDir;

    // Запрос с пагинацией
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          role: true,
          language: true,
          createdAt: true,
          updatedAt: true,
        _count: {
          select: {
            userChats: true,
            messages: true,
            stories: true,
          },
        },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Забанить пользователя (POST /api/admin/users/:id/ban)
// ============================================================

export const banUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id: targetId } = req.params;
    const { reason, duration, global } = req.body;

    if (!targetId) {
      res.status(400).json({ error: 'Bad Request', message: 'User ID обязателен' });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Причина бана обязательна' });
      return;
    }

    const expiresAt = duration
      ? nowTimestamp() + parseInt(String(duration), 10) * 60 * 60 * 24 // duration в днях → секунды
      : null;

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { status: 'banned' },
    });

    // Создание записи UserBan
    await prisma.userBan.create({
      data: {
        userId: targetId,
        adminId,
        reason,
        expiresAt: expiresAt ? BigInt(expiresAt) : null,
        global: global || false,
      },
    });

    // Логирование в audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BAN_USER',
        target: targetId,
        details: JSON.stringify({ reason, global, duration }),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.json({
      message: 'Пользователь забанен',
      user: { id: user.id, email: user.email, status: user.status },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Снять бан с пользователя (POST /api/admin/users/:id/unban)
// ============================================================

export const unbanUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id: targetId } = req.params;

    if (!targetId) {
      res.status(400).json({ error: 'Bad Request', message: 'User ID обязателен' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { status: 'active' },
    });

    // Удаление активных банов (null = permanent, или expiresAt в будущем)
    await prisma.userBan.deleteMany({
      where: {
        userId: targetId,
        expiresAt: {
          equals: null,
        },
      },
    });

    // Удаляем баны с будущим истечением
    const futureBans = await prisma.userBan.deleteMany({
      where: {
        userId: targetId,
        expiresAt: {
          gte: BigInt(nowTimestamp()),
        },
      },
    });

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UNBAN_USER',
        target: targetId,
        details: JSON.stringify({}),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.json({
      message: 'Бан снят',
      user: { id: user.id, email: user.email, status: user.status },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Временная блокировка пользователя (POST /api/admin/users/:id/suspend)
// ============================================================

export const suspendUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id: targetId } = req.params;
    const { reason, duration } = req.body;

    if (!targetId) {
      res.status(400).json({ error: 'Bad Request', message: 'User ID обязателен' });
      return;
    }

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Причина обязательна' });
      return;
    }

    const durationSeconds = duration ? parseInt(String(duration), 10) * 60 : 60 * 60; // по умолчанию 1 час

    const expiresAt = nowTimestamp() + durationSeconds;

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { status: 'suspended' },
    });

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'SUSPEND_USER',
        target: targetId,
        details: JSON.stringify({ reason, duration }),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.json({
      message: 'Пользователь временно заблокирован',
      user: { id: user.id, email: user.email, status: user.status, suspendedUntil: expiresAt },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Удалить пользователя (POST /api/admin/users/:id/delete)
// ============================================================

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id: targetId } = req.params;

    if (!targetId) {
      res.status(400).json({ error: 'Bad Request', message: 'User ID обязателен' });
      return;
    }

    // Soft delete: помечаем как deleted
    await prisma.user.update({
      where: { id: targetId },
      data: { status: 'deleted' },
    });

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE_USER',
        target: targetId,
        details: JSON.stringify({}),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.json({ message: 'Пользователь удалён' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить список жалоб (GET /api/admin/reports)
// ============================================================

export const listReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, targetType, page, limit } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, any> = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (targetType && typeof targetType === 'string') {
      where.targetType = targetType;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          reporter: {
            select: { id: true, email: true, username: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Решить жалобу (POST /api/admin/reports/:id/resolve)
// ============================================================

export const resolveReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id: reportId } = req.params;
    const { action, comment } = req.body;

    if (!action || !['dismiss', 'warn', 'ban', 'delete_content'].includes(action)) {
      res.status(400).json({ error: 'Bad Request', message: 'Неверное действие. Допустимые значения: dismiss, warn, ban, delete_content' });
      return;
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'resolved',
        resolvedBy: adminId,
        resolvedAt: BigInt(nowTimestamp()),
        action,
        comment,
      },
    });

    // Если ban — забанить пользователя
    if (action === 'ban' && report.targetType === 'user' && report.targetId) {
      await prisma.user.update({
        where: { id: report.targetId },
        data: { status: 'banned' },
      });

      await prisma.userBan.create({
        data: {
          userId: report.targetId,
          adminId,
          reason: `Бан по жалобе #${reportId}: ${comment}`,
        },
      });
    }

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'RESOLVE_REPORT',
        target: reportId,
        details: JSON.stringify({ action, comment, reportId: report.id }),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.json({ message: 'Жалоба решена', report });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Жалоба не найдена' });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить список банов (GET /api/admin/bans)
// ============================================================

export const listBans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, adminId, active, page, limit } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, any> = {};

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    if (adminId && typeof adminId === 'string') {
      where.adminId = adminId;
    }

    // active filter: expiresAt IS NULL OR expiresAt >= now
    // Prisma не поддерживает OR на уровне одного поля, поэтому фильтрация будет на стороне клиента
    // Возвращаем все баны с пометкой isActive

    const bans = await prisma.userBan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        user: { select: { id: true, email: true, username: true, status: true } },
        admin: { select: { id: true, email: true, username: true } },
      },
    });

    const total = await prisma.userBan.count({ where });

    res.json({
      bans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Создать объявление (POST /api/admin/announcements)
// ============================================================

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { title, content, targetAudience, activeFrom, activeUntil } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Bad Request', message: 'Заголовок и содержание обязательны' });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetAudience: targetAudience || 'all',
        activeFrom: activeFrom ? BigInt(activeFrom) : BigInt(nowTimestamp()),
        activeUntil: activeUntil ? BigInt(activeUntil) : null,
      },
    });

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE_ANNOUNCEMENT',
        target: announcement.id,
        details: JSON.stringify({ title, targetAudience }),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Получить список объявлений (GET /api/admin/announcements)
// ============================================================

export const listAnnouncements = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { activeFrom: 'desc' },
    });
    res.json({ announcements });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Получить список feature flags (GET /api/admin/feature-flags)
// ============================================================

export const listFeatureFlags = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ flags });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Переключить feature flag (POST /api/admin/feature-flags/:id/toggle)
// ============================================================

export const toggleFeatureFlag = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id: flagId } = req.params;

    const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });

    if (!flag) {
      res.status(404).json({ error: 'Not Found', message: 'Feature flag не найден' });
      return;
    }

    const updated = await prisma.featureFlag.update({
      where: { id: flagId },
      data: { enabled: !flag.enabled },
    });

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'TOGGLE_FEATURE_FLAG',
        target: flagId,
        details: JSON.stringify({ enabled: updated.enabled, name: flag.name }),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.json({ message: 'Feature flag переключён', flag: updated });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Feature flag не найден' });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить список версий (GET /api/admin/versions)
// ============================================================

export const listVersions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const versions = await prisma.serviceVersion.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
    res.json({ versions });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Опубликовать новую версию (POST /api/admin/versions)
// ============================================================

export const publishVersion = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { version, changelog, isLatest } = req.body;

    if (!version) {
      res.status(400).json({ error: 'Bad Request', message: 'Версия обязательна' });
      return;
    }

    // Снять флаг isLatest у предыдущей последней версии
    await prisma.serviceVersion.updateMany({
      where: { isLatest: true },
      data: { isLatest: false },
    });

    const newVersion = await prisma.serviceVersion.create({
      data: {
        version,
        changelog: changelog || '',
        publishedAt: BigInt(nowTimestamp()),
        isLatest: isLatest !== undefined ? isLatest : true,
      },
    });

    // Логирование
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'PUBLISH_VERSION',
        target: newVersion.id,
        details: JSON.stringify({ version, isLatest }),
        ip: (req as any).ip || 'unknown',
        createdAt: nowTimestamp(),
      },
    });

    res.status(201).json(newVersion);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Получить метрики сервиса (GET /api/admin/metrics)
// ============================================================

export const getMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalChats,
      totalMessages,
      totalReports,
      openReports,
      totalBans,
      activeBans,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'open' } }),
      prisma.userBan.count(),
      prisma.userBan.count({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: BigInt(nowTimestamp()) } },
          ],
        },
      }),
    ]);

    // Последние метрики
    const recentMetrics = await prisma.serviceMetric.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        totalChats,
        totalMessages,
        totalReports,
        openReports,
        totalBans,
        activeBans,
      },
      recentMetrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Получить логи аудита (GET /api/admin/audit-logs)
// ============================================================

export const listAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, adminId, target, page, limit } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 200);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, any> = {};

    if (action && typeof action === 'string') {
      where.action = action;
    }

    if (adminId && typeof adminId === 'string') {
      where.adminId = adminId;
    }

    if (target && typeof target === 'string') {
      where.target = target;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          admin: { select: { id: true, email: true, username: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};
