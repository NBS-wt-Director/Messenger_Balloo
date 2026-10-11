/**
 * Тикет 1791201780, задача D-3: logout не инвалидировал токены.
 *
 * Access-токен — stateless JWT, поэтому «выйти на всех устройствах» требует
 * серверной метки отзыва. Здесь покрывается весь контур:
 *  - services/sessionRevocation — запись/чтение метки, все fail-open ветки;
 *  - middleware/auth.ts — authRequired и authRefresh отклоняют токен до отзыва;
 *  - POST /api/auth/logout с allDevices — гасит и другие устройства;
 *  - resetPassword — старые сессии после смены пароля не живут.
 *
 * Redis подменён in-memory фейком (Map + TTL) как в devices-pair.test.ts:
 * прод-семантика setex/get с TTL сохраняется, реальное подключение не нужно.
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
import { app, registerTestUser, generateToken } from './helpers';
import { PrismaClient } from '@prisma/client';
import { revokeAllSessions, isSessionRevoked } from '../services/sessionRevocation';
import { resetPassword } from '../services/authService';

// Пул намеренно маленький: Prisma по умолчанию берёт 2*CPU+1 соединений на
// воркер Jest, а max_connections в Postgres = 100. Без лимита полный прогон
// выбивает другие наборы в 500 на ровном месте (упирался admin/metrics).
// Разделитель выбирается по факту: в DATABASE_URL уже есть ?schema=public.
const env = require('../config/env').env;
const dbUrl: string = env.DATABASE_URL;
const pooledUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}connection_limit=2`;

const prisma = new PrismaClient({
  datasources: { db: { url: pooledUrl } },
});

const REVOKED_KEY = (userId: string) => `revoked-at:${userId}`;

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
      store.delete(key);
      return 1;
    },
  };
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Секунды с меткой «в прошлом», чтобы iat токена заведомо был раньше отзыва
const nowSec = () => Math.floor(Date.now() / 1000);

describe('sessionRevocation — метка отзыва сессий', () => {
  it('нет метки → токен жив', async () => {
    await expect(isSessionRevoked('user-without-revocation', nowSec())).resolves.toBe(false);
  });

  it('revokeAllSessions пишет метку, старый токен считается отозванным', async () => {
    const userId = `u_rev_${Date.now()}`;
    await revokeAllSessions(userId);

    expect(store.has(REVOKED_KEY(userId))).toBe(true);
    await expect(isSessionRevoked(userId, nowSec() - 60)).resolves.toBe(true);
  });

  it('токен, выданный после отзыва, остаётся валидным', async () => {
    const userId = `u_after_${Date.now()}`;
    // Метка час назад: всё, что выдано позже, — новая сессия
    store.set(REVOKED_KEY(userId), {
      value: String(nowSec() - 3600),
      expiresAt: Date.now() + 60_000,
    });

    await expect(isSessionRevoked(userId, nowSec())).resolves.toBe(false);
  });

  it('метка с мусором вместо unix-времени → токен не отзывается', async () => {
    const userId = `u_junk_${Date.now()}`;
    store.set(REVOKED_KEY(userId), { value: 'not-a-number', expiresAt: Date.now() + 60_000 });

    await expect(isSessionRevoked(userId, nowSec() - 60)).resolves.toBe(false);
  });

  it('Redis недоступен → fail-open: ни отзыв не падает, ни запрос не блокируется', async () => {
    fakeRedis = null;
    try {
      await expect(revokeAllSessions('u_no_redis')).resolves.toBeUndefined();
      await expect(isSessionRevoked('u_no_redis', nowSec() - 60)).resolves.toBe(false);
    } finally {
      fakeRedis = makeRedis();
    }
  });

  it('Redis бросает ошибку на get → fail-open', async () => {
    fakeRedis = {
      setex: async () => 'OK',
      get: async () => {
        throw new Error('connection refused');
      },
      del: async () => 1,
    };
    try {
      await expect(isSessionRevoked('u_broken', nowSec() - 60)).resolves.toBe(false);
    } finally {
      fakeRedis = makeRedis();
    }
  });

  it('Redis бросает ошибку на setex → отзыв не роняет logout', async () => {
    fakeRedis = {
      setex: async () => {
        throw new Error('READONLY');
      },
      get: async () => null,
      del: async () => 1,
    };
    try {
      await expect(revokeAllSessions('u_ro')).resolves.toBeUndefined();
    } finally {
      fakeRedis = makeRedis();
    }
  });
});

function makeRedis() {
  return {
    setex: async (key: string, ttl: number, value: string) => {
      store.set(key, { value: String(value), expiresAt: Date.now() + ttl * 1000 });
      return 'OK' as const;
    },
    get: async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
  };
}

describe('middleware/auth — отклонение отозванного токена', () => {
  it('GET /api/users/me с токеном до отзыва → 401 token_revoked', async () => {
    const user = await registerTestUser();

    // Токен, выданный час назад: сначала он работает
    const staleToken = jwtSignBackdated(user.id, user.email);
    const before = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${staleToken}`);
    expect(before.status).toBe(200);

    await revokeAllSessions(user.id);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${staleToken}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('token_revoked');
  });

  it('токен, выданный после отзыва, проходит', async () => {
    const user = await registerTestUser();

    // Отзыв час назад → токен, выданный сейчас, это уже новая сессия
    store.set(REVOKED_KEY(user.id), {
      value: String(nowSec() - 3600),
      expiresAt: Date.now() + 60_000,
    });

    const fresh = generateToken(user.id, user.email, user.username);
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${fresh}`);

    expect(res.status).toBe(200);
  });

  it('POST /api/auth/refresh отозванным refresh-токеном → 401 token_revoked', async () => {
    const user = await registerTestUser();
    const staleRefresh = jwtSignBackdatedRefresh(user.id, user.email);

    await revokeAllSessions(user.id);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${staleRefresh}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('token_revoked');
  });
});

describe('POST /api/auth/logout — allDevices', () => {
  it('allDevices=true снимает и другие устройства', async () => {
    const user = await registerTestUser();
    // «второе устройство»: свой access-токен того же пользователя
    const otherDeviceToken = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: user.refreshToken, allDevices: true });

    expect(res.status).toBe(200);

    const probe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${otherDeviceToken}`);

    expect(probe.status).toBe(401);
    expect(probe.body.code).toBe('token_revoked');
  });

  it('без allDevices отзыв других сессий не происходит', async () => {
    const user = await registerTestUser();
    const otherDeviceToken = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: user.refreshToken });

    expect(res.status).toBe(200);

    const probe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${otherDeviceToken}`);

    expect(probe.status).toBe(200);
  });

  it('clear-cookie с allDevices тоже отзывает все сессии', async () => {
    const user = await registerTestUser();
    const otherDeviceToken = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/auth/clear-cookie')
      .send({ refreshToken: user.refreshToken, allDevices: true });

    expect(res.status).toBe(200);

    const probe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${otherDeviceToken}`);

    expect(probe.status).toBe(401);
  });
});

describe('POST /api/auth/logout-all — endpoint', () => {
  it('отзывает сессии и отвечает 200', async () => {
    const user = await registerTestUser();

    const res = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('всех устройствах');
    // метка отзыва записана в Redis (фейк)
    expect(store.has(REVOKED_KEY(user.id))).toBe(true);
  });

  it('без auth → 401', async () => {
    const res = await request(app).post('/api/auth/logout-all');
    expect(res.status).toBe(401);
  });
});

describe('resetPassword отзывает старые сессии', () => {  it('сброс пароля гасит ранее выданные токены', async () => {
    const user = await registerTestUser();
    const beforeReset = generateToken(user.id, user.email, user.username);

    const token = `rst_${Date.now()}_${process.pid}`;
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: 'password_reset',
        // сервис ищет по SHA-256 токена (тик. исправить-forgot-password-timing-i-token)
        token: require('crypto').createHash('sha256').update(token, 'utf8').digest('hex'),
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600),
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });

    await resetPassword({ token, newPassword: 'NewPass12345' });

    const probe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${beforeReset}`);

    expect(probe.status).toBe(401);
    expect(probe.body.code).toBe('token_revoked');
  });
});

// --- Токены с iat в прошлом: revocation сравнивает именно время выдачи ---

function jwtSignBackdated(userId: string, email: string): string {
  const jwt = require('jsonwebtoken');
  const env = require('../config/env').env;
  const iat = nowSec() - 3600;
  return jwt.sign(
    { userId, email, username: 'probe', role: 'user', type: 'access', iat, exp: iat + 7200 },
    env.JWT_ACCESS_SECRET
  );
}

function jwtSignBackdatedRefresh(userId: string, email: string): string {
  const jwt = require('jsonwebtoken');
  const env = require('../config/env').env;
  const iat = nowSec() - 3600;
  return jwt.sign(
    { userId, email, username: 'probe', role: 'user', type: 'refresh', iat, exp: iat + 7200 },
    env.JWT_REFRESH_SECRET
  );
}
