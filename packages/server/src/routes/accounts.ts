import { Router } from 'express';

const router = Router() as import('express').Router;
import { authRequired } from '../middleware/auth';
import {
  getDeviceAccounts,
  switchAccountCtrl,
  unlinkAccountCtrl,
  setAccountNotificationsCtrl,
} from '../controllers/accountsController';

// ============================================================
// Мультиаккаунт (mockups/balloo-su/accounts.md, тикет 1792124252)
// Все запросы требуют X-Device-Id (стабильный UUID устройства в web).
// ============================================================

// GET /api/accounts — список аккаунтов, подключённых к устройству
router.get('/', authRequired, getDeviceAccounts);

// POST /api/accounts/switch — мгновенное переключение активного аккаунта
router.post('/switch', authRequired, switchAccountCtrl);

// DELETE /api/accounts/:userId — отключить аккаунт от устройства
router.delete('/:userId', authRequired, unlinkAccountCtrl);

// PATCH /api/accounts/:userId/notifications — push вкл/выкл для аккаунта
router.patch('/:userId/notifications', authRequired, setAccountNotificationsCtrl);

export { router };
