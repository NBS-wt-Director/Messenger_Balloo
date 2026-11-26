// Уведомления пользователя — REST (тикет 1795677854).
// До этого у модели `Notification` не было ни одного REST-маршрута:
// колокольчик в шапке был заглушкой, морзе-тикер подвала — без источника.

import { Router, type Response } from 'express';
import { authRequired, type AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';
import {
  listNotifications,
  markNotificationRead,
} from '../services/notificationService';

const router = Router() as import('express').Router;

// GET /api/notifications — список + число непрочитанных
router.get('/', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit ?? 30);
    const data = await listNotifications(req.user!.id, Number.isFinite(limit) ? limit : 30);
    res.json(data);
  } catch (error) {
    internalError(res, error, 'notifications.list');
  }
});

// POST /api/notifications/:id/read — отметить прочитанным
router.post('/:id/read', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ok = await markNotificationRead(req.user!.id, req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Not Found', message: 'Уведомление не найдено' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    internalError(res, error, 'notifications.read');
  }
});

export { router };
