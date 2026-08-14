import { Request, Response, NextFunction } from 'express';
import {
  createPoll as createPollService,
  votePoll as votePollService,
  getPollResults as getPollResultsService,
  deletePoll as deletePollService,
} from '../services/pollService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// Создать опрос (POST /api/chats/:chatId/polls)
// ============================================================

export const createPoll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { question, options, allowsMultiple, expiresAt } = req.body;

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }

    if (!question || !options || !Array.isArray(options)) {
      res.status(400).json({ error: 'Bad Request', message: 'Необходимы: question, options (array)' });
      return;
    }

    const poll = await createPollService({
      chatId,
      creatorId: userId,
      question,
      options,
      allowsMultiple,
      expiresAt,
    });

    res.status(201).json(poll);
  } catch (error: any) {
    if (error.message.includes('варианта')) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message.includes('не состоит')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Проголосовать в опросе (POST /api/polls/:id/vote)
// ============================================================

export const votePoll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { optionIndex } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Poll ID обязателен' });
      return;
    }

    if (optionIndex === undefined || optionIndex === null) {
      res.status(400).json({ error: 'Bad Request', message: 'optionIndex обязателен' });
      return;
    }

    const result = await votePollService({ pollId: id, userId, optionIndex });
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Опрос не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Опрос истёк') {
      res.status(410).json({ error: 'Gone', message: error.message });
    } else if (error.message.includes('не состоит')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else if (error.message.includes('Недопустимый')) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить результаты опроса (GET /api/polls/:id/results)
// ============================================================

export const getPollResults = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const viewerId = req.user?.id;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Poll ID обязателен' });
      return;
    }

    const result = await getPollResultsService({ pollId: id, viewerId });
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Опрос не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Удалить опрос (DELETE /api/polls/:id)
// ============================================================

export const deletePoll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Poll ID обязателен' });
      return;
    }

    const result = await deletePollService(id, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Опрос не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Доступ запрещён') {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};
