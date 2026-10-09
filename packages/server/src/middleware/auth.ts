import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { isSessionRevoked } from '../services/sessionRevocation';

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

/**
 * CSRF-защита для запросов, которые полагаются на access-токен из httpOnly cookie.
 *
 * Double-submit (`csrf_token` cookie === `X-CSRF-Token` header) сам по себе не
 * защищает: он лишь требует, чтобы злоумышленник умел читать cookie своей же
 * страницы. readSourceTags / deleteSourceTag вызываются из чужого iframe с
 * `credentials: 'include'` — браузер приложит cookie, а злоумышленник его не
 * читает. Поэтому проверяем происхождение запроса.
 *
 * Пустой Origin (curl, мобильные клиенты) пропускаем: без cookie-авторизации
 * они всё равно получают 401.
 */
export const requireSameOrigin = () => {
  const allowed = new Set(
    env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  );

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    let source: string | undefined;
    if (origin) {
      source = origin;
    } else if (referer) {
      try {
        source = new URL(referer).origin;
      } catch {
        // malformed referer — treat as no origin
      }
    }

    if (!source) {
      // curl, mobile, CLI — без cookie получают 401, безопасно
      next();
      return;
    }

    if (!allowed.has(source)) {
      res.status(403).json({ error: 'FORGED_ORIGIN' });
      return;
    }

    next();
  };
};

// Middleware для проверки access token
export const authRequired = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req, ACCESS_COOKIE);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Токен авторизации не предоставлен',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (decoded.type !== 'access') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Недействительный тип токена',
      });
      return;
    }

    // Проверка: не отозвана ли сессия (logout everywhere, смена пароля).
    // Middleware становится async, чтобы выполнить асинхронную проверку
    // в Redis без блокировки каждого запроса на блокирующий код.
    if (await isSessionRevoked(decoded.userId, decoded.iat)) {
      res.status(401).json({
        error: 'Token revoked',
        code: 'token_revoked',
        message: 'Сессия завершена. Войдите заново',
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
export const authRefresh = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req, REFRESH_COOKIE);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Refresh токен не предоставлен',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (decoded.type !== 'refresh') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Недействительный тип токена',
      });
      return;
    }

    // Если сессия отозвана — refresh-токен тоже невалиден
    if (await isSessionRevoked(decoded.userId, decoded.iat)) {
      res.status(401).json({
        error: 'Token revoked',
        code: 'token_revoked',
        message: 'Сессия завершена. Войдите заново',
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

// Мягкая авторизация: прикрепляет req.user при валидном access-токене,
// но не отклоняет запрос без токена (для анонимных фич)
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req, ACCESS_COOKIE);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (decoded.type === 'access') {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
      };
    }
  } catch {
    // Невалидный/истёкший токен — продолжаем без пользователя
  }

  next();
};

// ============================================================
// Утилиты для работы с httpOnly cookie
// ============================================================

// Имена cookie: в production — __Secure- префикс (требует Secure flag),
// в dev/test — старые имена для совместимости с тестами.
const isProd = env.NODE_ENV === 'production';

export const ACCESS_COOKIE = isProd ? '__Secure-balloo_at' : 'balloo-access-token';
export const REFRESH_COOKIE = isProd ? '__Secure-balloo_rt' : 'balloo-refresh-token';

// Domain для cookie: шаринг на все поддомены *.balloo.su (решение владельца 09.10.2026).
// localhost работает без domain (secure context).
const cookieDomain = isProd ? (env.COOKIE_DOMAIN || '.balloo.su') : undefined;

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  // Access token: HttpOnly; Secure (prod); SameSite=Strict; maxAge=15 минут
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000, // 15 минут
    path: '/',
    domain: cookieDomain,
  });

  // Refresh token: HttpOnly; Secure (prod); SameSite=Lax; maxAge=30 дней
  // Lax для редиректа OAuth
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    path: '/',
    domain: cookieDomain,
  });
};

// Удаление cookie (для logout)
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    path: '/',
    domain: cookieDomain,
  });
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    domain: cookieDomain,
  });
};