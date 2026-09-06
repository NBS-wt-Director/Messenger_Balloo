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

// Извлечение JWT токена из cookie или заголовка Authorization
// Приоритет: cookie (httpOnly) -> Authorization header (для API/мобильных клиентов)
const extractToken = (
  req: Request,
  cookieName: string
): string | null => {
  // 1. Проверяем httpOnly cookie (приоритет для web)
  const cookieToken = req.cookies?.[cookieName];
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Fallback: Authorization header (для API, мобильных клиентов)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
};

// Middleware для проверки access token
export const authRequired = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req, 'balloo-access-token');

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

// Middleware для проверки refresh token (для refresh-cookie эндпоинта)
export const authRefresh = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req, 'balloo-refresh-token');

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

// ============================================================
// Утилиты для работы с httpOnly cookie
// ============================================================

export const ACCESS_COOKIE = 'balloo-access-token';
export const REFRESH_COOKIE = 'balloo-refresh-token';

// Флаги cookie: Secure только для HTTPS (production)
const isProduction = env.NODE_ENV === 'production';

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  // Access token: HttpOnly; Secure; SameSite=Strict; maxAge=15 минут
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction, // Secure только в production
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000, // 15 минут
    path: '/',
  });

  // Refresh token: HttpOnly; Secure; SameSite=Lax; maxAge=30 дней
  // Lax для редиректа OAuth
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    path: '/',
  });
};

// Удаление cookie (для logout)
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
  });
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  });
};