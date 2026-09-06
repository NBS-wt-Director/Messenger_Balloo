import { Request, Response, NextFunction } from 'express';
import { getWsToken } from '../services/authService';

// ============================================================
// WS Token — временный токен для WebSocket
// ============================================================

export const wsToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies?.['balloo-access-token'];

    if (!accessToken) {
      res.status(401).json({ error: 'Unauthorized', message: 'Требуется авторизация' });
      return;
    }

    const wsTokenValue = await getWsToken(accessToken);

    res.json({ token: wsTokenValue });
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
};
