import { Request, Response, NextFunction } from 'express';
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
  enable2FA as enable2FAService,
  verify2FA as verify2FAService,
  verify2FAEnable as verify2FAEnableService,
  disable2FA as disable2FAService,
  getUserDevices,
  revokeDevice,
} from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// Helper: извлечение тела запроса с валидацией
// ============================================================

const getBody = <T>(req: Request, schema: any): T => {
  const body = req.body;
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map((e: any) => e.message).join(', ')}`);
  }
  return result.data as T;
};

// ============================================================
// Регистрация
// ============================================================

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log('[REGISTER] Request received');
  try {
    const { email, password, username } = req.body;
    console.log('[REGISTER] Body:', { email, username });

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email и пароль обязательны',
      });
      return;
    }

    const result = await registerService({ email, password, username });

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
      tokens: result.tokens,
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

    const response: any = {
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        status: result.user.status,
        language: result.user.language,
        avatarUrl: result.user.avatarUrl,
        needs2FA: result.user.needs2FA,
      },
    };

    if (!result.user.needs2FA && result.tokens) {
      response.tokens = result.tokens;
    }

    res.json(response);
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
      tokens: result.tokens,
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
};

// ============================================================
// Refresh токена
// ============================================================

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh токен обязателен',
      });
      return;
    }

    const tokens = await refreshService(refreshToken);

    res.json({ tokens });
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
};

// ============================================================
// Logout
// ============================================================

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh токен обязателен',
      });
      return;
    }

    await logoutService(refreshToken);

    res.json({ message: 'Выход выполнен успешно' });
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
// OAuth callback — Яндекс (GET)
// ============================================================

export const yandexCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code) {
      res.status(400).json({ error: 'Bad Request', message: 'Authorization code is required' });
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

    // Редирект на фронтенд с токенами
    const frontendUrl = `${process.env.CORS_ORIGIN || 'https://balloo.su'}/auth/success`;
    res.redirect(302, `${frontendUrl}?access_token=${result.tokens.accessToken}&refresh_token=${result.tokens.refreshToken}`);
  } catch (error: any) {
    console.error('[YANDEX CALLBACK] Error:', error);
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
      tokens: result.tokens,
    });
  } catch (error: any) {
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
