// archiveController.ts — Контроллер для архива чатов
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getArchivedChats,
  restoreChat,
  deleteChatPermanently,
  archiveChat,
} from '../services/archiveService';

export const getArchived = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await getArchivedChats(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

export const restoreArchivedChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const result = await restoreChat(chatId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Чат не в архиве') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message === 'Чат не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

export const deleteArchivedChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const result = await deleteChatPermanently(chatId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('Доступ запрещён') || error.message.includes('Только владелец')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else if (error.message === 'Чат не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

export const archiveChatCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const result = await archiveChat(chatId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Чат не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};
