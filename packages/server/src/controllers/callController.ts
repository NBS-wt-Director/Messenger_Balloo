// callController.ts — Контроллер для истории звонков
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCallHistory } from '../services/callService';

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
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};
