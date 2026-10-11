import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getRedis } from './cacheService';
import { env } from '../config/env';
import { PrismaClient } from '@prisma/client';
import { setAuthCookies, clearAuthCookies } from '../middleware/auth';
import { revokeAllSessions, isSessionRevoked } from './sessionRevocation';
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

    // Timing-safe сравнение: оба значения всегда ровно 6 цифр (padStart)
    const tokenBuf = Buffer.from(String(tokenNum).padStart(6, '0'));

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
      const totpBuf = Buffer.from(String(totpCode).padStart(6, '0'));
      if (crypto.timingSafeEqual(totpBuf, tokenBuf)) return true;
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

// Экспортируется для QR pair-flow (deviceService): подтверждение на втором
// устройстве выдаёт новой устройству ту же пару токенов, что и обычный вход
export const generateTokens = (userId: string, email: string, username?: string, role?: string): TokenPair => {
  const accessPayload: Record<string, unknown> = { userId, email, username, role, type: 'access' };
  const jti = crypto.randomUUID();
  const refreshPayload: Record<string, unknown> = { userId, email, username, role, type: 'refresh', jti };

  return {
    accessToken: jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: Number(env.JWT_ACCESS_EXPIRES_IN),
    }),
    refreshToken: jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      expiresIn: Number(env.JWT_REFRESH_EXPIRES_IN),
    }),
  };
};

// Хеширование пароля — bcrypt (cost factor 12)
const BCRYPT_ROUNDS = 12;

// Dummy-хеш для тайминг-безопасности (тик. «исправить-timing-unknown-email-login»):
// при неизвестном email bcrypt.compare выполняется на этом хеше, чтобы ответ
// «пользователя нет» не приходил заметно быстрее ответа «неверный пароль».
// Сгенерирован bcrypt.hash('balloo-dummy-password', 12).
const DUMMY_PASSWORD_HASH = '$2a$12$YQOlf8NxXYh58j7kLWejTu9Ejl4L/VGsnCvCC1FJiEW.MrdAbI0VS';

// Нормализация email: PostgreSQL @unique чувствителен к регистру, из-за чего
// User@Gmail.com и user@gmail.com стали бы двумя пользователями (тик.
// «исправить-email-normalization»). Нормализуем на входе в сервисы — покрыты
// все вызывающие (контроллеры, OAuth, тесты).
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// Pre-hash SHA-256 → base64 перед bcrypt (тик. а-08): bcrypt обрезает вход на
// 72 байтах, у длинных паролей терялся хвост (два разных длинных пароля давали
// один хеш). SHA-256 даёт фиксированные 44 байта base64 — обрезки нет никогда.
// Формат хеша меняется только для новых записей; старые bcrypt-хеши
// принимаются и перезаписываются при входе (needsRehash).
const preHashPassword = (password: string): string =>
  crypto.createHash('sha256').update(password, 'utf8').digest('base64');

const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(preHashPassword(password), BCRYPT_ROUNDS);

// Легаси-хеш (SHA-256 с хардкод-солью) — только для миграции старых паролей
const legacyHash = (password: string): string =>
  crypto.createHash('sha256').update(password + 'balloo-salt-2024').digest('hex');

const isLegacyHash = (hash: string): boolean => /^[a-f0-9]{64}$/i.test(hash);

// Constant-time сравнение hex-хешей одинаковой длины.
// timingSafeEqual кидает на разной длине, а legacyHash всегда даёт ровно 64 hex-символа,
// поэтому длина совпадает по построению (isLegacyHash уже проверил форматStored-хеша).
const safeLegacyCompare = (candidateHex: string, storedHex: string): boolean => {
  const candidate = Buffer.from(candidateHex, 'hex');
  const stored = Buffer.from(storedHex, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
};

// Проверка пароля: легаси SHA-256, bcrypt старого формата (пароль напрямую) и
// нового формата (pre-hash SHA-256). needsRehash = true → хеш устарел и при
// успешном входе должен быть перезаписан актуальным (тик. а-08).
const verifyPassword = async (
  password: string,
  hash: string
): Promise<{ valid: boolean; needsRehash: boolean }> => {
  if (isLegacyHash(hash)) {
    const valid = safeLegacyCompare(legacyHash(password), hash);
    return { valid, needsRehash: valid };
  }
  try {
    // Новый формат: pre-hash. Формат хеша в строке не различим (оба $2a$12$…),
    // поэтому пробуем оба входа: сначала актуальный, потом старый сырой.
    const valid = await bcrypt.compare(preHashPassword(password), hash);
    if (valid) return { valid: true, needsRehash: false };
    const legacyBcryptValid = await bcrypt.compare(password, hash);
    if (legacyBcryptValid) return { valid: true, needsRehash: true };
    return { valid: false, needsRehash: false };
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
  const email = normalizeEmail(input.email);
  console.log('[REGISTER] Service: starting, email:', email);

  // Валидация пароля (серверная — 152-ФЗ / docs/12 §6.2)
  if (!input.password || input.password.length < 8) {
    throw new Error('Пароль должен содержать минимум 8 символов');
  }

  // Проверка уникальности email
  const existingUser = await prisma.user.findUnique({
    where: { email },
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

  // Гонка между findUnique и create (параллельная регистрация одного email)
  // спасает только БД-индекс @unique: P2002 превращаем в штатный конфликт,
  // а не в 500 (тик. а-04, п.1).
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username: input.username || null,
        language: 'ru',
        status: 'active',
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      const target = JSON.stringify(e?.meta?.target ?? '');
      throw new Error(target.includes('username') ? 'Username уже занят' : 'Email уже зарегистрирован');
    }
    throw e;
  }

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
    where: { email: normalizeEmail(input.email) },
    include: { twoFASecrets: true },
  });

  if (!user) {
    // Тайминг как при неверном пароле: тот же verifyPassword, те же два
    // bcrypt.compare (pre-hash + сырой), что делает проверка реального хеша
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
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
    where: { email: normalizeEmail(input.email) },
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
    // Timing-safe поиск кода (indexOf может быть уязвим к timing-атаке)
    let matchedIndex = -1;
    const inputBuf = Buffer.from(input.code);
    for (let i = 0; i < backupCodes.length; i++) {
      const codeBuf = Buffer.from(backupCodes[i]);
      if (inputBuf.length === codeBuf.length && crypto.timingSafeEqual(inputBuf, codeBuf)) {
        matchedIndex = i;
      }
    }
    if (matchedIndex === -1) {
      throw new Error('Неверный код подтверждения');
    }
    backupCodes.splice(matchedIndex, 1);
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
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as Record<string, unknown>;
  } catch {
    throw new Error('Недействительный refresh токен');
  }

  if ((decoded.type as string) !== 'refresh') {
    throw new Error('Недействительный тип токена');
  }

  const jti = decoded.jti as string | undefined;
  const userId = decoded.userId as string;
  const iat = decoded.iat as number | undefined;
  const redis = getRedis();
  const ttl = Number(env.JWT_REFRESH_EXPIRES_IN);

  if (!redis && jti) {
    // Blacklist недоступен → replay-защита ротации не работает. Не молчим.
    console.warn('[auth] REDIS_URL не задан: blacklist refresh-токенов отключён');
  }

  // 1. Replay-защита: этот JTI уже был отозван при прошлой ротации
  if (jti && redis) {
    const revoked = await redis.get(`revoked-jti:${jti}`);
    if (revoked) {
      throw new Error('Refresh токен отозван');
    }
  }

  // 2. «Выйти на всех устройствах» / смена пароля: отзыв по iat
  if (iat) {
    const revokedBySession = await isSessionRevoked(userId, iat);
    if (revokedBySession) {
      if (jti && redis) {
        await redis.setex(`revoked-jti:${jti}`, ttl, '1');
      }
      throw new Error('Refresh токен отозван');
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== 'active') {
    throw new Error('Пользователь не найден или неактивен');
  }

  // 3. Ротация: текущий JTI в blacklist (TTL = TTL старого токена)
  if (jti && redis) {
    await redis.setex(`revoked-jti:${jti}`, ttl, '1');
  }

  return generateTokens(user.id, user.email!, user.username || undefined, decoded.role as string | undefined);
};

// ============================================================
// Logout
// ============================================================

export const logout = async (refreshToken: string, allDevices = false): Promise<void> => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as Record<string, unknown>;
    if ((decoded.type as string) === 'refresh') {
      // Blacklist JTI (rotating refresh tokens)
      const jti = decoded.jti as string | undefined;
      if (jti) {
        const redis = getRedis();
        if (redis) {
          const ttl = Number(env.JWT_REFRESH_EXPIRES_IN);
          await redis.setex(`revoked-jti:${jti}`, ttl, '1');
        }
      }
      // allDevices — отзываем и остальные устройства. Блокировка по jti гасит
      // только этот refresh, а метка revoked-at по userId выбрасывает в том
      // числе уже выданные access-токены других сессий.
      if (allDevices && decoded.userId) {
        await revokeAllSessions(String(decoded.userId));
      }
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
    where: { email: normalizeEmail(input.email) },
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
  const expiresAt = BigInt(Math.floor(Date.now() / 1000)) + 900n; // 15 минут (тик. а-02)

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

  // Одноразовость раньше смены пароля (тик. а-02, п.2): если процесс упадёт
  // между операциями, токен уже помечен использованным и переиспользован не
  // будет; пользователь запросит новый. Обратный порядок оставлял токен живым
  // после успешной смены пароля.
  await prisma.verificationToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  // Обновляем пароль
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash },
  });

  // Сброс пароля обычно делают, когда доступ к аккаунту могли перехватить,
  // поэтому старые сессии отзываем — иначе украденный токен переживает смену
  // пароля и у злоумышленника остаётся рабочий вход.
  await revokeAllSessions(tokenRecord.userId);

  console.log(`[RESET] Password reset for user ${tokenRecord.userId}`);
  return { success: true, message: 'Пароль успешно сброшен' };
};

// ============================================================
// OAuth
// ============================================================

// ============================================================
// OAuth
// ============================================================

// P33 (2026-09-21, приёмка владельца): oauthLogin привязывал OAuth-аккаунт
// к существующему пользователю по email БЕЗ проверки статуса — вход прошёл
// под мягко удалённым тестовым аккаунтом (email совпал с Яндекс-ящиком
// владельца). login/refresh статусы проверяют, OAuth-путь — нет. Этой
// ошибкой помечаем отказ: контроллеры отличают её от callback_failed и
// редиректят с oauth_error=account_inactive (дружелюбный текст на фронте).
export class OAuthAccountInactiveError extends Error {
  constructor(public readonly status: string) {
    const messages: Record<string, string> = {
      banned: 'Аккаунт заблокирован',
      deleted: 'Аккаунт удалён',
      suspended: 'Аккаунт временно приостановлен',
    };
    super(messages[status] || `Аккаунт неактивен (${status})`);
    this.name = 'OAuthAccountInactiveError';
  }
}

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
    // Яндекс отдаёт портрет только суффиксом из своей линейки: islands-50 / -150 /
    // -200 / -300 / -small. Прежний «/200» без префикса islands- отвечал 404,
    // поэтому аватарка не грузилась (замерено на проде). Линейка неполная:
    // islands-100 тоже 404 — брать можно только проверенные значения.
    // ID портрета сам содержит слэш («62162/v5e99…»), суффикс — третий сегмент пути.
    avatarUrl: data.default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
      : undefined,
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

// ============================================================
// OAuth: authorize URL (P21) — GET /api/auth/oauth/:provider
// Возвращает URL страницы авторизации провайдера или null,
// если провайдер не настроен (нет CLIENT_ID/SECRET в env).
// Rambler/Max — OAuth-приложений нет → не настроены.
// ============================================================

export type OAuthProviderId = 'yandex' | 'vk' | 'mailru' | 'rambler' | 'max';

const OAUTH_PROVIDER_ENV: Record<
  string,
  { clientId: string; clientSecret: string; redirectUri: string }
> = {
  yandex: {
    clientId: 'YANDEX_CLIENT_ID',
    clientSecret: 'YANDEX_CLIENT_SECRET',
    redirectUri: 'YANDEX_REDIRECT_URI',
  },
  vk: {
    clientId: 'VK_CLIENT_ID',
    clientSecret: 'VK_CLIENT_SECRET',
    redirectUri: 'VK_REDIRECT_URI',
  },
  mailru: {
    clientId: 'MAILRU_CLIENT_ID',
    clientSecret: 'MAILRU_CLIENT_SECRET',
    redirectUri: 'MAILRU_REDIRECT_URI',
  },
};

export const isOAuthProviderConfigured = (provider: string): boolean => {
  const env = OAUTH_PROVIDER_ENV[provider];
  if (!env) return false; // rambler/max — не настроены (нет OAuth-приложений)
  return Boolean(process.env[env.clientId] && process.env[env.clientSecret]);
};

export const getOAuthAuthorizeUrl = (provider: string): string | null => {
  const env = OAUTH_PROVIDER_ENV[provider];
  if (!env) return null;

  const clientId = process.env[env.clientId];
  const clientSecret = process.env[env.clientSecret];
  const redirectUri = process.env[env.redirectUri];

  if (!clientId || !clientSecret || !redirectUri) return null;

  switch (provider) {
    case 'yandex':
      // https://yandex.ru/dev/id/doc (OAuth-код)
      return `https://oauth.yandex.ru/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    case 'vk':
      // Классический VK OAuth (oauth.vk.com), scope=email даёт email в ответе
      return `https://oauth.vk.com/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email&v=5.131`;
    case 'mailru':
      // https://api.mail.ru/docs/guides/oauth/sites/
      return `https://connect.mail.ru/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=userinfo`;
    default:
      return null;
  }
};

// Обмен authorization code на access token (VK) —
// https://oauth.vk.com/access_token возвращает access_token, user_id, email
export const exchangeVkCode = async (code: string) => {
  const redirectUri = process.env.VK_REDIRECT_URI || '';
  const url =
    `https://oauth.vk.com/access_token?client_id=${encodeURIComponent(process.env.VK_CLIENT_ID || '')}` +
    `&client_secret=${encodeURIComponent(process.env.VK_CLIENT_SECRET || '')}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`VK token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    user_id: number;
    email?: string;
    error?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(`VK token exchange error: ${data.error || 'no access_token'}`);
  }

  return {
    accessToken: data.access_token,
    providerId: String(data.user_id),
    email: data.email,
  };
};

// Обмен authorization code на access token (Mail.ru) —
// POST https://connect.mail.ru/oauth/token (form-urlencoded), см. api.mail.ru/docs
export const exchangeMailruCode = async (code: string) => {
  const response = await fetch('https://connect.mail.ru/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MAILRU_CLIENT_ID || '',
      client_secret: process.env.MAILRU_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.MAILRU_REDIRECT_URI || '',
    }),
  });

  if (!response.ok) {
    throw new Error(`Mail.ru token exchange failed: ${response.status}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_mailru_vid: string;
  };
};

// Данные пользователя Mail.ru — GET https://oauth.mail.ru/userinfo
export const getMailruUser = async (accessToken: string) => {
  const response = await fetch(
    `https://oauth.mail.ru/userinfo?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!response.ok) {
    throw new Error(`Mail.ru userinfo failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    email?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };

  return {
    email: data.email,
    username: data.name || (data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : undefined),
  };
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

    // P33: привязка есть, но пользователь неактивен (deleted/banned/suspended)
    // — вход отклоняем, как это делают login/refresh
    if (user && user.status !== 'active') {
      throw new OAuthAccountInactiveError(user.status);
    }
  } else if (input.email) {
    // P2002-фикс (живой вход Яндекс, 2026-09-20): пользователь с таким email
    // уже есть (зарегистрировался по email раньше) — ПРИВЯЗЫВАЕМ OAuth-аккаунт
    // к существующему пользователю, а не создаём дубликат (create падал на
    // @unique email). Email от провайдера верифицирован им самим — привязка
    // по email стандартна для OAuth.
    const existing = await prisma.user.findUnique({
      where: { email: normalizeEmail(input.email!) },
      include: { twoFASecrets: true },
    });

    // P33 (2026-09-21): НЕ привязываем и НЕ впускаем, если аккаунт неактивен
    // (deleted/banned/suspended) — иначе OAuth-вход тихо проходит под
    // удалённым/заблокированным аккаунтом с тем же email. Отказ, не привязка.
    if (existing && existing.status !== 'active') {
      throw new OAuthAccountInactiveError(existing.status);
    }

    if (existing) {
      await prisma.oAuthAccount.create({
        data: {
          userId: existing.id,
          provider: input.provider,
          providerId: input.providerId,
          accessToken: input.accessToken || null,
          refreshToken: input.refreshToken || null,
          expiresAt: input.expiresAt ? BigInt(input.expiresAt) : null,
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
          updatedAt: BigInt(Math.floor(Date.now() / 1000)),
        },
      });
      user = existing;
    }
  }

  if (!user) {
    const passwordHash = crypto.randomBytes(32).toString('hex');

    // Первый пользователь через OAuth становится админом, если админов еще нет
    const isAdmin = await hasAdmin();

    // username @unique: логин провайдера может совпадать с существующим —
    // проверяем и добавляем суффикс (иначе create падает P2002)
    let username = input.username || undefined;
    if (username) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) username = `${username}_${input.providerId.slice(0, 4)}`;
    }

    user = await prisma.user.create({
      data: {
        email: input.email ? normalizeEmail(input.email) : null,
        username,
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
            username: username || (input.email ? input.email.split('@')[0] : `user_${input.providerId.slice(0, 6)}`),
            displayName: username || input.email?.split('@')[0] || 'User',
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
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as any;
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
