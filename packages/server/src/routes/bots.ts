import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import { getBotsCtrl, createBotCtrl, deleteBotCtrl } from '../controllers/botController';

const router = Router() as import('express').Router;

// GET /api/bots — список ботов (публичные)
router.get('/', authRequired, getBotsCtrl);

// POST /api/bots — создание бота
router.post('/', authRequired, createBotCtrl);

// DELETE /api/bots/:id — удаление бота (только владелец)
router.delete('/:id', authRequired, deleteBotCtrl);

export { router };
