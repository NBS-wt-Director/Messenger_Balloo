// deviceService.ts — Сервис для управления устройствами и сессиями
// Заглушка: модель userSession отсутствует в Prisma schema

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { getRedis } from './cacheService';
import { generateTokens } from './authService';

const prisma = new PrismaClient();

export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  lastActive: number;
  isCurrent: boolean;
  location?: string;
  ipAddress?: string;
  os?: string;
}

// Получить список устройств (заглушка — возвращает текущее устройство)
export const getDevices = async (userId: string, currentDeviceId?: string) => {
  const devices: DeviceInfo[] = [
    {
      id: currentDeviceId || 'current',
      name: 'Текущее устройство',
      type: 'desktop',
      lastActive: Math.floor(Date.now() / 1000),
      isCurrent: true,
    },
  ];

  return { devices };
};

// Завершить сессию устройства (заглушка)
export const endSession = async (sessionId: string, userId: string) => {
  return { message: 'Сессия завершена' };
};

// Завершить все сессии кроме текущей (заглушка)
export const endAllSessions = async (userId: string, currentDeviceId?: string) => {
  return { message: 'Все остальные сессии завершены' };
};

// ============================================================
// QR pair-token — вход/привязка устройства по QR-коду
// (docs/04-api-websocket-spec.md, макет mockups/balloo-su/add-device.md)
//
// Поток: новое устройство показывает QR (POST /devices/pair-token),
// авторизованное устройство сканирует код и подтверждает вход
// (POST /devices/pair/confirm), новое устройство опрашивает статус
// (GET /devices/pair/:token/status) — при confirmed сервер сам ставит
// httpOnly auth-cookie в ответе статуса (токены не гуляют по body).
//
// Хранение: Redis, TTL 60 сек (макет: таймер 60 сек). Без Redis сервис
// честно отвечает 503 — коды одноразовые и живут только в Redis.
// ============================================================

const PAIR_TTL_SECONDS = 60; // время жизни кода (таймер на экране)
const PAIR_PICKUP_TTL = 120; // окно выдачи cookie после подтверждения
const PAIR_KEY = 'pair:';

export interface PairTokenInfo {
  token: string;
  code: string; // balloo://pair/<token>
  expiresIn: number;
}

export interface PairRecord {
  status: 'pending' | 'confirmed';
  createdAt: number;
  // Только при confirmed:
  userId?: string;
  username?: string | null;
  avatarUrl?: string | null;
  accessToken?: string;
  refreshToken?: string;
  deviceId?: string;
}

// Коды ошибок сервиса (контроллер мапит их в HTTP-статусы)
export type PairErrorCode = 'PAIR_UNAVAILABLE' | 'PAIR_NOT_FOUND' | 'PAIR_ALREADY_CONFIRMED';
export class PairError extends Error {
  code: PairErrorCode;
  constructor(code: PairErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// POST /devices/pair-token — сгенерировать код (без авторизации:
// новое устройство по определению ещё не вошло)
export const createPairToken = async (): Promise<PairTokenInfo> => {
  const redis = getRedis();
  if (!redis) throw new PairError('PAIR_UNAVAILABLE', 'Сервис привязки устройств недоступен');

  const token = randomBytes(24).toString('hex'); // 48 hex-символов, одноразовый
  const record: PairRecord = { status: 'pending', createdAt: Math.floor(Date.now() / 1000) };
  await redis.set(PAIR_KEY + token, JSON.stringify(record), 'EX', PAIR_TTL_SECONDS);

  return { token, code: `balloo://pair/${token}`, expiresIn: PAIR_TTL_SECONDS };
};

// GET /devices/pair/:token/status — текущий статус кода (null = истёк/нет)
export const getPairRecord = async (token: string): Promise<PairRecord | null> => {
  const redis = getRedis();
  if (!redis) throw new PairError('PAIR_UNAVAILABLE', 'Сервис привязки устройств недоступен');

  const raw = await redis.get(PAIR_KEY + token);
  if (!raw) return null;
  return JSON.parse(raw) as PairRecord;
};

// Одноразовое потребление: после выдачи cookie код удаляется
export const deletePairRecord = async (token: string): Promise<void> => {
  const redis = getRedis();
  if (!redis) throw new PairError('PAIR_UNAVAILABLE', 'Сервис привязки устройств недоступен');
  await redis.del(PAIR_KEY + token);
};

// POST /devices/pair/confirm — подтверждение с АВТОРИЗОВАННОГО устройства:
// генерирует пару токенов для пользователя, создаёт запись Device и кладёт
// подтверждённую запись в Redis (новое устройство заберёт её через статус)
export const confirmPair = async (
  token: string,
  user: { id: string; email: string; username?: string | null; role?: string; avatarUrl?: string | null },
  device: { type: 'web' | 'desktop' | 'android' | 'ios'; name?: string; platform?: string; ip?: string }
): Promise<{ deviceId: string }> => {
  const redis = getRedis();
  if (!redis) throw new PairError('PAIR_UNAVAILABLE', 'Сервис привязки устройств недоступен');

  const raw = await redis.get(PAIR_KEY + token);
  if (!raw) throw new PairError('PAIR_NOT_FOUND', 'Код не найден или истёк');
  const record = JSON.parse(raw) as PairRecord;
  if (record.status === 'confirmed') throw new PairError('PAIR_ALREADY_CONFIRMED', 'Код уже подтверждён');

  const now = Math.floor(Date.now() / 1000);
  const deviceRow = await prisma.device.create({
    data: {
      userId: user.id,
      type: device.type,
      name: device.name || null,
      platform: device.platform || null,
      lastIp: device.ip || null,
      lastActive: BigInt(now),
      createdAt: BigInt(now),
    },
  });

  const tokens = generateTokens(user.id, user.email, user.username || undefined, user.role);

  const confirmed: PairRecord = {
    status: 'confirmed',
    createdAt: record.createdAt,
    userId: user.id,
    username: user.username ?? null,
    avatarUrl: user.avatarUrl ?? null,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    deviceId: deviceRow.id,
  };
  // TTL продлеваем на окно выдачи: новое устройство должно успеть опросить статус
  await redis.set(PAIR_KEY + token, JSON.stringify(confirmed), 'EX', PAIR_PICKUP_TTL);

  return { deviceId: deviceRow.id };
};
