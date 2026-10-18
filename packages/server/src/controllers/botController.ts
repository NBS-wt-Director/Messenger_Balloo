// botController.ts — Контроллер для управления ботами

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';
import {
  createBot,
  getBots,
  getBot,
  deleteBot,
} from '../services/botService';

// ============================================================
// GET /api/bots — список ботов
// ============================================================

export const getBotsCtrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bots = await getBots();
    res.json(bots);
  } catch (error: any) {
    internalError(res, error, 'botController.getBotsCtrl');
  }
};

// ============================================================
// POST /api/bots — создание бота
// ============================================================

export const createBotCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, webhookUrl } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Поле "name" обязательно' });
      return;
    }

    const bot = await createBot(userId, { name, description, webhookUrl });
    res.status(201).json(bot);
  } catch (error: any) {
    internalError(res, error, 'botController.createBotCtrl');
  }
};

// ============================================================
// DELETE /api/bots/:id — удаление бота
// ============================================================

export const deleteBotCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: botId } = req.params;

    if (!botId) {
      res.status(400).json({ error: 'Bad Request', message: 'Bot ID обязателен' });
      return;
    }

    await deleteBot(botId, userId);
    res.json({ message: 'Бот удалён' });
  } catch (error: any) {
    if (error.message === 'Бот не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Доступ запрещён') {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'botController.deleteBotCtrl');
    }
  }
};
