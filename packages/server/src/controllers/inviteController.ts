// inviteController.ts — Контроллер приглашений (тик. 1792160012, 1795270823)

import { Response, NextFunction, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getInvites,
  deleteInvite,
  acceptInvite,
  acceptInviteByCode,
  previewInvite,
  createInvite,
  getReferrals,
} from '../services/inviteService';
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

// POST /api/invites — создание приглашения
export const createInviteCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { chatId, groupIds, addToContacts, message, maxUses, ttlType, expiresAt } = req.body ?? {};

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'chatId обязателен' });
      return;
    }

    const result = await createInvite(userId, {
      chatId,
      groupIds: Array.isArray(groupIds) ? groupIds : undefined,
      addToContacts: !!addToContacts,
      message: typeof message === 'string' ? message : null,
      maxUses: maxUses != null ? parseInt(String(maxUses), 10) : null,
      ttlType: typeof ttlType === 'string' ? ttlType : 'permanent',
      expiresAt: expiresAt != null ? parseInt(String(expiresAt), 10) : null,
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Вы не участник этого чата') {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'inviteController.createInviteCtrl');
    }
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

// GET /api/invites/preview/:code — публичный предпросмотр приглашения
export const previewInviteCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ error: 'Bad Request', message: 'code обязателен' });
      return;
    }
    const result = await previewInvite(code);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Приглашение не найдено') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      internalError(res, error, 'inviteController.previewInviteCtrl');
    }
  }
};

// POST /api/invites/accept/:code — принятие приглашения по коду (auth)
export const acceptInviteByCodeCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ error: 'Bad Request', message: 'code обязателен' });
      return;
    }

    const result = await acceptInviteByCode(code, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Приглашение не найдено') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Приглашение истекло' || error.message === 'Лимит использований приглашения достигнут') {
      res.status(410).json({ error: 'Gone', message: error.message });
    } else if (error.message === 'Это ваше собственное приглашение') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      internalError(res, error, 'inviteController.acceptInviteByCodeCtrl');
    }
  }
};

// POST /api/invites/:id/accept — принятие приглашения по id (auth)
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
    } else if (error.message === 'Это ваше собственное приглашение') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      internalError(res, error, 'inviteController.acceptInviteCtrl');
    }
  }
};

// GET /api/invites/referrals — «Я присоединил к Balloo»
export const getReferralsCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await getReferrals(userId);
    res.json(result);
  } catch (error: any) {
    internalError(res, error, 'inviteController.getReferralsCtrl');
  }
};
