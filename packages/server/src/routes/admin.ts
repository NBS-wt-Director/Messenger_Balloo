import { Router } from 'express';
import {
  listUsers,
  banUser,
  unbanUser,
  suspendUser,
  deleteUser,
  listReports,
  resolveReport,
  listBans,
  createAnnouncement,
  listAnnouncements,
  listFeatureFlags,
  toggleFeatureFlag,
  listVersions,
  publishVersion,
  getMetrics,
  listAuditLogs,
} from '../controllers/adminController';
import { authRequired, adminOnly } from '../middleware/auth';

const router = Router() as import('express').Router;

// ============================================================
// Все маршруты админки требуют авторизации и роли admin
// ============================================================

// ----------------------------------------------------------
// Пользователи
// ----------------------------------------------------------

// GET /api/admin/users — список пользователей (filter, search, pagination)
router.get('/users', authRequired, adminOnly, listUsers);

// POST /api/admin/users/:id/ban — забанить пользователя
router.post('/users/:id/ban', authRequired, adminOnly, banUser);

// POST /api/admin/users/:id/unban — снять бан
router.post('/users/:id/unban', authRequired, adminOnly, unbanUser);

// POST /api/admin/users/:id/suspend — временная блокировка
router.post('/users/:id/suspend', authRequired, adminOnly, suspendUser);

// POST /api/admin/users/:id/delete — удаление аккаунта
router.post('/users/:id/delete', authRequired, adminOnly, deleteUser);

// ----------------------------------------------------------
// Жалобы
// ----------------------------------------------------------

// GET /api/admin/reports — список жалоб
router.get('/reports', authRequired, adminOnly, listReports);

// POST /api/admin/reports/:id/resolve — решение по жалобе
router.post('/reports/:id/resolve', authRequired, adminOnly, resolveReport);

// ----------------------------------------------------------
// Баны
// ----------------------------------------------------------

// GET /api/admin/bans — список банов
router.get('/bans', authRequired, adminOnly, listBans);

// ----------------------------------------------------------
// Объявления
// ----------------------------------------------------------

// GET /api/admin/announcements — список объявлений
router.get('/announcements', authRequired, adminOnly, listAnnouncements);

// POST /api/admin/announcements — создать объявление
router.post('/announcements', authRequired, adminOnly, createAnnouncement);

// ----------------------------------------------------------
// Feature Flags
// ----------------------------------------------------------

// GET /api/admin/feature-flags — список флагов
router.get('/feature-flags', authRequired, adminOnly, listFeatureFlags);

// POST /api/admin/feature-flags/:id/toggle — переключить флаг
router.post('/feature-flags/:id/toggle', authRequired, adminOnly, toggleFeatureFlag);

// ----------------------------------------------------------
// Версии
// ----------------------------------------------------------

// GET /api/admin/versions — список версий
router.get('/versions', authRequired, adminOnly, listVersions);

// POST /api/admin/versions — публикация версии
router.post('/versions', authRequired, adminOnly, publishVersion);

// ----------------------------------------------------------
// Метрики
// ----------------------------------------------------------

// GET /api/admin/metrics — метрики сервиса
router.get('/metrics', authRequired, adminOnly, getMetrics);

// ----------------------------------------------------------
// Логи аудита
// ----------------------------------------------------------

// GET /api/admin/audit-logs — логи действий
router.get('/audit-logs', authRequired, adminOnly, listAuditLogs);

export { router };
