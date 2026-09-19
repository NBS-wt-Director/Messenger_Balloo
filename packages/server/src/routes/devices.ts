import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getDevicesCtrl,
  endSessionCtrl,
  endAllSessionsCtrl,
  createPairTokenCtrl,
  getPairStatusCtrl,
  confirmPairCtrl,
} from '../controllers/deviceController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/devices — список устройств пользователя
// ============================================================
router.get('/', authRequired, getDevicesCtrl);

// ============================================================
// POST /api/devices/pair-token — сгенерировать QR-код привязки
// (без авторизации: новое устройство ещё не вошло; docs/04, add-device.md)
// ============================================================
router.post('/pair-token', createPairTokenCtrl);

// ============================================================
// GET /api/devices/pair/:token/status — статус кода привязки
// (pending/confirmed/expired; при confirmed — auth-cookie в ответе)
// ============================================================
router.get('/pair/:token/status', getPairStatusCtrl);

// ============================================================
// POST /api/devices/pair/confirm — подтверждение входа
// (с авторизованного устройства, отсканировавшего QR)
// ============================================================
router.post('/pair/confirm', authRequired, confirmPairCtrl);

// ============================================================
// DELETE /api/devices/:id — завершить сессию устройства
// ============================================================
router.delete('/:id', authRequired, endSessionCtrl);

// ============================================================
// POST /api/devices/end-all — завершить все сессии кроме текущей
// ============================================================
router.post('/end-all', authRequired, endAllSessionsCtrl);

export { router };
