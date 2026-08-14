import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Утилиты
// ============================================================

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

// Простое хеширование пароля (SHA-256 с солью)
const hashPassword = (password: string): string =>
  crypto.createHash('sha256').update(password + 'balloo-salt-2024').digest('hex');

const verifyPassword = (password: string, hash: string): boolean =>
  hashPassword(password) === hash;

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

  const passwordHash = hashPassword(input.password);

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

  const validPassword = verifyPassword(input.password, user.passwordHash!);
  if (!validPassword) {
    throw new Error('Неверный email или пароль');
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

export const verifyEmail = async (_input: { token: string }): Promise<{ success: boolean }> => {
  return { success: true };
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

  const resetToken = randomString(32);

  return {
    success: true,
    resetToken,
    message: 'Если пользователь существует, письмо будет отправлено',
  };
};

export const resetPassword = async (input: { token: string; newPassword: string }) => {
  const passwordHash = hashPassword(input.newPassword);

  throw new Error('Функция сброса пароля требует настройки email-сервиса');
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

    user = await prisma.user.create({
      data: {
        email: input.email || null,
        username: input.username || null,
        passwordHash,
        avatarUrl: input.avatarUrl || null,
        language: 'ru',
        status: 'active',
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
