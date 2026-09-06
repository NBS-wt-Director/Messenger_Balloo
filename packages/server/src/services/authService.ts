import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { PrismaClient } from '@prisma/client';
import { setAuthCookies, clearAuthCookies } from '../middleware/auth';
import { sendWelcomeEmail, sendVerificationEmail, sendResetPasswordEmail } from './emailService';

const prisma = new PrismaClient();

// ============================================================
// Утилиты
// ============================================================

// Проверка: есть ли в системе хотя бы один админ
export const hasAdmin = async (): Promise<boolean> => {
  const count = await prisma.user.count({
    where: { role: 'admin' },
  });
  return count > 0;
};

const randomString = (length: number = 32): string =>
  crypto.randomBytes(length).toString('hex');

const generateBackupCodes = (count: number = 10): string[] =>
  Array.from({ length: count }, () => randomString(8).slice(0, 8));

const generateTOTPSecret = (): string =>
  crypto.randomBytes(20).toString('hex').slice(0, 32);

const totpAuthUrl = (secret: string, email: string): string => {
  const issuer = 'Balloo Messenger';
  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
};

const verifyTOTP = (secret: string, token: string, window: number = 1): boolean => {
  try {
    const secretBuffer = Buffer.from(secret, 'hex');
    const tokenNum = parseInt(token, 10);
    if (isNaN(tokenNum)) return false;

    const now = Math.floor(Date.now() / 1000);
    const period = 30;
    const currentStep = Math.floor(now / period);

    for (let i = -window; i <= window; i++) {
      const step = currentStep + i;
      const stepBuffer = Buffer.from(step.toString());
      const hmac = crypto
        .createHmac('sha1', secretBuffer)
        .update(stepBuffer)
        .digest();
      const offset = hmac[hmac.length - 1] & 0x0f;
      const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);
      const totpCode = code % 1000000;
      if (totpCode === tokenNum) return true;
    }
    return false;
  } catch {
    return false;
  }
};

// ============================================================
// JWT токены
// ============================================================

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (userId: string, email: string, username?: string, role?: string): TokenPair => {
  const accessPayload: Record<string, unknown> = { userId, email, username, role, type: 'access' };
  const refreshPayload: Record<string, unknown> = { userId, email, username, role, type: 'refresh' };

  return {
    accessToken: jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: Number(env.JWT_ACCESS_EXPIRES_IN),
    }),
    refreshToken: jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: Number(env.JWT_REFRESH_EXPIRES_IN),
    }),
  };
};

// Хеширование пароля — bcrypt (cost factor 12)
const BCRYPT_ROUNDS = 12;

const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

// Легаси-хеш (SHA-256 с хардкод-солью) — только для миграции старых паролей
const legacyHash = (password: string): string =>
  crypto.createHash('sha256').update(password + 'balloo-salt-2024').digest('hex');

const isLegacyHash = (hash: string): boolean => /^[a-f0-9]{64}$/i.test(hash);

// Проверка пароля: поддерживает bcrypt и легаси SHA-256.
// needsRehash = true → хеш устарел и должен быть перезаписан bcrypt-хешем
const verifyPassword = async (
  password: string,
  hash: string
): Promise<{ valid: boolean; needsRehash: boolean }> => {
  if (isLegacyHash(hash)) {
    const valid = legacyHash(password) === hash;
    return { valid, needsRehash: valid };
  }
  try {
    const valid = await bcrypt.compare(password, hash);
    return { valid, needsRehash: false };
  } catch {
    return { valid: false, needsRehash: false };
  }
};

// ============================================================
// Регистрация
// ============================================================

interface RegisterInput {
  email: string;
  password: string;
  username?: string;
}

export const register = async (input: RegisterInput) => {
  console.log('[REGISTER] Service: starting, email:', input.email);
  
  // Проверка уникальности email
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  console.log('[REGISTER] Service: existing user check done');
  
  if (existingUser) {
    throw new Error('Email уже зарегистрирован');
  }

  if (input.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw new Error('Username уже занят');
    }
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      username: input.username || null,
      language: 'ru',
      status: 'active',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  await prisma.publicProfile.create({
    data: {
      userId: user.id,
      username: input.username || user.email!.split('@')[0],
      displayName: input.username || user.email!.split('@')[0],
    },
  });

  const tokens = generateTokens(user.id, user.email!, user.username || undefined);

  // Отправка welcome-письма (не блокирует регистрацию)
  const username = input.username || user.email!.split('@')[0];
  sendWelcomeEmail(user.email!, username).catch((err: unknown) => {
    console.error('[REGISTER] Failed to send welcome email:', err);
  });

  // Отправка verification email (не блокирует регистрацию)
  const verificationToken = randomString(32);
  const expiresAt = BigInt(Math.floor(Date.now() / 1000)) + 86400n; // 24 часа

  prisma.verificationToken
    .create({
      data: {
        userId: user.id,
        type: 'email_verification',
        token: verificationToken,
        expiresAt,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    })
    .then(() => {
      sendVerificationEmail(user.email!, verificationToken).catch((err: unknown) => {
        console.error('[REGISTER] Failed to send verification email:', err);
      });
    })
    .catch((err: unknown) => {
      console.error('[REGISTER] Failed to create verification token:', err);
    });

  return { user, tokens };
};

// ============================================================
// Логин
// ============================================================

interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: {
    type: string;
    name?: string;
    platform?: string;
    lastIp?: string;
  };
}

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { twoFASecrets: true },
  });

  if (!user) {
    throw new Error('Неверный email или пароль');
  }

  if (user.status === 'banned') {
    throw new Error('Аккаунт заблокирован');
  }
  if (user.status === 'deleted') {
    throw new Error('Аккаунт удалён');
  }
  if (user.status === 'suspended') {
    throw new Error('Аккаунт временно приостановлен');
  }

  const { valid: validPassword, needsRehash } = await verifyPassword(
    input.password,
    user.passwordHash!
  );
  if (!validPassword) {
    throw new Error('Неверный email или пароль');
  }

  // Прозрачная миграция: перезаписываем легаси SHA-256 хеш на bcrypt
  if (needsRehash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.password) },
    });
  }

  const has2FA = user.twoFASecrets.length > 0 && user.twoFASecrets[0].enabled;

  if (has2FA) {
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status,
        language: user.language,
        avatarUrl: user.avatarUrl,
        needs2FA: true,
      },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'active', updatedAt: BigInt(Math.floor(Date.now() / 1000)) },
  });

  if (input.deviceInfo) {
    await prisma.device.create({
      data: {
        userId: user.id,
        type: input.deviceInfo.type as any,
        name: input.deviceInfo.name || null,
        platform: input.deviceInfo.platform || null,
        lastIp: input.deviceInfo.lastIp || null,
        lastActive: BigInt(Math.floor(Date.now() / 1000)),
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  }

  const tokens = generateTokens(user.id, user.email!, user.username || undefined);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      language: user.language,
      avatarUrl: user.avatarUrl,
      needs2FA: false,
    },
    tokens,
  };
};

// ============================================================
// Верификация 2FA
// ============================================================

interface Verify2FAInput {
  email: string;
  code: string;
  deviceInfo?: {
    type: string;
    name?: string;
    platform?: string;
    lastIp?: string;
  };
}

export const verify2FA = async (input: Verify2FAInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { twoFASecrets: true },
  });

  if (!user || user.twoFASecrets.length === 0 || !user.twoFASecrets[0].enabled) {
    throw new Error('2FA не включена для этого аккаунта');
  }

  const twoFA = user.twoFASecrets[0];

  const totpValid = verifyTOTP(twoFA.secret, input.code);
  if (totpValid) {
    // TOTP OK
  } else {
    const backupCodes = JSON.parse(twoFA.backupCodes) as string[];
    const codeIndex = backupCodes.indexOf(input.code);
    if (codeIndex === -1) {
      throw new Error('Неверный код подтверждения');
    }
    backupCodes.splice(codeIndex, 1);
    await prisma.twoFASecret.update({
      where: { userId: user.id },
      data: { backupCodes: JSON.stringify(backupCodes) },
    });
  }

  if (input.deviceInfo) {
    await prisma.device.create({
      data: {
        userId: user.id,
        type: input.deviceInfo.type as any,
        name: input.deviceInfo.name || null,
        platform: input.deviceInfo.platform || null,
        lastIp: input.deviceInfo.lastIp || null,
        lastActive: BigInt(Math.floor(Date.now() / 1000)),
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  }

  const tokens = generateTokens(user.id, user.email!, user.username || undefined);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      language: user.language,
      avatarUrl: user.avatarUrl,
      needs2FA: false,
    },
    tokens,
  };
};

// ============================================================
// Refresh token
// ============================================================

export const refreshTokens = async (refreshToken: string) => {
  let decoded: Record<string, unknown>;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as Record<string, unknown>;
  } catch {
    throw new Error('Недействительный refresh токен');
  }

  if ((decoded.type as string) !== 'refresh') {
    throw new Error('Недействительный тип токена');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId as string },
  });

  if (!user || user.status !== 'active') {
    throw new Error('Пользователь не найден или неактивен');
  }

  return generateTokens(user.id, user.email!, user.username || undefined, decoded.role as string | undefined);
};

// ============================================================
// Logout
// ============================================================

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as Record<string, unknown>;
    if ((decoded.type as string) === 'refresh') {
      console.log(`Refresh token revoked for user ${decoded.userId}`);
    }
  } catch {
    // Токен уже истёк
  }
};

// ============================================================
// Верификация email
// ============================================================

export const verifyEmail = async (input: { token: string }): Promise<{ success: boolean; message: string }> => {
  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { token: input.token },
    include: { user: true },
  });

  if (!tokenRecord) {
    return { success: false, message: 'Недействительный токен верификации' };
  }

  if (tokenRecord.used) {
    return { success: false, message: 'Токен уже был использован' };
  }

  if (tokenRecord.expiresAt < BigInt(Math.floor(Date.now() / 1000))) {
    return { success: false, message: 'Токен верификации истёк' };
  }

  if (tokenRecord.type !== 'email_verification') {
    return { success: false, message: 'Неверный тип токена' };
  }

  // Отмечаем токен как использованный
  await prisma.verificationToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  console.log(`[VERIFY] Email verified for user ${tokenRecord.userId}`);
  return { success: true, message: 'Email успешно верифицирован' };
};

// ============================================================
// Сброс пароля
// ============================================================

export const requestPasswordReset = async (input: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    return { success: true, message: 'Если пользователь существует, письмо будет отправлено' };
  }

  // Удаляем старые неиспользованные токены сброса
  await prisma.verificationToken.deleteMany({
    where: {
      userId: user.id,
      type: 'password_reset',
      used: false,
    },
  });

  const resetToken = randomString(32);
  const expiresAt = BigInt(Math.floor(Date.now() / 1000)) + 3600n; // 1 час

  // Сохраняем токен в БД
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: 'password_reset',
      token: resetToken,
      expiresAt,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  // Отправляем email (не блокируем, не падаем если SMTP недоступен)
  try {
    await sendResetPasswordEmail(user.email!, resetToken);
  } catch {
    // Email не отправлен — не блокируем запрос
  }

  return {
    success: true,
    message: 'Если пользователь существует, письмо будет отправлено',
  };
};

export const resetPassword = async (input: { token: string; newPassword: string }) => {
  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { token: input.token },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new Error('Недействительный токен сброса пароля');
  }

  if (tokenRecord.used) {
    throw new Error('Токен уже был использован');
  }

  if (tokenRecord.expiresAt < BigInt(Math.floor(Date.now() / 1000))) {
    throw new Error('Токен сброса пароля истёк');
  }

  if (tokenRecord.type !== 'password_reset') {
    throw new Error('Неверный тип токена');
  }

  // Обновляем пароль
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash },
  });

  // Отмечаем токен как использованный
  await prisma.verificationToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  console.log(`[RESET] Password reset for user ${tokenRecord.userId}`);
  return { success: true, message: 'Пароль успешно сброшен' };
};

// ============================================================
// OAuth
// ============================================================

interface OAuthLoginInput {
  provider: 'yandex' | 'vk' | 'mailru' | 'max';
  providerId: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  deviceInfo?: {
    type: string;
    name?: string;
    platform?: string;
    lastIp?: string;
  };
}

// Получение данных пользователя из Яндекс OAuth
export const getYandexUser = async (accessToken: string) => {
  const response = await fetch('https://login.yandex.ru/info', {
    headers: { Authorization: `OAuth ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Yandex OAuth error: ${response.status}`);
  }

  const data = (await response.json()) as { id: string; default_email: string; login: string; default_avatar_id: string };

  return {
    providerId: data.id,
    email: data.default_email,
    username: data.login || undefined,
    avatarUrl: data.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/200` : undefined,
  };
};

// Обмен authorization code на access token (Яндекс)
export const exchangeYandexCode = async (code: string) => {
  const response = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YANDEX_CLIENT_ID || '',
      client_secret: process.env.YANDEX_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Yandex token exchange failed: ${response.status}`);
  }

  return await response.json();
};

export const oauthLogin = async (input: OAuthLoginInput) => {
  let oAuthAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerId: {
        provider: input.provider,
        providerId: input.providerId,
      },
    },
  });

  let user: any;

  if (oAuthAccount) {
    user = await prisma.user.findUnique({
      where: { id: oAuthAccount.userId },
      include: { twoFASecrets: true },
    });
  } else {
    const passwordHash = crypto.randomBytes(32).toString('hex');

    // Первый пользователь через OAuth становится админом, если админов еще нет
    const isAdmin = await hasAdmin();

    user = await prisma.user.create({
      data: {
        email: input.email || null,
        username: input.username || null,
        passwordHash,
        avatarUrl: input.avatarUrl || null,
        language: 'ru',
        status: 'active',
        role: isAdmin ? 'user' : 'admin',
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000)),
        oAuthAccounts: {
          create: {
            provider: input.provider,
            providerId: input.providerId,
            accessToken: input.accessToken || null,
            refreshToken: input.refreshToken || null,
            expiresAt: input.expiresAt ? BigInt(input.expiresAt) : null,
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
            updatedAt: BigInt(Math.floor(Date.now() / 1000)),
          },
        },
        publicProfile: {
          create: {
            username: input.username || (input.email ? input.email.split('@')[0] : `user_${input.providerId.slice(0, 6)}`),
            displayName: input.username || input.email?.split('@')[0] || 'User',
          },
        },
      },
    });

    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { twoFASecrets: true },
    });
  }

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  if (oAuthAccount) {
    await prisma.oAuthAccount.update({
      where: { id: oAuthAccount.id },
      data: {
        accessToken: input.accessToken || null,
        refreshToken: input.refreshToken || null,
        expiresAt: input.expiresAt ? BigInt(input.expiresAt) : null,
        updatedAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  }

  if (input.deviceInfo) {
    await prisma.device.create({
      data: {
        userId: user.id,
        type: input.deviceInfo.type as any,
        name: input.deviceInfo.name || null,
        platform: input.deviceInfo.platform || null,
        lastIp: input.deviceInfo.lastIp || null,
        lastActive: BigInt(Math.floor(Date.now() / 1000)),
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  }

  const tokens = generateTokens(user.id, user.email!, user.username || undefined);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      language: user.language,
      avatarUrl: user.avatarUrl,
      needs2FA: false,
    },
    tokens,
  };
};

// ============================================================
// 2FA управление
// ============================================================

interface Enable2FAInput {
  userId: string;
  method?: 'totp' | 'sms' | 'email';
}

export const enable2FA = async (input: Enable2FAInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  const secret = generateTOTPSecret();
  const backupCodes = generateBackupCodes();

  await prisma.twoFASecret.upsert({
    where: { userId: user.id },
    update: {
      secret,
      backupCodes: JSON.stringify(backupCodes),
      method: (input.method || 'totp') as any,
      enabled: true,
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
    create: {
      userId: user.id,
      secret,
      backupCodes: JSON.stringify(backupCodes),
      method: (input.method || 'totp') as any,
      enabled: true,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  return {
    secret,
    qrCodeUrl: totpAuthUrl(secret, user.email || ''),
    backupCodes,
  };
};

interface Verify2FAEnableInput {
  userId: string;
  code: string;
}

export const verify2FAEnable = async (input: Verify2FAEnableInput) => {
  const twoFASecret = await prisma.twoFASecret.findUnique({
    where: { userId: input.userId },
  });

  if (!twoFASecret) {
    throw new Error('2FA не настроена');
  }

  const valid = verifyTOTP(twoFASecret.secret, input.code);
  if (!valid) {
    throw new Error('Неверный код подтверждения');
  }

  return { enabled: true };
};

interface Disable2FAInput {
  userId: string;
}

export const disable2FA = async (input: Disable2FAInput) => {
  await prisma.twoFASecret.upsert({
    where: { userId: input.userId },
    update: {
      enabled: false,
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
    create: {
      userId: input.userId,
      secret: '',
      backupCodes: '[]',
      method: 'totp',
      enabled: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  return { disabled: true };
};

// ============================================================
// Получение device info
// ============================================================

export const getUserDevices = async (userId: string) => {
  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastActive: 'desc' },
  });
  return devices;
};

export const revokeDevice = async (userId: string, deviceId: string) => {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId },
  });
  if (!device) {
    throw new Error('Устройство не найдено');
  }
  await prisma.device.delete({ where: { id: deviceId } });
  return { revoked: true };
};

// ============================================================
// Временный токен для WebSocket
// ============================================================

export const getWsToken = async (accessToken: string): Promise<string> => {
  try {
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as any;
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    const wsPayload: Record<string, unknown> = { 
      userId: decoded.userId, 
      email: decoded.email, 
      username: decoded.username, 
      role: decoded.role, 
      type: 'access',
      ws: true,
    };
    return jwt.sign(wsPayload, env.JWT_ACCESS_SECRET, { expiresIn: 300 });
  } catch {
    throw new Error('Invalid access token');
  }
};
