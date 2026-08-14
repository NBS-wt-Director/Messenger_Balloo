import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  createChat,
  getChats,
  getChatInfo,
  updateChat,
  deleteChat,
  addMember,
  removeMember,
  joinByInvite,
  createInviteLink,
  leaveChat,
} from '../controllers/chatController';
import { authRequired } from '../middleware/auth';

// ============================================================
// POST /api/chats — создание чата (group/channel)
// ============================================================
router.post('/', authRequired, createChat);

// ============================================================
// GET /api/chats — список чатов пользователя
// ============================================================
router.get('/', authRequired, getChats);

// ============================================================
// GET /api/chats/:id — информация о чате
// ============================================================
router.get('/:id', getChatInfo);

// ============================================================
// PUT /api/chats/:id — обновление чата
// ============================================================
router.put('/:id', authRequired, updateChat);

// ============================================================
// DELETE /api/chats/:id — удаление чата
// ============================================================
router.delete('/:id', authRequired, deleteChat);

// ============================================================
// POST /api/chats/:id/members — добавить участника
// ============================================================
router.post('/:id/members', authRequired, addMember);

// ============================================================
// DELETE /api/chats/:id/members/:userId — удалить участника
// ============================================================
router.delete('/:id/members/:userId', authRequired, removeMember);

// ============================================================
// POST /api/chats/:id/invite — создать invite link
// ============================================================
router.post('/:id/invite', authRequired, createInviteLink);

// ============================================================
// POST /api/chats/invite/:code — присоединиться по invite link
// ============================================================
router.post('/invite/:code', authRequired, joinByInvite);

// ============================================================
// POST /api/chats/:id/leave — выйти из чата
// ============================================================
router.post('/:id/leave', authRequired, leaveChat);

export { router };
