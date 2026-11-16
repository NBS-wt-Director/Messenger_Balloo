import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  getDevicesCtrl,
  endSessionCtrl,
  endAllSessionsCtrl,
  renameDeviceCtrl,
  createPairTokenCtrl,
  getPairStatusCtrl,
  confirmPairCtrl,
  registerPushTokenCtrl,
  browserPushSubscribeCtrl,
  browserPushUnsubscribeCtrl,
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
// PATCH /api/devices/:id — переименовать устройство (тик. 1792335000)
// ============================================================
router.patch('/:id', authRequired, renameDeviceCtrl);

// ============================================================
// DELETE /api/devices/browser-push — удалить browser-push подписку
// (тик. 1794831100, A.3: конкретный путь ДО параметрического /:id)
// ============================================================
router.delete('/browser-push', authRequired, browserPushUnsubscribeCtrl);

// ============================================================
// DELETE /api/devices/:id — завершить сессию устройства
// ============================================================
router.delete('/:id', authRequired, endSessionCtrl);

// ============================================================
// POST /api/devices/end-all — завершить все сессии кроме текущей
// ============================================================
router.post('/end-all', authRequired, endAllSessionsCtrl);

// ============================================================
// POST /api/devices/push-token — регистрация mobile push-токена
// ============================================================
router.post('/push-token', authRequired, registerPushTokenCtrl);

// ============================================================
// POST /api/devices/browser-push — сохранить browser-push подписку
// (тик. 1794831100, часть A.3)
// ============================================================
router.post('/browser-push', authRequired, browserPushSubscribeCtrl);

export { router };
