// inviteController.ts — Контроллер для приглашений (тик. 1792160012)

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getInvites, deleteInvite, acceptInvite } from '../services/inviteService';
import { internalError } from '../middleware/errorHandler';

// GET /api/invites — список приглашений
export const getInvitesCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invites = await getInvites(userId);
    res.json(invites);
  } catch (error: any) {
    internalError(res, error, 'inviteController.getInvitesCtrl');
  }
};

// DELETE /api/invites/:id — отмена приглашения
export const deleteInviteCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: inviteId } = req.params;

    if (!inviteId) {
      res.status(400).json({ error: 'Bad Request', message: 'id обязателен' });
      return;
    }

    const result = await deleteInvite(userId, inviteId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Приглашение не найдено') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'inviteController.deleteInviteCtrl');
    }
  }
};

// POST /api/invites/:id/accept — принятие приглашения
export const acceptInviteCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: inviteId } = req.params;

    if (!inviteId) {
      res.status(400).json({ error: 'Bad Request', message: 'id обязателен' });
      return;
    }

    const result = await acceptInvite(userId, inviteId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Приглашение не найдено') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Приглашение истекло' || error.message === 'Лимит использований приглашения достигнут') {
      res.status(410).json({ error: 'Gone', message: error.message });
    } else if (error.message.includes('уже состоите')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else {
      internalError(res, error, 'inviteController.acceptInviteCtrl');
    }
  }
};
