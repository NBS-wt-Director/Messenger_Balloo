// loginCodeService.ts — одноразовые коды входа (13 цифр) с доставкой
// в push (browser push на доверенное устройство) или на email.
//
// Тикет 1795101593. Требование владельца: «формат кода 13 цифр. поле ввода,
// push если включено и авторизовано другое устройство. иначе — email».
//
// Как это работает:
//   1. Пользователь вводит email+пароль (проверку пароля делает loginService,
//      выставляя needs2FA) — код не может быть запрошен без верных учётных данных.
//   2. POST /api/auth/2fa/send-code — сервис генерирует 13-значный код и кладёт
//      его ХЕШ в Redis (TTL 5 мин, не более 5 попыток).
//   3. Доставка: если у пользователя есть хотя бы одна browser-push подписка —
//      код уходит push'ом на это доверенное устройство; иначе — письмом на email.
//   4. verify2FA проверяет код из Redis (перед TOTP/backup-кодами).
//
// Код в Redis не хранится открытым — только sha256(userId:code), сравнение
// timing-safe. Реального SMS-канала нет: «SMS» из старого макета не поддерживаем.

import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getRedis } from './cacheService';
import { sendLoginCodeEmail } from './emailService';
import { sendVapidPushToUsers } from './pushService';

const prisma = new PrismaClient();

/** Длина кода входа — 13 цифр (требование владельца). */
export const LOGIN_CODE_LENGTH = 13;
/** Время жизни кода — 5 минут. */
export const LOGIN_CODE_TTL_SECONDS = 300;
/** Максимум неверных попыток на один код. */
const MAX_ATTEMPTS = 5;
const KEY_PREFIX = 'login-code:';

export type LoginCodeChannel = 'push' | 'email';

export type LoginCodeErrorCode = 'CODE_UNAVAILABLE';

export class LoginCodeError extends Error {
  code: LoginCodeErrorCode;
  constructor(code: LoginCodeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

interface StoredCode {
  codeHash: string;
  attempts: number;
  createdAt: number;
}

/**
 * Криптостойкий код из ровно 13 цифр (первая цифра может быть 0 — это
 * осознанно: код не число, а строка фиксированной длины).
 */
export const generateLoginCode = (): string => {
  let out = '';
  for (let i = 0; i < LOGIN_CODE_LENGTH; i++) {
    out += String(randomInt(0, 10));
  }
  return out;
};

const hashCode = (userId: string, code: string): string =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

/**
 * Канал доставки кода: если у пользователя есть browser-push подписка —
 * push (на «другое авторизованное устройство»); иначе email.
 */
export const resolveCodeChannel = async (userId: string): Promise<LoginCodeChannel> => {
  const pushSubscriptions = await prisma.pushSubscription.count({ where: { userId } });
  return pushSubscriptions > 0 ? 'push' : 'email';
};

/**
 * Сгенерировать код, сохранить его хеш в Redis и доставить пользователю.
 * Возвращает выбранный канал и время жизни кода.
 */
export const issueLoginCode = async (input: {
  userId: string;
  email: string;
}): Promise<{ channel: LoginCodeChannel; expiresIn: number }> => {
  const redis = getRedis();
  if (!redis) {
    throw new LoginCodeError('CODE_UNAVAILABLE', 'Сервис кодов входа недоступен');
  }

  const code = generateLoginCode();
  const stored: StoredCode = {
    codeHash: hashCode(input.userId, code),
    attempts: 0,
    createdAt: Math.floor(Date.now() / 1000),
  };

  try {
    await redis.set(KEY_PREFIX + input.userId, JSON.stringify(stored), 'EX', LOGIN_CODE_TTL_SECONDS);
  } catch {
    throw new LoginCodeError('CODE_UNAVAILABLE', 'Сервис кодов входа недоступен');
  }

  const channel = await resolveCodeChannel(input.userId);

  if (channel === 'push') {
    await sendVapidPushToUsers([input.userId], {
      title: 'Код входа в Balloo',
      body: `Ваш код подтверждения: ${code}`,
      data: { type: 'login_code', code },
    });
  } else {
    await sendLoginCodeEmail(input.email, code);
  }

  return { channel, expiresIn: LOGIN_CODE_TTL_SECONDS };
};

/**
 * Проверить код входа. При успехе код одноразово удаляется; при неверном —
 * инкремент попыток, после MAX_ATTEMPTS код аннулируется.
 * Если Redis недоступен — возвращает false (вход пойдёт по TOTP/backup).
 */
export const verifyLoginCode = async (userId: string, code: string): Promise<boolean> => {
  const redis = getRedis();
  if (!redis || !code) return false;

  let raw: string | null = null;
  try {
    raw = await redis.get(KEY_PREFIX + userId);
  } catch {
    return false;
  }
  if (!raw) return false;

  let stored: StoredCode;
  try {
    stored = JSON.parse(raw) as StoredCode;
  } catch {
    return false;
  }

  const inputHash = Buffer.from(hashCode(userId, code), 'hex');
  const storedHash = Buffer.from(stored.codeHash, 'hex');
  const match =
    inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash);

  if (match) {
    try {
      await redis.del(KEY_PREFIX + userId);
    } catch {
      // код уже использован — не критично, если удалить не удалось
    }
    return true;
  }

  stored.attempts += 1;
  try {
    if (stored.attempts >= MAX_ATTEMPTS) {
      await redis.del(KEY_PREFIX + userId);
    } else {
      await redis.set(
        KEY_PREFIX + userId,
        JSON.stringify(stored),
        'EX',
        LOGIN_CODE_TTL_SECONDS
      );
    }
  } catch {
    // запись счётчика попыток не критична для отказа в неверном коде
  }
  return false;
};
