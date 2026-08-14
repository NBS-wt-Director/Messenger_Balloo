import { Router } from 'express';
import {
  createDonation,
  getTiers,
  getUserDonations,
  yookassaWebhook,
  getConfig,
  getAdminConfig,
  updateAdminConfig,
  getAdminDonations,
  confirmDonation,
} from '../controllers/paymentController';
import { authRequired, adminOnly } from '../middleware/auth';

const router = Router() as import('express').Router;

// ============================================================
// Публичные эндпоинты
// ============================================================

// GET /api/payments/config — конфигурация платежей (режим, QR, номер)
router.get('/config', getConfig);

// GET /api/payments/tiers — уровни донатов (публичный)
router.get('/tiers', getTiers);

// POST /api/payments/webhook/yookassa — HTTP-уведомления от ЮKassa
router.post('/webhook/yookassa', yookassaWebhook);

// ============================================================
// Эндпоинты, требующие авторизации
// ============================================================

// POST /api/payments/donate — создание платежа
router.post('/donate', authRequired, createDonation);

// GET /api/payments/me/donations — история донатов текущего пользователя
router.get('/me/donations', authRequired, getUserDonations);

// ============================================================
// Админ-эндпоинты
// ============================================================

// GET /api/payments/admin/config — настройки платежей
router.get('/admin/config', authRequired, adminOnly, getAdminConfig);

// PUT /api/payments/admin/config — обновление настроек
router.put('/admin/config', authRequired, adminOnly, updateAdminConfig);

// GET /api/payments/admin/donations — список всех донатов
router.get('/admin/donations', authRequired, adminOnly, getAdminDonations);

// POST /api/payments/admin/confirm/:id — подтверждение ручного доната
router.post('/admin/confirm/:id', authRequired, adminOnly, confirmDonation);

export { router };
