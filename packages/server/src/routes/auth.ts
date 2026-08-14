import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  register,
  login,
  verify2FA,
  refresh,
  logout,
  verifyEmail,
  requestReset,
  resetPassword,
  oauthLogin,
  enable2FA,
  verify2FAEnable,
  disable2FA,
  getDevices,
  revokeDeviceController,
} from '../controllers/authController';
import { authRequired, authRefresh } from '../middleware/auth';

// ============================================================
// Публичные маршруты (без auth)
// ============================================================

// Регистрация
router.post('/register', register);

// Логин
router.post('/login', login);

// Верификация 2FA (после login с needs2FA)
router.post('/2fa/verify', verify2FA);

// Обновление токена
router.post('/refresh', authRefresh, refresh);

// Выход
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

router.post('/oauth/:provider', oauthLogin);

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
