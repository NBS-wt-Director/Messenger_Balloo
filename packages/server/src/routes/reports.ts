import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  createReportCtrl,
  getUserReportsCtrl,
} from '../controllers/reportController';
import { authRequired } from '../middleware/auth';

// ============================================================
// POST /api/reports — создать жалобу на сообщение/пользователя
// ============================================================
router.post('/', authRequired, createReportCtrl);

// ============================================================
// GET /api/reports — список жалоб пользователя
// ============================================================
router.get('/', authRequired, getUserReportsCtrl);

export { router };
