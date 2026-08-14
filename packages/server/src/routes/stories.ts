import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import {
  createStory,
  getStories,
  getStoryViews,
  addStoryReaction,
  deleteStory,
} from '../controllers/storyController';

const router = Router() as import('express').Router;

// Все маршруты требуют авторизации
router.use(authRequired);

// POST /api/stories — создать историю
router.post('/', createStory);

// GET /api/stories — получить истории (лента/круг)
router.get('/', getStories);

// GET /api/stories/:id/views — просмотры истории
router.get('/:id/views', getStoryViews);

// POST /api/stories/:id/reactions — реакция на историю
router.post('/:id/reactions', addStoryReaction);

// DELETE /api/stories/:id — удалить историю
router.delete('/:id', deleteStory);

export default router;
