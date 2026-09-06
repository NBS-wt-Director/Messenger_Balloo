import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getDevicesCtrl,
  endSessionCtrl,
  endAllSessionsCtrl,
} from '../controllers/deviceController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/devices — список устройств пользователя
// ============================================================
router.get('/', authRequired, getDevicesCtrl);

// ============================================================
// DELETE /api/devices/:id — завершить сессию устройства
// ============================================================
router.delete('/:id', authRequired, endSessionCtrl);

// ============================================================
// POST /api/devices/end-all — завершить все сессии кроме текущей
// ============================================================
router.post('/end-all', authRequired, endAllSessionsCtrl);

export { router };
