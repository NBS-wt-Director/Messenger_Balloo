import { Request, Response, NextFunction } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// --- Helper: get client identifier (IP or user ID) ---
function getClientId(req: Request): string {
  // Если пользователь аутентифицирован — используем user ID
  const userId = (req as any).user?.id;
  if (userId) return `user:${userId}`;
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

// --- Лимитер для API (общий) ---
// Глобальный: 100 req/s (тикет №64)
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов на 15 минут
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: 'Слишком много запросов, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для аутентификации (строже) ---
// Auth endpoints: 5 req/min на IP (тикет №64)
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 5, // 5 попыток на минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много попыток авторизации. Подождите 1 минуту',
    retryAfter: '1 minute',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для сообщений ---
// Messages: 30 req/min на пользователя (тикет №64)
export const messageLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // 30 сообщений на минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много сообщений. Подождите',
    retryAfter: '1 minute',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для загрузки файлов (очень строгий) ---
// Upload: 10 req/min на пользователя (тикет №64)
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // 10 загрузок на минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Превышен лимит загрузки файлов',
    retryAfter: '1 minute',
  },
  keyGenerator: getClientId,
});

// --- Middleware для применения лимитеров ---
export const applyRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip rate limiting in test mode
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  // Стратегия лимитирования зависит от пути (тикет №64)
  if (req.path.startsWith('/api/auth/')) {
    authLimiter(req, res, next);
  } else if (req.path.startsWith('/api/upload/')) {
    uploadLimiter(req, res, next);
  } else if (req.path.startsWith('/api/chats/') && req.path.includes('/messages')) {
    messageLimiter(req, res, next);
  } else {
    apiLimiter(req, res, next);
  }
};
