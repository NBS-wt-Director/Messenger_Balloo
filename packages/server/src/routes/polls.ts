import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import {
  createPoll,
  createPollFromBody,
  votePoll,
  getPollResults,
  getPoll,
  deletePoll,
} from '../controllers/pollController';

const router = Router() as import('express').Router;

// Все маршруты требуют авторизации
router.use(authRequired);

// POST /api/polls — создать опрос (chatId в теле; В-115, PollScreen.handleCreate)
router.post('/', createPollFromBody);

// POST /api/chats/:chatId/polls — создать опрос в чате
router.post('/chats/:chatId', createPoll);

// POST /api/polls/:id/vote — проголосовать
router.post('/:id/vote', votePoll);

// GET /api/polls/:id — опрос (В-115, PollScreen.loadPoll)
router.get('/:id', getPoll);

// GET /api/polls/:id/results — результаты опроса
router.get('/:id/results', getPollResults);

// DELETE /api/polls/:id — удалить опрос
router.delete('/:id', deletePoll);

export default router;
