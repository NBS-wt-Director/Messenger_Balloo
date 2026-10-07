import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getMe,
  updateMe,
  deleteMe,
  exportMe,
  getPublicProfile,
  searchUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../controllers/userController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/users/me — текущий пользователь
// ============================================================
router.get('/me', authRequired, getMe);

// ============================================================
// PUT /api/users/me — обновление профиля
// ============================================================
router.put('/me', authRequired, updateMe);

// ============================================================
// DELETE /api/users/me — мягкое удаление аккаунта (self-service)
// ============================================================
router.delete('/me', authRequired, deleteMe);

// ============================================================
// GET /api/users/me/export — выгрузка данных пользователя
// ============================================================
router.get('/me/export', authRequired, exportMe);

// ============================================================
// GET /api/users/search?q= — поиск пользователей
// ============================================================
router.get('/search', searchUsers);

// ============================================================
// GET /api/users/:username — публичный профиль
// ============================================================
router.get('/:username', getPublicProfile);

// ============================================================
// POST /api/users/:id/block — заблокировать
// ============================================================
router.post('/:id/block', authRequired, blockUser);

// ============================================================
// DELETE /api/users/:id/block — разблокировать
// ============================================================
router.delete('/:id/block', authRequired, unblockUser);

// ============================================================
// GET /api/users/me/blocked — список заблокированных
// ============================================================
router.get('/me/blocked', authRequired, getBlockedUsers);

export { router };
