import { Request, Response, NextFunction } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ACCESS_COOKIE } from './auth';

// --- Общие параметры лимитов (решение владельца 22.11.2026, тик. 1795343610) ---
// Единое окно 15 минут и потолок 3000 запросов для ВСЕХ лимитеров.
// Прежний apiLimiter (100/15мин) выжигался одним активным клиентом, а ответ
// 429 клиент трактовал как «сессия истекла» и уводил пользователя на экран
// входа. Лимит остаётся барьером против флуда, но не мешает нормальной работе.
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 3000;

/**
 * Ключ лимитирования — «на каждого свой» (тик. 1795343610).
 *
 * 1. `req.user` — если лимитер стоит после authRequired.
 * 2. Иначе (глобальный лимитер в app.ts идёт ДО auth) — берём userId из
 *    access-cookie и ПРОВЕРЯЕМ подпись: иначе произвольной cookie можно было бы
 *    подделать ключ и обойти лимит.
 * 3. Гость — по реальному IP: `trust proxy=1` в app.ts отдаёт адрес клиента,
 *    а не адрес прокси-контейнера (иначе лимит был бы один на всех).
 */
export function getClientId(req: Request): string {
  // Если пользователь аутентифицирован — используем user ID
  const userId = (req as any).user?.id;
  if (userId) return `user:${userId}`;

  const token = req.cookies?.[ACCESS_COOKIE];
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId?: string };
      if (decoded?.userId) return `user:${decoded.userId}`;
    } catch {
      // Истёкший/битый токен — считаем как гостя по IP.
    }
  }

  return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
}

// --- Лимитер для API (общий) ---
// Общий потолок: 3000 запросов / 15 минут (тик. 1795343610).
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: 'Слишком много запросов, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для аутентификации ---
// До 22.11.2026 был строже (5/мин); теперь общий потолок 3000/15мин
// (тик. 1795343610). Барьер против флуда сохранён, а ключ «на каждого свой»
// (user/IP) не даёт одному клиенту выжечь лимит за всех.
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много попыток авторизации, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для сообщений ---
export const messageLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много сообщений, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для загрузки файлов ---
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Превышен лимит загрузки файлов',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для сервисных эмуляционных эндпоинтов (/api/service/*) ---
// Доступ закрыт длинным секретом (SERVICE_API_KEY), барьер против перебора
// ключа сохраняется. С 22.11.2026 — те же 3000/15мин, что и остальные
// (тик. 1795343610).
export const serviceLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много сервисных запросов, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для OAuth (GET-редиректы) ---
// GET-редиректы (начало OAuth и колбэки провайдеров) не являются вводом
// учётных данных, но с 22.11.2026 делят общий потолок 3000/15мин
// (тик. 1795343610).
export const oauthLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много OAuth-запросов, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

/**
 * Выбор лимитера по пути и методу запроса (тик. 1795343610).
 * Экспортируется для юнит-тестов маршрутизации.
 *
 * Порядок веток важен:
 *   • Service API (/api/service/*) — отдельный лимитер: эмуляция создаёт много
 *     сущностей подряд пачкой последовательных запросов.
 *   • P28/P39: GET /api/auth/oauth/* — 302-редиректы (начало OAuth и колбэки
 *     провайдеров), а не ввод учётных данных → отдельный oauthLimiter.
 *   • Тик. 1793567633: служебные вызовы уже авторизованной сессии
 *     (GET /api/auth/ws-token, POST /api/auth/refresh-cookie) выполняются при
 *     каждом открытии приложения (React StrictMode дублирует эффект) и не
 *     являются вводом учётных данных → общий apiLimiter, а не authLimiter.
 */
export function pickLimiter(req: Request): RateLimitRequestHandler {
  if (req.path.startsWith('/api/service/')) return serviceLimiter;

  if (req.method === 'GET' && req.path.startsWith('/api/auth/oauth/')) return oauthLimiter;

  if (req.path === '/api/auth/ws-token' || req.path === '/api/auth/refresh-cookie') {
    return apiLimiter;
  }

  if (req.path.startsWith('/api/auth/')) return authLimiter;
  if (req.path.startsWith('/api/upload/')) return uploadLimiter;
  if (req.path.startsWith('/api/chats/') && req.path.includes('/messages')) return messageLimiter;

  return apiLimiter;
}

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

  pickLimiter(req)(req, res, next);
};
