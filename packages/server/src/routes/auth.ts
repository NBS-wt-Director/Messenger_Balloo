import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  register,
  login,
  verify2FA,
  refreshCookie,
  clearCookie,
  logout,
  verifyEmail,
  requestReset,
  resetPassword,
  oauthLogin,
  yandexCallback,
  enable2FA,
  verify2FAEnable,
  disable2FA,
  getDevices,
  revokeDeviceController,

} from '../controllers/authController';
import { authRequired, authRefresh } from '../middleware/auth';
import { wsToken as wsTokenCtrl } from '../controllers/wsTokenController';

// ============================================================
// Публичные маршруты (без auth)
// ============================================================

// Регистрация
router.post('/register', register);

// Логин
router.post('/login', login);

// Верификация 2FA (после login с needs2FA)
router.post('/2fa/verify', verify2FA);

// Обновление cookie через refresh token (принимает refreshToken из body)

// Временный токен для WebSocket
router.get('/ws-token', wsTokenCtrl);
router.post('/refresh-cookie', refreshCookie);

// Удаление cookie (logout для web)
router.post('/clear-cookie', clearCookie);

// Обновление токена (старый endpoint, для обратной совместимости)
router.post('/refresh', authRefresh, refreshCookie);

// Выход (старый endpoint, для обратной совместимости)
router.post('/logout', logout);

// Верификация email
router.post('/verify-email', verifyEmail);

// Запрос сброса пароля
router.post('/request-reset', requestReset);

// Сброс пароля
router.post('/reset-password', resetPassword);

// ============================================================
// OAuth маршруты (публичные)
// ============================================================

// POST — фронтенд сам получает данные от провайдера и шлёт на бэкенд
router.post('/oauth/:provider', oauthLogin);

// GET — callback от OAuth-провайдера (Яндекс)
router.get('/oauth/yandex-callback', yandexCallback);

// ============================================================
// Защищённые маршруты (требуют auth)
// ============================================================

// Включение 2FA
router.post('/2fa/enable', authRequired, enable2FA);

// Подтверждение включения 2FA
router.post('/2fa/verify-enable', authRequired, verify2FAEnable);

// Отключение 2FA
router.post('/2fa/disable', authRequired, disable2FA);

// ============================================================
// Управление устройствами
// ============================================================

// Список устройств
router.get('/devices', authRequired, getDevices);

// Удаление устройства
router.delete('/devices/:deviceId', authRequired, revokeDeviceController);

export { router };