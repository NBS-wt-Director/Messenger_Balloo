import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  sendMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getReactions,
  markAsRead,
  getReadStatus,
  pinMessage,
  searchMessages,
} from '../controllers/messageController';
import { authRequired } from '../middleware/auth';

// ============================================================
// POST /api/chats/:chatId/messages — отправка сообщения
// ============================================================
router.post('/chats/:chatId/messages', authRequired, sendMessage);

// ============================================================
// GET /api/chats/:chatId/messages — история сообщений
// ============================================================
router.get('/chats/:chatId/messages', getMessages);

// ============================================================
// GET /api/chats/:chatId/messages/search — поиск по сообщениям
// ============================================================
router.get('/chats/:chatId/messages/search', searchMessages);

// ============================================================
// PUT /api/messages/:id — редактирование сообщения
// ============================================================
router.put('/messages/:id', authRequired, updateMessage);

// ============================================================
// DELETE /api/messages/:id — удаление сообщения
// ============================================================
router.delete('/messages/:id', authRequired, deleteMessage);

// ============================================================
// POST /api/messages/:id/reactions — реакция на сообщение
// ============================================================
router.post('/messages/:id/reactions', authRequired, addReaction);

// ============================================================
// DELETE /api/messages/:id/reactions — удаление реакции
// ============================================================
router.delete('/messages/:id/reactions', authRequired, removeReaction);

// ============================================================
// GET /api/messages/:id/reactions — список реакций
// ============================================================
router.get('/messages/:id/reactions', getReactions);

// ============================================================
// POST /api/messages/:id/read — отметить как прочитанное
// ============================================================
router.post('/messages/:id/read', authRequired, markAsRead);

// ============================================================
// GET /api/messages/:id/read — статус прочтения
// ============================================================
router.get('/messages/:id/read', getReadStatus);

// ============================================================
// POST /api/messages/:id/pin — закрепление сообщения
// ============================================================
router.post('/messages/:id/pin', authRequired, pinMessage);

export { router };
