/**
 * Тикет 1794831100 (часть B): refresh-токены реально сохраняются в БД,
 * family-revocation (требование А-02) работает.
 *
 * Причина, по которой не работало никогда: authService.generateTokens() кладёт
 * в familyId crypto.randomUUID() (36 символов), а колонка RefreshToken.familyId
 * была VARCHAR(25). Postgres отвергал INSERT, ошибка проглатывалась try/catch с
 * console.warn → в refresh_tokens не появлялось ни одной строки
 * (замер 16.11.2026: 0 строк при 81 550 пользователях).
 *
 * Миграция: 20261116000000_refresh_token_family_varchar64.
 *
 * Redis подменён in-memory фейком (как в session-revocation.test.ts): ветка
 * reuse-detection в refreshTokens срабатывает только при доступном blacklist.
 */

const store = new Map<string, { value: string; expiresAt: number }>();

let fakeRedis: {
  setex: (key: string, ttl: number, value: string) => Promise<'OK'>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<number>;
} | null = null;

jest.mock('../services/cacheService', () => ({
  getRedis: () => fakeRedis,
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app, registerTestUser, loginTestUser } from './helpers';
import { PrismaClient } from '@prisma/client';
import { refreshTokens } from '../services/authService';

// Пул маленький: max_connections в Postgres = 100, см. комментарий в setup.ts
const env = require('../config/env').env;
const dbUrl: string = env.DATABASE_URL;
const pooledUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}connection_limit=2`;

const prisma = new PrismaClient({
  datasources: { db: { url: pooledUrl } },
});

beforeAll(() => {
  fakeRedis = {
    setex: async (key, ttl, value) => {
      store.set(key, { value: String(value), expiresAt: Date.now() + ttl * 1000 });
      return 'OK';
    },
    get: async (key) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    del: async (key) => {
      const had = store.has(key);
      store.delete(key);
      return had ? 1 : 0;
    },
  };
});

afterAll(async () => {
  await prisma.$disconnect();
});

const claims = (token: string): Record<string, unknown> =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as Record<string, unknown>;

// ============================================================
// B.4 — строка в refresh_tokens появляется на каждый выданный refresh-токен
// ============================================================

describe('B.4 — refresh-токен сохраняется в БД', () => {
  it('POST /api/auth/login пишет строку с jti из токена и familyId длиной 36', async () => {
    const user = await registerTestUser();
    const { refreshToken } = await loginTestUser(user.email, user.password);

    const decoded = claims(refreshToken);
    const jti = decoded.jti as string;
    const familyId = decoded.familyId as string;

    expect(typeof jti).toBe('string');
    expect(familyId).toHaveLength(36); // crypto.randomUUID()

    const row = await prisma.refreshToken.findUnique({ where: { jti } });
    expect(row).not.toBeNull();
    expect(row!.familyId).toBe(familyId);
    expect(row!.userId).toBe(user.id);
    expect(row!.revoked).toBe(false);
  });

  it('регистрация тоже сохраняет токен (generateTokens вызывается на обоих путях)', async () => {
    const user = await registerTestUser();
    const decoded = claims(user.refreshToken);
    const row = await prisma.refreshToken.findUnique({
      where: { jti: decoded.jti as string },
    });
    expect(row).not.toBeNull();
    expect(row!.familyId).toHaveLength(36);
  });
});

// ============================================================
// B.5 — family-revocation: reuse отзывает всю семью, refresh → 401
// ============================================================

describe('B.5 — отзыв семьи refresh-токенов (А-02)', () => {
  it('повторное использование отозванного refresh гасит ВСЕ строки семьи и даёт 401', async () => {
    const user = await registerTestUser();
    const { refreshToken: firstToken } = await loginTestUser(user.email, user.password);
    const first = claims(firstToken);
    const familyId = first.familyId as string;

    // Ротация: старый JTI уходит в blacklist, новый токен получает ту же family
    const rotated = await refreshTokens(firstToken);
    const rotatedClaims = claims(rotated.refreshToken);
    expect(rotatedClaims.familyId).toBe(familyId);

    // В БД — две строки семьи, старая помечена revoked
    const oldRow = await prisma.refreshToken.findUnique({
      where: { jti: first.jti as string },
    });
    expect(oldRow!.revoked).toBe(true);
    const newRow = await prisma.refreshToken.findUnique({
      where: { jti: rotatedClaims.jti as string },
    });
    expect(newRow).not.toBeNull();
    expect(newRow!.revoked).toBe(false);

    // Replay украденного токена → reuse → отзыв всей семьи
    await expect(refreshTokens(firstToken)).rejects.toThrow(/отозван/);

    const alive = await prisma.refreshToken.count({
      where: { familyId, revoked: false },
    });
    expect(alive).toBe(0);

    const all = await prisma.refreshToken.findMany({ where: { familyId } });
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.every((t) => t.revoked)).toBe(true);

    // Refresh отозванным токеном через HTTP → 401
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: rotated.refreshToken })
      .expect(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
