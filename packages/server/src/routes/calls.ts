import { Router } from 'express';

const router = Router() as import('express').Router;
import { getCallHistoryCtrl } from '../controllers/callController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/calls — история звонков пользователя
// ============================================================
router.get('/', authRequired, getCallHistoryCtrl);

export { router };
