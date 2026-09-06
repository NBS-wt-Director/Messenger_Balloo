// deviceController.ts — Контроллер для управления устройствами
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDevices, endSession, endAllSessions } from '../services/deviceService';

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
