import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getArchived,
  restoreArchivedChat,
  deleteArchivedChat,
  archiveChatCtrl,
} from '../controllers/archiveController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/archive — список архивированных чатов
// ============================================================
router.get('/', authRequired, getArchived);

// ============================================================
// POST /api/archive/:id/restore — восстановить чат из архива
// ============================================================
router.post('/:id/restore', authRequired, restoreArchivedChat);

// ============================================================
// DELETE /api/archive/:id — удалить чат из архива навсегда
// ============================================================
router.delete('/:id', authRequired, deleteArchivedChat);

// ============================================================
// POST /api/archive/:id — архивировать чат
// ============================================================
router.post('/:id', authRequired, archiveChatCtrl);

export { router };
