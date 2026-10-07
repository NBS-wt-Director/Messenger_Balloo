// feedbackController.ts — Обратная связь (тикет 1790572800-02)
// POST /api/feedback            — создание (авторизованный пользователь)
// GET  /api/feedback/mine       — своя обратная связь
// GET  /api/admin/feedback      — список (админ, ?status=&page=&limit=)
// GET  /api/admin/feedback/stats— сводка по типам/статусам (админ)
// PATCH /api/admin/feedback/:id — смена статуса / ответ (админ)
// DELETE /api/admin/feedback/:id— удаление (админ)
import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const FEEDBACK_TYPES = ['bug', 'feature', 'complaint', 'other'] as const;
const FEEDBACK_STATUSES = ['new', 'in_progress', 'resolved', 'closed'] as const;

const MESSAGE_MIN = 5;
const MESSAGE_MAX = 5000;

// POST /api/feedback — создать обращение
export const createFeedbackCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, message } = req.body ?? {};

    if (!FEEDBACK_TYPES.includes(type)) {
      res.status(400).json({ error: 'Bad Request', message: `Недопустимый тип. Один из: ${FEEDBACK_TYPES.join(', ')}` });
      return;
    }

    const text = typeof message === 'string' ? message.trim() : '';
    if (text.length < MESSAGE_MIN) {
      res.status(400).json({ error: 'Bad Request', message: `Сообщение слишком короткое (мин. ${MESSAGE_MIN} символов)` });
      return;
    }
    if (text.length > MESSAGE_MAX) {
      res.status(400).json({ error: 'Bad Request', message: `Сообщение слишком длинное (макс. ${MESSAGE_MAX} символов)` });
      return;
    }

    const feedback = await prisma.feedback.create({
      data: { userId, type, message: text },
      select: { id: true, type: true, message: true, status: true, createdAt: true },
    });

    res.status(201).json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
};

// GET /api/feedback/mine — своя обратная связь
export const listMyFeedbackCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const items = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        message: true,
        status: true,
        adminNote: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ items, total: items.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
};

// GET /api/admin/feedback — список (админ, фильтры + пагинация)
export const listFeedbackCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' && FEEDBACK_STATUSES.includes(req.query.status as any)
      ? (req.query.status as string)
      : undefined;
    const type = typeof req.query.type === 'string' && FEEDBACK_TYPES.includes(req.query.type as any)
      ? (req.query.type as string)
      : undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));

    const where = { ...(status ? { status } : {}), ...(type ? { type } : {}) };

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          message: true,
          status: true,
          adminNote: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, nickname: true, email: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
};

// GET /api/admin/feedback/stats — сводка (админ)
export const getFeedbackStatsCtrl = async (_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const [total, byStatus, byType] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.feedback.groupBy({ by: ['type'], _count: { _all: true } }),
    ]);

    res.json({
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count._all])),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
};

// PATCH /api/admin/feedback/:id — статус / ответ администратора
export const updateFeedbackCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body ?? {};

    if (status !== undefined && !FEEDBACK_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Bad Request', message: `Недопустимый статус. Один из: ${FEEDBACK_STATUSES.join(', ')}` });
      return;
    }

    const existing = await prisma.feedback.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Обращение не найдено' });
      return;
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof adminNote === 'string' ? { adminNote: adminNote.trim() || null } : {}),
      },
      select: { id: true, status: true, adminNote: true, updatedAt: true },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
};

// DELETE /api/admin/feedback/:id — удаление (админ)
export const deleteFeedbackCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.feedback.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Обращение не найдено' });
      return;
    }
    await prisma.feedback.delete({ where: { id } });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
};
