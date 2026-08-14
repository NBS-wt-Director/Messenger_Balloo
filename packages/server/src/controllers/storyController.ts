import { Request, Response, NextFunction } from 'express';
import {
  createStory as createStoryService,
  getStories as getStoriesService,
  getStoryViews as getStoryViewsService,
  addStoryReaction as addStoryReactionService,
  deleteStory as deleteStoryService,
} from '../services/storyService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// Создать историю (POST /api/stories)
// ============================================================

export const createStory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, mediaUrl, thumbnail, expiresAt } = req.body;

    if (!type || !mediaUrl || !expiresAt) {
      res.status(400).json({ error: 'Bad Request', message: 'Необходимы: type, mediaUrl, expiresAt' });
      return;
    }

    if (!['image', 'video'].includes(type)) {
      res.status(400).json({ error: 'Bad Request', message: 'type должен быть image или video' });
      return;
    }

    const story = await createStoryService({ userId, type, mediaUrl, thumbnail, expiresAt });

    res.status(201).json(story);
  } catch (error: any) {
    if (error.message.includes('лимит')) {
      res.status(429).json({ error: 'Too Many Requests', message: error.message });
    } else if (error.message.includes('будущему')) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить истории (GET /api/stories)
// ============================================================

export const getStories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const viewerId = req.user?.id;
    const { userIds, limit, before } = req.query;

    const userIdsArr = userIds
      ? String(userIds).split(',').filter(Boolean)
      : undefined;

    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 100);
    const beforeNum = before ? parseInt(String(before), 10) : undefined;

    const result = await getStoriesService(
      { userIds: userIdsArr, limit: limitNum, before: beforeNum },
      viewerId
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Получить просмотры истории (GET /api/stories/:id/views)
// ============================================================

export const getStoryViews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Story ID обязателен' });
      return;
    }

    const result = await getStoryViewsService(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'История не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Добавить реакцию на историю (POST /api/stories/:id/reactions)
// ============================================================

export const addStoryReaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { emoji } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Story ID обязателен' });
      return;
    }

    if (!emoji || typeof emoji !== 'string' || emoji.length > 20) {
      res.status(400).json({ error: 'Bad Request', message: 'emoji обязателен (до 20 символов)' });
      return;
    }

    const reaction = await addStoryReactionService({ storyId: id, userId, emoji });
    res.json(reaction);
  } catch (error: any) {
    if (error.message === 'История не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'История истекла') {
      res.status(410).json({ error: 'Gone', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Удалить историю (DELETE /api/stories/:id)
// ============================================================

export const deleteStory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Story ID обязателен' });
      return;
    }

    const result = await deleteStoryService({ storyId: id, userId });
    res.json(result);
  } catch (error: any) {
    if (error.message === 'История не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Доступ запрещён') {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};
