/**
 * Тесты middleware/rateLimit.ts (тик. 1795343610; ранее 1790479490-08 / В-93).
 *
 * Новое поведение (решение владельца 22.11.2026):
 *   • все лимитеры — 3000 запросов / 15 минут;
 *   • ключ «на каждого свой»: userId (req.user или подписанный access-cookie),
 *     иначе реальный IP (trust proxy=1);
 *   • маршрутизация по пути — через pickLimiter.
 *
 * Лимитеры — однопоточный memory-store на весь процесс, поэтому каждый кейс
 * берёт собственный IP (X-Forwarded-For) или userId и не зависит от порядка
 * других кейсов.
 */
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  applyRateLimit,
  getClientId,
  pickLimiter,
  apiLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  serviceLimiter,
  oauthLimiter,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from '../middleware/rateLimit';
import { ACCESS_COOKIE } from '../middleware/auth';

let ipCounter = 0;
const nextIp = () => {
  ipCounter += 1;
  return `10.77.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
};

function makeApp(opts?: { user?: { id: string } }) {
  const app = express();
  // 1 (число хопов), а не true — как в app.ts: true падает в express-rate-limit.
  app.set('trust proxy', 1);

  if (opts?.user) {
    const user = opts.user;
    app.use((req, _res, next) => {
      (req as any).user = user;
      next();
    });
  }

  app.use(applyRateLimit);

  const ok = (_req: any, res: any) => res.json({ ok: true });
  app.post('/api/auth/login', ok);
  app.get('/api/auth/oauth/yandex', (_req, res) => res.redirect(302, 'https://oauth.test/example'));
  app.get('/api/auth/ws-token', ok);
  app.post('/api/auth/refresh-cookie', ok);
  app.post('/api/upload/file', ok);
  app.post('/api/chats/c1/messages', ok);
  app.get('/api/other', ok);
  return app;
}

/** Минимальный объект запроса для юнит-тестов getClientId/pickLimiter. */
const fakeReq = (over: Record<string, unknown> = {}) =>
  ({ cookies: {}, socket: {}, ...over }) as any;

const withNodeEnv = (value: string, fn: () => Promise<void>) => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = value;
  return fn().finally(() => {
    process.env.NODE_ENV = previous;
  });
};

describe('applyRateLimit — режим тестов', () => {
  it('при NODE_ENV=test пропускает запросы и не считает лимит (5× auth = 200)', async () => {
    const app = makeApp();
    const ip = nextIp();

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({});
      expect(res.status).toBe(200);
    }
  });
});

describe('applyRateLimit — стратегия по пути', () => {
  it('все лимитеры: 3000/15мин — заголовки RateLimit на общем пути', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      const res = await request(app).get('/api/other').set('X-Forwarded-For', ip);
      expect(res.status).toBe(200);
      // standardHeaders: true, legacyHeaders: false → заголовки RateLimit-* без
      // устаревших X-RateLimit-*; лимит общего API = 3000 за окно 900 с.
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
      expect(res.headers['ratelimit-limit']).toBe(String(RATE_LIMIT_MAX));
      expect(res.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
      expect(res.headers['ratelimit-policy']).toBe(
        `${RATE_LIMIT_MAX};w=${RATE_LIMIT_WINDOW_MS / 1000}`,
      );
    });
  });

  it('GET /api/auth/oauth/* — исключение P28: редирект не упирается в authLimiter', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      for (let i = 0; i < 8; i += 1) {
        const res = await request(app).get('/api/auth/oauth/yandex').set('X-Forwarded-For', ip);
        expect(res.status).toBe(302);
      }
    });
  });

  /**
   * Регрессия приёмки «два окна» (тик. 1793567633, 15.11.2026).
   *
   * Служебные вызовы уже авторизованной сессии — GET /api/auth/ws-token и
   * POST /api/auth/refresh-cookie — лежали в одном префиксе /api/auth/ и
   * попадали под authLimiter. Теперь они считаются общим apiLimiter, поэтому
   * проверяем раздельность счётчиков через заголовок RateLimit-Remaining:
   * refresh-cookie и /api/other делят apiLimiter, а login — отдельный authLimiter.
   */
  it('служебные ws-token / refresh-cookie считаются apiLimiter, а не authLimiter', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      const refresh = await request(app)
        .post('/api/auth/refresh-cookie')
        .set('X-Forwarded-For', ip)
        .send({});
      expect(refresh.status).toBe(200);
      expect(refresh.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));

      // /api/other — тот же apiLimiter: счётчик общий с refresh-cookie
      const other = await request(app).get('/api/other').set('X-Forwarded-For', ip);
      expect(other.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 2));

      // login — отдельный authLimiter: свой счётчик, apiLimiter не тронут
      const login = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({});
      expect(login.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
    });
  });

  it('POST /api/upload/* → uploadLimiter (свой счётчик)', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      const res = await request(app).post('/api/upload/file').set('X-Forwarded-For', ip).send({});
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
    });
  });

  it('POST /api/chats/:id/messages → messageLimiter (свой счётчик)', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      const res = await request(app)
        .post('/api/chats/c1/messages')
        .set('X-Forwarded-For', ip)
        .send({});
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
    });
  });

  it('лимит на каждого: два userId с одного IP не делят счётчик', async () => {
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      const appA = makeApp({ user: { id: `user-A-${ip}` } });
      for (let i = 0; i < 2; i += 1) {
        await request(appA).get('/api/other').set('X-Forwarded-For', ip);
      }
      const thirdA = await request(appA).get('/api/other').set('X-Forwarded-For', ip);
      expect(thirdA.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 3));

      // Другой пользователь на том же IP — свой ключ, счётчик не тронут
      const appB = makeApp({ user: { id: `user-B-${ip}` } });
      const firstB = await request(appB).get('/api/other').set('X-Forwarded-For', ip);
      expect(firstB.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
    });
  });

  it('гость: разные IP — разные ключи (trust proxy отдаёт реальный адрес)', async () => {
    const app = makeApp();
    const ipA = nextIp();
    const ipB = nextIp();

    await withNodeEnv('development', async () => {
      const firstA = await request(app).get('/api/other').set('X-Forwarded-For', ipA);
      expect(firstA.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
      const secondA = await request(app).get('/api/other').set('X-Forwarded-For', ipA);
      expect(secondA.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 2));

      const firstB = await request(app).get('/api/other').set('X-Forwarded-For', ipB);
      expect(firstB.headers['ratelimit-remaining']).toBe(String(RATE_LIMIT_MAX - 1));
    });
  });
});

describe('getClientId — ключ лимитирования «на каждого свой»', () => {
  const sign = (payload: Record<string, unknown>) => jwt.sign(payload, env.JWT_ACCESS_SECRET);

  it('req.user.id → user:<id>', () => {
    expect(getClientId(fakeReq({ user: { id: 'u1' } }))).toBe('user:u1');
  });

  it('подписанный access-cookie → user:<id> (лимитер идёт до authRequired)', () => {
    const token = sign({ userId: 'u2', type: 'access' });
    expect(getClientId(fakeReq({ cookies: { [ACCESS_COOKIE]: token } }))).toBe('user:u2');
  });

  it('токен без userId → ключ по IP', () => {
    const token = sign({ type: 'access' });
    expect(getClientId(fakeReq({ cookies: { [ACCESS_COOKIE]: token }, ip: '1.2.3.4' }))).toBe(
      'ip:1.2.3.4',
    );
  });

  it('битый токен → ключ по IP (не падает)', () => {
    expect(getClientId(fakeReq({ cookies: { [ACCESS_COOKIE]: 'not-a-jwt' }, ip: '5.6.7.8' }))).toBe(
      'ip:5.6.7.8',
    );
  });

  it('без cookies и без user → ключ по req.ip', () => {
    expect(getClientId(fakeReq({ cookies: undefined, ip: '10.0.0.1' }))).toBe('ip:10.0.0.1');
  });

  it('без req.ip → ключ по req.socket.remoteAddress', () => {
    expect(getClientId(fakeReq({ ip: undefined, socket: { remoteAddress: '203.0.113.9' } }))).toBe(
      'ip:203.0.113.9',
    );
  });

  it('без ip и remoteAddress → ключ unknown (лимит работает и не падает)', () => {
    expect(getClientId(fakeReq({ ip: undefined, socket: {} }))).toBe('ip:unknown');
    expect(getClientId(fakeReq({ ip: undefined, socket: undefined }))).toBe('ip:unknown');
  });
});

describe('pickLimiter — выбор лимитера по пути', () => {
  const r = (path: string, method = 'GET') => ({ path, method }) as any;

  it('service API → serviceLimiter', () => {
    expect(pickLimiter(r('/api/service/users'))).toBe(serviceLimiter);
  });

  it('GET /api/auth/oauth/* → oauthLimiter', () => {
    expect(pickLimiter(r('/api/auth/oauth/yandex'))).toBe(oauthLimiter);
  });

  it('POST /api/auth/oauth/* → authLimiter (не GET-редирект)', () => {
    expect(pickLimiter(r('/api/auth/oauth/yandex', 'POST'))).toBe(authLimiter);
  });

  it('ws-token и refresh-cookie → apiLimiter', () => {
    expect(pickLimiter(r('/api/auth/ws-token'))).toBe(apiLimiter);
    expect(pickLimiter(r('/api/auth/refresh-cookie', 'POST'))).toBe(apiLimiter);
  });

  it('POST /api/auth/login → authLimiter', () => {
    expect(pickLimiter(r('/api/auth/login', 'POST'))).toBe(authLimiter);
  });

  it('/api/upload/* → uploadLimiter', () => {
    expect(pickLimiter(r('/api/upload/file', 'POST'))).toBe(uploadLimiter);
  });

  it('/api/chats/:id/messages → messageLimiter', () => {
    expect(pickLimiter(r('/api/chats/c1/messages', 'POST'))).toBe(messageLimiter);
  });

  it('/api/chats/:id без /messages → apiLimiter', () => {
    expect(pickLimiter(r('/api/chats/c1'))).toBe(apiLimiter);
  });

  it('прочие пути → apiLimiter', () => {
    expect(pickLimiter(r('/api/users/me'))).toBe(apiLimiter);
  });
});
