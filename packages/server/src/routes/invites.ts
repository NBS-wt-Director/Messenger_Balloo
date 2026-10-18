import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getInvitesCtrl,
  deleteInviteCtrl,
  acceptInviteCtrl,
} from '../controllers/inviteController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/invites — список приглашений пользователя
// ============================================================
router.get('/', authRequired, getInvitesCtrl);

// ============================================================
// DELETE /api/invites/:id — отмена приглашения
// ============================================================
router.delete('/:id', authRequired, deleteInviteCtrl);

// ============================================================
// POST /api/invites/:id/accept — принятие приглашения
// ============================================================
router.post('/:id/accept', authRequired, acceptInviteCtrl);

export { router };
