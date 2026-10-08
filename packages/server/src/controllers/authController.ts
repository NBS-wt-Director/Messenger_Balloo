import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import {
  register as registerService,
  login as loginService,
  refreshTokens as refreshService,
  logout as logoutService,
  verifyEmail as verifyEmailService,
  requestPasswordReset as requestResetService,
  resetPassword as resetPasswordService,
  oauthLogin as oauthLoginService,
  exchangeYandexCode,
  getYandexUser,
  getOAuthAuthorizeUrl,
  isOAuthProviderConfigured,
  exchangeVkCode,
  exchangeMailruCode,
  getMailruUser,
  enable2FA as enable2FAService,
  verify2FA as verify2FAService,
  verify2FAEnable as verify2FAEnableService,
  disable2FA as disable2FAService,
  getUserDevices,
  revokeDevice,
  OAuthAccountInactiveError,
} from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE } from '../middleware/auth';
import { getWsToken } from '../services/authService';
import { revokeAllSessions } from '../services/sessionRevocation';
export { wsToken } from './wsTokenController';

// ============================================================
// Helper: мобильный клиент?
// Мобильные приложения (Expo/RN) не могут использовать httpOnly cookie
// надёжно (Bearer-заголовок + WebSocket), поэтому для них токены
// дополнительно возвращаются в body. Web-клиенты продолжают
// получать токены только через httpOnly cookie.
// DeviceType enum в БД: web | desktop | android | ios
const MOBILE_DEVICE_TYPES = ['mobile', 'android', 'ios'];
const isMobileClient = (req: Request): boolean =>
  MOBILE_DEVICE_TYPES.includes(req.body?.deviceInfo?.type);

// ============================================================
// Регистрация
// ============================================================

// Серверная валидация регистрации (docs/12 §6.2). Раньше контроллер
// проверял только непустоту, а минимум 8 символов жил лишь на фронте —
// пароль из 3 символов проходил через прямой запрос к API.
const registerSchema = z.object({
  email: z.string().min(1, 'Email и пароль обязательны').email('Некорректный email'),
  password: z
    .string({ required_error: 'Email и пароль обязательны' })
    .min(8, 'Пароль должен содержать минимум 8 символов'),
  username: z.string().min(1).max(50).optional(),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log('[REGISTER] Request received');
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Bad Request',
        message: parsed.error.errors[0].message,
      });
      return;
    }

    const { email, password, username } = parsed.data;
    console.log('[REGISTER] Body:', { email, username });

    const result = await registerService({ email, password, username });

    // Устанавливаем httpOnly cookie вместо возврата токенов в body
    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);

    res.status(201).json({
      message: 'Регистрация успешна',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        status: result.user.status,
        language: result.user.language,
        avatarUrl: result.user.avatarUrl,
      },
      // Токены в body — только для мобильных клиентов (web получает их через httpOnly cookie)
      ...(isMobileClient(req) ? { tokens: result.tokens } : {}),
    });
  } catch (error: any) {
    if (error.message.includes('уже') || error.message.includes('занят')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Логин
// ============================================================

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, deviceInfo } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email и пароль обязательны',
      });
      return;
    }

    const result = await loginService({
      email,
      password,
      deviceInfo: deviceInfo || { type: 'web' },
    });

    if (result.user.needs2FA) {
      // 2FA required — токены не устанавливаем
      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          status: result.user.status,
          language: result.user.language,
          avatarUrl: result.user.avatarUrl,
          needs2FA: true,
        },
      });
      return;
    }

    // Устанавливаем httpOnly cookie
    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        status: result.user.status,
        language: result.user.language,
        avatarUrl: result.user.avatarUrl,
        needs2FA: false,
      },
      // Токены в cookie, не в body (для мобильных клиентов — в body, см. isMobileClient)
      ...(isMobileClient(req) ? { tokens: result.tokens } : {}),
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
};

// ============================================================
// Верификация 2FA
// ============================================================

export const verify2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, deviceInfo } = req.body;

    if (!email || !code) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email и код обязательны',
      });
      return;
    }

    const result = await verify2FAService({
      email,
      code,
      deviceInfo: deviceInfo || { type: 'web' },
    });

    // Устанавливаем httpOnly cookie
    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        status: result.user.status,
        language: result.user.language,
        avatarUrl: result.user.avatarUrl,
        needs2FA: false,
      },
      ...(isMobileClient(req) ? { tokens: result.tokens } : {}),
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
};

// ============================================================
// Refresh cookie — обновление httpOnly cookie
// Принимает refreshToken из body (для первоначального refresh)
// ============================================================

export const refreshCookie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Refresh token берём из body (для мобильных/API клиентов)
    // либо из httpOnly cookie (для web — авто-refresh при 401 в api.ts)
    const refreshToken = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh токен обязателен',
      });
      return;
    }

    const tokens = await refreshService(refreshToken);

    // Обновляем httpOnly cookie
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Для мобильных клиентов возвращаем новые токены в body
    res.json(
      req.body?.client === 'mobile'
        ? { message: 'Tokens refreshed', tokens }
        : { message: 'Tokens refreshed' }
    );
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
};

// ============================================================
// Clear cookie — удаление httpOnly cookie (logout)
// ============================================================

export const clearCookie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Очищаем httpOnly cookie
    clearAuthCookies(res);

    // Также очищаем refresh токен из body, если передан
    const { refreshToken, allDevices } = req.body;
    if (refreshToken) {
      await logoutService(refreshToken, allDevices === true);
    }

    res.json({ message: 'Выход выполнен успешно' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Logout (старый — для обратной совместимости с API)
// ============================================================

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken, allDevices } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh токен обязателен',
      });
      return;
    }

    // allDevices=true — выйти на всех устройствах, а не только на этом
    await logoutService(refreshToken, allDevices === true);

    res.json({ message: 'Выход выполнен успешно' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

/**
 * Выход на всех устройствах (POST /api/auth/logout-all).
 * Требует аутентификации. Отзывает все refresh-токены пользователя.
 */
export const logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    await revokeAllSessions(userId);
    clearAuthCookies(res);
    res.json({ message: 'Выход выполнен на всех устройствах' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Верификация email
// ============================================================

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Токен верификации обязателен',
      });
      return;
    }

    await verifyEmailService({ token });

    res.json({ message: 'Email успешно верифицирован' });
  } catch (error: any) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
};

// ============================================================
// Запрос сброса пароля
// ============================================================

export const requestReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email обязателен',
      });
      return;
    }

    const result = await requestResetService({ email });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Сброс пароля
// ============================================================

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Токен и новый пароль обязательны',
      });
      return;
    }

    await resetPasswordService({ token, newPassword });

    res.json({ message: 'Пароль успешно сброшен' });
  } catch (error: any) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
};

// ============================================================
// OAuth helpers (P21): фронтенд редиректит пользователя на
// GET /api/auth/oauth/:provider — сервер отвечает 302 на authorize URL
// провайдера. Провайдер не настроен (нет CLIENT_ID/SECRET) → 302 обратно
// на /#/login?oauth_error=not_configured (дружелюбная ошибка, не JSON 404).
// ============================================================

// Origin фронтенда для возврата после OAuth. Берём из APP_URL (один URL),
// НЕ из CORS_ORIGIN — с тикета №0 мультитикета поддоменов CORS_ORIGIN это
// разрешительный СПИСОК через запятую, вставка которого в редирект дала бы
// битый URL вида https://balloo.su,https://admin.balloo.su,.../#/chat.
const oauthFrontendUrl = (): string =>
  process.env.APP_URL || 'https://balloo.su';

const oauthErrorRedirect = (res: Response, provider: string, reason: string): void => {
  const url = `${oauthFrontendUrl()}/#/login?oauth_error=${encodeURIComponent(reason)}&provider=${encodeURIComponent(provider)}`;
  res.redirect(302, url);
};

/**
 * Проверяет state-параметр из query против httpOnly cookie.
 * Вызывается в каждом callback. Возвращает true, если state совпадает.
 * Удаляет cookie после проверки (одноразовое использование).
 */
const verifyOAuthState = (req: Request, res: Response): boolean => {
  const cookieState = req.cookies['oauth-state'];
  const queryState = req.query.state as string | undefined;
  res.clearCookie('oauth-state');
  if (!cookieState || !queryState || cookieState !== queryState) {
    return false;
  }
  return true;
};

// GET /api/auth/oauth/:provider — начало OAuth (302 на провайдера)
export const oauthAuthorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const provider = String(req.params.provider || '').toLowerCase();

    const authorizeUrl = getOAuthAuthorizeUrl(provider);
    if (!authorizeUrl) {
      // Провайдер не настроен (rambler/max или отсутствуют env) — дружелюбная ошибка
      oauthErrorRedirect(res, provider, 'not_configured');
      return;
    }

    // CSRF-защита: генерируем state, храним в httpOnly cookie, добавляем в URL
    const oauthState = crypto.randomBytes(32).toString('hex');
    res.cookie('oauth-state', oauthState, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 минут
    });

    // Добавляем state в URL
    const separator = authorizeUrl.includes('?') ? '&' : '?';
    res.redirect(302, `${authorizeUrl}${separator}state=${encodeURIComponent(oauthState)}`);
  } catch (error: any) {
    console.error(`[OAUTH AUTHORIZE] Error:`, error);
    oauthErrorRedirect(res, String(req.params.provider || ''), 'authorize_failed');
  }
};

// ============================================================
// OAuth callback — Яндекс (GET)
// ============================================================

export const yandexCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      res.status(400).json({ error: 'Bad Request', message: 'Authorization code is required' });
      return;
    }

    if (!verifyOAuthState(req, res)) {
      oauthErrorRedirect(res, 'yandex', 'state_mismatch');
      return;
    }

    // Обмен code на access token
    const tokenData = (await exchangeYandexCode(code as string)) as { access_token: string };
    const accessToken = tokenData.access_token;

    // Получение данных пользователя
    const userData = await getYandexUser(accessToken);

    // Логин/регистрация пользователя
    const result = await oauthLoginService({
      provider: 'yandex',
      providerId: userData.providerId,
      email: userData.email,
      username: userData.username,
      avatarUrl: userData.avatarUrl,
      accessToken,
    });

    // Редирект на фронтенд — токены в httpOnly cookie (P21: hash-роутер → /#/chat)
    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);
    res.redirect(302, `${oauthFrontendUrl()}/#/chat`);
  } catch (error: any) {
    console.error('[YANDEX CALLBACK] Error:', error);
    // P33: неактивный аккаунт (deleted/banned/suspended) — свой код ошибки,
    // фронт покажет понятный текст вместо общего «не удалось войти»
    if (error instanceof OAuthAccountInactiveError) {
      oauthErrorRedirect(res, 'yandex', 'account_inactive');
      return;
    }
    oauthErrorRedirect(res, 'yandex', 'callback_failed');
  }
};

// ============================================================
// OAuth callback — VK (GET /api/auth/oauth/vk/callback)
// ============================================================

export const vkCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      oauthErrorRedirect(res, 'vk', 'no_code');
      return;
    }

    if (!verifyOAuthState(req, res)) {
      oauthErrorRedirect(res, 'vk', 'state_mismatch');
      return;
    }

    // Обмен code на access token (user_id + email при scope=email)
    const tokenData = await exchangeVkCode(code as string);

    // Логин/регистрация пользователя
    const result = await oauthLoginService({
      provider: 'vk',
      providerId: tokenData.providerId,
      email: tokenData.email,
      username: tokenData.email ? tokenData.email.split('@')[0] : undefined,
      accessToken: tokenData.accessToken,
    });

    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);
    res.redirect(302, `${oauthFrontendUrl()}/#/chat`);
  } catch (error: any) {
    console.error('[VK CALLBACK] Error:', error);
    // P33: неактивный аккаунт — свой код ошибки (см. yandexCallback)
    if (error instanceof OAuthAccountInactiveError) {
      oauthErrorRedirect(res, 'vk', 'account_inactive');
      return;
    }
    oauthErrorRedirect(res, 'vk', 'callback_failed');
  }
};

// ============================================================
// OAuth callback — Mail.ru (GET /api/auth/oauth/mailru/callback)
// ============================================================

export const mailruCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      oauthErrorRedirect(res, 'mailru', 'no_code');
      return;
    }

    if (!verifyOAuthState(req, res)) {
      oauthErrorRedirect(res, 'mailru', 'state_mismatch');
      return;
    }

    // Обмен code на access token
    const tokenData = await exchangeMailruCode(code as string);

    // Данные пользователя (email, имя)
    const userData = await getMailruUser(tokenData.access_token);

    // Логин/регистрация пользователя (providerId — x_mailru_vid)
    const result = await oauthLoginService({
      provider: 'mailru',
      providerId: tokenData.x_mailru_vid,
      email: userData.email,
      username: userData.username,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in
        ? Math.floor(Date.now() / 1000) + tokenData.expires_in
        : undefined,
    });

    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);
    res.redirect(302, `${oauthFrontendUrl()}/#/chat`);
  } catch (error: any) {
    console.error('[MAILRU CALLBACK] Error:', error);
    // P33: неактивный аккаунт — свой код ошибки (см. yandexCallback)
    if (error instanceof OAuthAccountInactiveError) {
      oauthErrorRedirect(res, 'mailru', 'account_inactive');
      return;
    }
    oauthErrorRedirect(res, 'mailru', 'callback_failed');
  }
};

// ============================================================
// OAuth логин
// ============================================================

export const oauthLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider, providerId, email, username, avatarUrl, accessToken, refreshToken, expiresAt, deviceInfo } = req.body;

    if (!provider || !providerId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Provider и providerId обязательны',
      });
      return;
    }

    const result = await oauthLoginService({
      provider: provider as any,
      providerId,
      email,
      username,
      avatarUrl,
      accessToken,
      refreshToken,
      expiresAt,
      deviceInfo: deviceInfo || { type: 'web' },
    });

    // Устанавливаем httpOnly cookie
    setAuthCookies(res, result.tokens!.accessToken, result.tokens!.refreshToken);

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        status: result.user.status,
        language: result.user.language,
        avatarUrl: result.user.avatarUrl,
        needs2FA: result.user.needs2FA,
      },
      // Токены в cookie, не в body
    });
  } catch (error: any) {
    // P33: неактивный аккаунт (deleted/banned/suspended) — 403 с понятным
    // сообщением, не 500 и не молчаливый вход под чужим аккаунтом
    if (error instanceof OAuthAccountInactiveError) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// 2FA: Включение
// ============================================================

export const enable2FA = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { method } = req.body;

    const result = await enable2FAService({ userId, method });

    res.json({
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
      backupCodes: result.backupCodes,
      message: 'Отсканируйте QR-код и подтвердите код для включения 2FA',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// 2FA: Подтверждение включения
// ============================================================

export const verify2FAEnable = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Код обязателен',
      });
      return;
    }

    await verify2FAEnableService({ userId, code });

    res.json({ message: '2FA успешно включена' });
  } catch (error: any) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
};

// ============================================================
// 2FA: Отключение
// ============================================================

export const disable2FA = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    await disable2FAService({ userId });

    res.json({ message: '2FA успешно отключена' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Устройства пользователя
// ============================================================

export const getDevices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const devices = await getUserDevices(userId);
    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

export const revokeDeviceController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { deviceId } = req.params;

    if (!deviceId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Device ID обязателен',
      });
      return;
    }

    await revokeDevice(userId, deviceId);
    res.json({ message: 'Устройство удалено' });
  } catch (error: any) {
    res.status(404).json({ error: 'Not Found', message: error.message });
  }
};
