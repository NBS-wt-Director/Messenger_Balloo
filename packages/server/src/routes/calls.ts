import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getCallHistoryCtrl,
  createCallCtrl,
  endCallCtrl,
} from '../controllers/callController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/calls — история звонков пользователя
// ============================================================
router.get('/', authRequired, getCallHistoryCtrl);

// ============================================================
// POST /api/calls — инициация звонка
// ============================================================
router.post('/', authRequired, createCallCtrl);

// ============================================================
// POST /api/calls/:id/end — завершение звонка
// ============================================================
router.post('/:id/end', authRequired, endCallCtrl);

export { router };
