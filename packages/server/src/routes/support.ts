// support.ts — Маршруты чата с техподдержкой (тикет 1790572800-01)
// ТЗ: mockups/balloo-su/support.md (GET/POST /support/chat, GET /support/status)
import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getChatCtrl,
  sendMessageCtrl,
  getStatusCtrl,
} from '../controllers/supportController';
import { authRequired } from '../middleware/auth';

// GET /api/support/chat — история чата поддержки (тикет создаётся при первом обращении)
router.get('/chat', authRequired, getChatCtrl);

// POST /api/support/chat — отправка сообщения в поддержку
router.post('/chat', authRequired, sendMessageCtrl);

// GET /api/support/status — онлайн, среднее время ответа
router.get('/status', authRequired, getStatusCtrl);

export { router };
