import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getInvitesCtrl,
  createInviteCtrl,
  deleteInviteCtrl,
  acceptInviteCtrl,
  acceptInviteByCodeCtrl,
  previewInviteCtrl,
  getReferralsCtrl,
} from '../controllers/inviteController';
import { authRequired } from '../middleware/auth';

// ============================================================
// Публичный предпросмотр приглашения по коду (без авторизации).
// Используется страницей /join/:code.
// ============================================================
router.get('/preview/:code', previewInviteCtrl);

// ============================================================
// GET /api/invites — список приглашений пользователя
// ============================================================
router.get('/', authRequired, getInvitesCtrl);

// ============================================================
// GET /api/invites/referrals — «Я присоединил к Balloo»
// (объявлен до /:id, чтобы не перехватывался как id)
// ============================================================
router.get('/referrals', authRequired, getReferralsCtrl);

// ============================================================
// POST /api/invites — создать приглашение (группы, контакты, текст)
// ============================================================
router.post('/', authRequired, createInviteCtrl);

// ============================================================
// POST /api/invites/accept/:code — принять приглашение по коду (auth)
// ============================================================
router.post('/accept/:code', authRequired, acceptInviteByCodeCtrl);

// ============================================================
// DELETE /api/invites/:id — отмена приглашения
// ============================================================
router.delete('/:id', authRequired, deleteInviteCtrl);

// ============================================================
// POST /api/invites/:id/accept — принятие приглашения по id (auth)
// ============================================================
router.post('/:id/accept', authRequired, acceptInviteCtrl);

export { router };
