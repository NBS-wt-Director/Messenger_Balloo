// callController.ts — Контроллер для истории и инициации звонков (тик. 1792160007)
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCallHistory, createCall, endCall } from '../services/callService';
import { internalError } from '../middleware/errorHandler';

export const getCallHistoryCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { filter, page, limit } = req.query;
    const validFilter = ['all', 'incoming', 'outgoing', 'missed'].includes(String(filter)) ? String(filter) : undefined;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 100);
    const result = await getCallHistory(userId, validFilter as any, pageNum, limitNum);
    res.json(result);
  } catch (error: any) {
    internalError(res, error, 'callController.getCallHistoryCtrl');
  }
};

// POST /api/calls — инициация звонка
export const createCallCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const callerId = req.user!.id;
    const { calleeId, type } = req.body;

    if (!calleeId) {
      res.status(400).json({ error: 'Bad Request', message: 'calleeId обязателен' });
      return;
    }

    if (type && !['audio', 'video'].includes(type)) {
      res.status(400).json({ error: 'Bad Request', message: 'type должен быть audio или video' });
      return;
    }

    const result = await createCall(callerId, calleeId, type === 'video' ? 'video' : 'audio');
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Пользователь не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Нельзя позвонить самому себе') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      internalError(res, error, 'callController.createCallCtrl');
    }
  }
};

// POST /api/calls/:id/end — завершение звонка
export const endCallCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: callId } = req.params;

    if (!callId) {
      res.status(400).json({ error: 'Bad Request', message: 'id обязателен' });
      return;
    }

    const result = await endCall(userId, callId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Звонок не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'callController.endCallCtrl');
    }
  }
};
