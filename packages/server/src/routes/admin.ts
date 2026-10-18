import { Router } from 'express';
import {
  listUsers,
  banUser,
  unbanUser,
  suspendUser,
  deleteUser,
  listReports,
  resolveReport,
  listBans,
  createAnnouncement,
  listAnnouncements,
  listFeatureFlags,
  toggleFeatureFlag,
  listVersions,
  publishVersion,
  getMetrics,
  listAuditLogs,
} from '../controllers/adminController';
import {
  listTicketsCtrl,
  getTicketCtrl,
  replyCtrl,
} from '../controllers/supportController';
import { authRequired, adminOnly } from '../middleware/auth';

const router = Router() as import('express').Router;

// ============================================================
// Все маршруты админки требуют авторизации и роли admin
// ============================================================

// ----------------------------------------------------------
// Пользователи
// ----------------------------------------------------------

// GET /api/admin/users — список пользователей (filter, search, pagination)
router.get('/users', authRequired, adminOnly, listUsers);

// POST /api/admin/users/:id/ban — забанить пользователя
router.post('/users/:id/ban', authRequired, adminOnly, banUser);

// POST /api/admin/users/:id/unban — снять бан
router.post('/users/:id/unban', authRequired, adminOnly, unbanUser);

// POST /api/admin/users/:id/suspend — временная блокировка
router.post('/users/:id/suspend', authRequired, adminOnly, suspendUser);

// POST /api/admin/users/:id/delete — удаление аккаунта
router.post('/users/:id/delete', authRequired, adminOnly, deleteUser);

// ----------------------------------------------------------
// Жалобы
// ----------------------------------------------------------

// GET /api/admin/reports — список жалоб
router.get('/reports', authRequired, adminOnly, listReports);

// POST /api/admin/reports/:id/resolve — решение по жалобе
router.post('/reports/:id/resolve', authRequired, adminOnly, resolveReport);

// ----------------------------------------------------------
// Баны
// ----------------------------------------------------------

// GET /api/admin/bans — список банов
router.get('/bans', authRequired, adminOnly, listBans);

// ----------------------------------------------------------
// Объявления
// ----------------------------------------------------------

// GET /api/admin/announcements — список объявлений
router.get('/announcements', authRequired, adminOnly, listAnnouncements);

// POST /api/admin/announcements — создать объявление
router.post('/announcements', authRequired, adminOnly, createAnnouncement);

// ----------------------------------------------------------
// Feature Flags
// ----------------------------------------------------------

// GET /api/admin/feature-flags — список флагов
router.get('/feature-flags', authRequired, adminOnly, listFeatureFlags);

// POST /api/admin/feature-flags/:id/toggle — переключить флаг
router.post('/feature-flags/:id/toggle', authRequired, adminOnly, toggleFeatureFlag);

// ----------------------------------------------------------
// Версии
// ----------------------------------------------------------

// GET /api/admin/versions — список версий
router.get('/versions', authRequired, adminOnly, listVersions);

// POST /api/admin/versions — публикация версии
router.post('/versions', authRequired, adminOnly, publishVersion);

// ----------------------------------------------------------
// Метрики
// ----------------------------------------------------------

// GET /api/admin/metrics — метрики сервиса
router.get('/metrics', authRequired, adminOnly, getMetrics);

// ----------------------------------------------------------
// Логи аудита
// ----------------------------------------------------------

// GET /api/admin/audit-logs — логи действий
router.get('/audit-logs', authRequired, adminOnly, listAuditLogs);

// ----------------------------------------------------------
// Поддержка (ответ В-33: страница в дашборде админки)
// ----------------------------------------------------------

// GET /api/admin/support/tickets — список тикетов поддержки
router.get('/support/tickets', authRequired, adminOnly, listTicketsCtrl);

// GET /api/admin/support/tickets/:id — тикет с перепиской
router.get('/support/tickets/:id', authRequired, adminOnly, getTicketCtrl);

// POST /api/admin/support/tickets/:id/reply — ответ администратора
router.post('/support/tickets/:id/reply', authRequired, adminOnly, replyCtrl);

// ----------------------------------------------------------
// Заявки СМИ (тик. 1792137292)
// ----------------------------------------------------------

// GET /api/admin/groups/media-requests?status=pending — очередь заявок
router.get('/groups/media-requests', authRequired, adminOnly, async (req: any, res: any) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const { status, page, limit } = req.query;
    const where = status ? { status: String(status) } : {};
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 100);
    const [requests, total] = await Promise.all([
      prisma.groupMediaRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.groupMediaRequest.count({ where }),
    ]);
    res.json({ requests, total, page: pageNum, limit: limitNum });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// PUT /api/admin/groups/media-requests/:id — модерация заявки
router.put('/groups/media-requests/:id', authRequired, adminOnly, async (req: any, res: any) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const { id } = req.params;
    const { status, reviewComment } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Bad Request', message: 'status: approved | rejected' });
      return;
    }
    const updated = await prisma.groupMediaRequest.update({
      where: { id },
      data: {
        status,
        reviewComment: reviewComment || null,
        reviewedByAdminId: req.user!.id,
        reviewedAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Not Found', message: 'Заявка не найдена' });
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }
});

export { router };
