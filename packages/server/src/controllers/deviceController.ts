// deviceController.ts — Контроллер для управления устройствами
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, setAuthCookies } from '../middleware/auth';
import {
  getDevices,
  endSession,
  endAllSessions,
  createPairToken,
  getPairRecord,
  deletePairRecord,
  confirmPair,
  PairError,
} from '../services/deviceService';

export const getDevicesCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await getDevices(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

export const endSessionCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({ error: 'Bad Request', message: 'Session ID обязателен' });
      return;
    }
    const result = await endSession(sessionId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Сессия не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Доступ запрещён') {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

export const endAllSessionsCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    // Текущая сессия — из токена (или можно передать в body)
    const currentSessionId = (req as any).sessionId;
    const result = await endAllSessions(userId, currentSessionId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// QR pair-token — вход/привязка устройства по QR-коду
// ============================================================

// POST /api/devices/pair-token — сгенерировать код (без авторизации)
export const createPairTokenCtrl = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const info = await createPairToken();
    res.status(201).json(info);
  } catch (error: any) {
    if (error instanceof PairError && error.code === 'PAIR_UNAVAILABLE') {
      res.status(503).json({ error: 'Service Unavailable', message: error.message });
      return;
    }
    next(error);
  }
};

// GET /api/devices/pair/:token/status — статус кода.
// При confirmed: сервер ставит httpOnly auth-cookie прямо в этом ответе
// (токены не отдаются в body) и удаляет код — он одноразовый.
export const getPairStatusCtrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    if (!token || !/^[a-f0-9]{48}$/.test(token)) {
      res.status(400).json({ error: 'Bad Request', message: 'Некорректный код привязки' });
      return;
    }

    const record = await getPairRecord(token);
    if (!record) {
      res.json({ status: 'expired' });
      return;
    }
    if (record.status === 'pending') {
      res.json({ status: 'pending' });
      return;
    }

    // confirmed: выдаём cookie и погашаем код
    setAuthCookies(res, record.accessToken!, record.refreshToken!);
    await deletePairRecord(token);
    res.json({
      status: 'confirmed',
      user: { username: record.username ?? null, avatarUrl: record.avatarUrl ?? null },
    });
  } catch (error: any) {
    if (error instanceof PairError && error.code === 'PAIR_UNAVAILABLE') {
      res.status(503).json({ error: 'Service Unavailable', message: error.message });
      return;
    }
    next(error);
  }
};

// POST /api/devices/pair/confirm — подтверждение с авторизованного устройства
export const confirmPairCtrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { token, deviceType, deviceName, platform } = req.body || {};

    if (!token || typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) {
      res.status(400).json({ error: 'Bad Request', message: 'Некорректный код привязки' });
      return;
    }

    const validTypes = ['web', 'desktop', 'android', 'ios'] as const;
    const type: (typeof validTypes)[number] = validTypes.includes(deviceType) ? deviceType : 'web';

    const result = await confirmPair(
      token,
      { id: user.id, email: user.email, username: user.username, role: user.role },
      { type, name: deviceName, platform, ip: req.ip }
    );

    res.json({ message: 'Вход подтверждён', deviceId: result.deviceId });
  } catch (error: any) {
    if (error instanceof PairError) {
      const status =
        error.code === 'PAIR_NOT_FOUND' ? 404 : error.code === 'PAIR_ALREADY_CONFIRMED' ? 409 : 503;
      const httpError =
        error.code === 'PAIR_NOT_FOUND' ? 'Not Found' :
        error.code === 'PAIR_ALREADY_CONFIRMED' ? 'Conflict' : 'Service Unavailable';
      res.status(status).json({ error: httpError, message: error.message });
      return;
    }
    next(error);
  }
};
