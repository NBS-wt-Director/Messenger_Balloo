import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Интерфейс для запроса с аутентифицированным пользователем
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username?: string;
    role?: string;
  };
}

// Интерфейс токена JWT
interface JwtPayload {
  userId: string;
  email: string;
  username?: string;
  role?: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Извлечение JWT токена из заголовка Authorization
const extractToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

// Middleware для проверки access token
export const authRequired = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Токен авторизации не предоставлен',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (decoded.type !== 'access') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Недействительный тип токена',
      });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Токен истёк. Обновите access token',
      });
      return;
    }

    res.status(401).json({
      error: 'Invalid token',
      message: 'Недействительный токен авторизации',
    });
  }
};

// Middleware для проверки refresh token (опционально)
export const authRefresh = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Refresh токен не предоставлен',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

    if (decoded.type !== 'refresh') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Недействительный тип токена',
      });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Недействительный refresh токен',
    });
  }
};

// Middleware для проверки роли admin
export const adminOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Требуется авторизация',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Доступ разрешён только администраторам',
    });
    return;
  }

  next();
};
