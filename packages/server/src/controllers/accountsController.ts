// accountsController.ts — Мультиаккаунт: управление подключёнными аккаунтами
// Макет: mockups/balloo-su/accounts.html (приёмка 1.1.9 → 6.33, тикет 1792124252)
// API (accounts.md): GET /api/accounts, POST /api/accounts/switch,
// DELETE /api/accounts/:userId, PATCH /api/accounts/:userId/notifications
// «Добавить аккаунт» = обычный login с заголовком X-Device-Id, отдельного POST /add нет.

import { Request, Response } from 'express';
import { AuthenticatedRequest, setAuthCookies } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';
import {
  AccountsError,
  listDeviceAccounts,
  switchDeviceAccount,
  unlinkDeviceAccount,
  setAccountNotifications,
} from '../services/accountsService';

// deviceId — UUID устройства из localStorage web-клиента. Формат ограничиваем,
// чтобы в БД не попадал мусор из заголовков.
const getDeviceId = (req: Request): string | null => {
  const raw = req.header('x-device-id');
  if (!raw || !/^[A-Za-z0-9_-]{8,64}$/.test(raw)) return null;
  return raw;
};

const sendAccountsError = (res: Response, error: unknown, where: string): void => {
  if (error instanceof AccountsError) {
    res.status(error.status).json({ error: error.status === 404 ? 'Not Found' : error.status === 403 ? 'Forbidden' : 'Bad Request', message: error.message });
    return;
  }
  internalError(res, error, where);
};

// GET /api/accounts — список аккаунтов, подключённых к устройству
export const getDeviceAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: 'Bad Request', message: 'Заголовок X-Device-Id обязателен' });
    return;
  }
  try {
    const result = await listDeviceAccounts(deviceId, req.user!.id);
    res.json(result);
  } catch (error) {
    sendAccountsError(res, error, 'accountsController.getDeviceAccounts');
  }
};

// POST /api/accounts/switch { userId } — мгновенное переключение активного
// аккаунта устройства: перевыпуск httpOnly-cookie на целевой аккаунт.
export const switchAccountCtrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: 'Bad Request', message: 'Заголовок X-Device-Id обязателен' });
    return;
  }
  const { userId } = req.body || {};
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'Bad Request', message: 'userId обязателен' });
    return;
  }
  try {
    const result = await switchDeviceAccount(deviceId, userId);
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.json({ message: 'Аккаунт переключён', user: result.user });
  } catch (error) {
    sendAccountsError(res, error, 'accountsController.switchAccountCtrl');
  }
};

// DELETE /api/accounts/:userId — отключить аккаунт от устройства
// (сессия удаляется, данные остаются на сервере)
export const unlinkAccountCtrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: 'Bad Request', message: 'Заголовок X-Device-Id обязателен' });
    return;
  }
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'Bad Request', message: 'userId обязателен' });
    return;
  }
  try {
    const result = await unlinkDeviceAccount(deviceId, userId);
    res.json(result);
  } catch (error) {
    sendAccountsError(res, error, 'accountsController.unlinkAccountCtrl');
  }
};

// PATCH /api/accounts/:userId/notifications { enabled } — push для аккаунта
export const setAccountNotificationsCtrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: 'Bad Request', message: 'Заголовок X-Device-Id обязателен' });
    return;
  }
  const { userId } = req.params;
  const { enabled } = req.body || {};
  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'Bad Request', message: 'enabled (boolean) обязателен' });
    return;
  }
  try {
    const result = await setAccountNotifications(deviceId, userId, enabled);
    res.json(result);
  } catch (error) {
    sendAccountsError(res, error, 'accountsController.setAccountNotificationsCtrl');
  }
};
