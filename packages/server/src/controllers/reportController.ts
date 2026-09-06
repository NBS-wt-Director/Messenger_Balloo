// reportController.ts — Контроллер для жалоб на сообщения
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { createReport, getUserReports } from '../services/reportService';

export const createReportCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { messageId, reportedUserId, reason, comment, chatId } = req.body;

    // Определяем targetId и targetType на основе переданных данных
    let targetId = '';
    let targetType: 'user' | 'message' | 'chat' | 'post' | 'story' = 'user';

    if (messageId) {
      targetId = messageId;
      targetType = 'message';
    } else if (reportedUserId) {
      targetId = reportedUserId;
      targetType = 'user';
    } else if (chatId) {
      targetId = chatId;
      targetType = 'chat';
    } else {
      res.status(400).json({ error: 'Bad Request', message: 'Укажите сообщение, пользователя или чат для жалобы' });
      return;
    }

    const result = await createReport({
      reporterId: userId,
      targetId,
      targetType,
      reason,
      content: comment,
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Неверная причина жалобы') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

export const getUserReportsCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page, limit } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 50);
    const result = await getUserReports(userId, pageNum, limitNum);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};
