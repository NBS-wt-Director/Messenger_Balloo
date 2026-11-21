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

// --- Лимитер для сервисных эмуляционных эндпоинтов (/api/service/*) ---
// Доступ закрыт длинным секретом (SERVICE_API_KEY), но наполнение тестовыми
// данными — это много последовательных запросов, поэтому лимит выше общего
// apiLimiter (100/15мин). Барьер против перебора ключа сохраняется.
export const serviceLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много сервисных запросов, попробуйте позже',
    retryAfter: '15 minutes',
  },
  keyGenerator: getClientId,
});

// --- Лимитер для OAuth (GET-редиректы) ---
// OAuth: 10 req/min на IP (state-параметр + callback могут дать несколько
// редиректов на один вход, поэтому не 5 как authLimiter)
export const oauthLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // 10 запросов на минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много OAuth-запросов. Подождите 1 минуту',
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
  // Service API (/api/service/*) — отдельный, более щедрый лимитер: эмуляция
  // создаёт много сущностей подряд, общий apiLimiter (100/15мин) мешал бы.
  const isServiceApi = req.path.startsWith('/api/service/');
  // P28 (2026-09-19): GET /api/auth/oauth/* — это 302-редиректы (начало OAuth
  // и колбэки провайдеров), а не ввод учётных данных. authLimiter (5/мин)
  // срабатывал на приёмке раньше, чем проверялись все 4 провайдера, и браузер
  // показывал сырой JSON 429. Строгий лимит остаётся на POST (ввод данных)
  // и остальных /api/auth/* маршрутах.
  //
  // P39 (2026-10-05): OAuth GET-маршруты теперь имеют отдельный oauthLimiter
  // (10/мин) вместо общего apiLimiter (100/15мин).
  //
  // Тик. 1793567633 (приёмка «два окна», 15.11.2026): в authLimiter (5/мин)
  // попадали и служебные вызовы уже авторизованной сессии —
  //   GET  /api/auth/ws-token      (берёт WS-токен из cookie),
  //   POST /api/auth/refresh-cookie (продлевает пару токенов).
  // Оба выполняются при каждом открытии приложения: React StrictMode дублирует
  // эффект, поэтому ДВЕ вкладки с двумя аккаунтами выжигали лимит (2 refresh +
  // 1 login на вкладку) и второй вход падал с 429 «Слишком много попыток
  // авторизации» — то есть нормальный пользователь не мог зайти вторым окном.
  // Это не подбор пароля: учётные данные в этих запросах не участвуют, а у
  // refresh-cookie есть checkRefreshOrigin + валидация httpOnly-куки. Их уводит
  // общий apiLimiter (100/15мин), строгий лимит остаётся на login/register/2fa.
  const isOAuthGetRedirect =
    req.method === 'GET' && req.path.startsWith('/api/auth/oauth/');
  const isSessionMaintenance =
    req.path === '/api/auth/ws-token' || req.path === '/api/auth/refresh-cookie';

  if (isServiceApi) {
    serviceLimiter(req, res, next);
  } else if (isOAuthGetRedirect) {
    oauthLimiter(req, res, next);
  } else if (isSessionMaintenance) {
    apiLimiter(req, res, next);
  } else if (req.path.startsWith('/api/auth/') && !isOAuthGetRedirect) {
    authLimiter(req, res, next);
  } else if (req.path.startsWith('/api/upload/')) {
    uploadLimiter(req, res, next);
  } else if (req.path.startsWith('/api/chats/') && req.path.includes('/messages')) {
    messageLimiter(req, res, next);
  } else {
    apiLimiter(req, res, next);
  }
};
