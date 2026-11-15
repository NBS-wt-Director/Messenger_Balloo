/**
 * Тесты middleware/rateLimit.ts (тикеты 1790479490-08 / В-93, критический контур).
 *
 * Лимитеры — однопоточный memory-store на весь процесс, поэтому каждый кейс
 * получает собственный IP через X-Forwarded-For (trust proxy включён) и не
 * зависит от порядка других кейсов.
 */
import express from 'express';
import request from 'supertest';
import { applyRateLimit } from '../middleware/rateLimit';

let ipCounter = 0;
const nextIp = () => {
  ipCounter += 1;
  return `10.77.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
};

function makeApp(opts?: {
  user?: { id: string };
  hideIp?: boolean;
  socketRemoteAddress?: string;
}) {
  const app = express();
  app.set('trust proxy', true);

  if (opts?.user) {
    const user = opts.user;
    app.use((req, _res, next) => {
      (req as any).user = user;
      next();
    });
  }

  if (opts?.hideIp) {
    app.use((req, _res, next) => {
      // Тень для expr-геттера req.ip → getClientId уходит в req.socket.remoteAddress
      Object.defineProperty(req, 'ip', { value: undefined, configurable: true });
      if (opts.socketRemoteAddress === undefined) {
        (req as any).socket = {};
      } else {
        (req as any).socket = { remoteAddress: opts.socketRemoteAddress };
      }
      next();
    });
  }

  app.use(applyRateLimit);

  const ok = (_req: any, res: any) => res.json({ ok: true });
  app.post('/api/auth/login', ok);
  app.get('/api/auth/oauth/yandex', (_req, res) => res.redirect(302, 'https://oauth.test/example'));
  app.post('/api/upload/file', ok);
  app.post('/api/chats/c1/messages', ok);
  app.get('/api/other', ok);
  return app;
}

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
  it('POST /api/auth/* жёсткий лимит 5/мин → 429 с текстом про авторизацию', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      for (let i = 0; i < 5; i += 1) {
        const res = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({});
        expect(res.status).toBe(200);
      }
      const limited = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({});
      expect(limited.status).toBe(429);
      expect(limited.body).toEqual({
        error: 'Слишком много попыток авторизации. Подождите 1 минуту',
        retryAfter: '1 minute',
      });
    });
  });

  it('GET /api/auth/oauth/* — исключение P28: редирект не упирается в authLimiter', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      // 8 раз подряд: authLimiter (5) дал бы 429, apiLimiter (100) не даёт
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
   * попадали под authLimiter (5/мин). Реальный сценарий двух окон: каждая
   * вкладка при загрузке делает 2× refresh-cookie (React StrictMode дублирует
   * эффект) + 1× ws-token, и только потом логин. Итого второй вход
   * упирался в 429 «Слишком много попыток авторизации», хотя пароль никто не
   * подбирал. Проверка идёт одним IP — как два окна за одним NAT.
   */
  it('обслуживание сессии (ws-token, refresh-cookie) не сжигает лимит входа', async () => {
    const app = express();
    app.set('trust proxy', true);
    app.use(applyRateLimit);
    const ok = (_req: any, res: any) => res.json({ ok: true });
    app.get('/api/auth/ws-token', ok);
    app.post('/api/auth/refresh-cookie', ok);
    app.post('/api/auth/login', ok);

    const ip = nextIp();

    await withNodeEnv('development', async () => {
      // Окно A: 2 refresh + 2 ws-token (StrictMode) + вход
      for (let i = 0; i < 2; i += 1) {
        expect((await request(app).post('/api/auth/refresh-cookie').set('X-Forwarded-For', ip).send({})).status).toBe(200);
      }
      for (let i = 0; i < 2; i += 1) {
        expect((await request(app).get('/api/auth/ws-token').set('X-Forwarded-For', ip)).status).toBe(200);
      }
      expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({})).status).toBe(200);

      // Окно B с того же IP: те же 5 вызовов + свой вход. До фикса вход падал
      // в 429 — authLimiter уже был исчерпан служебными запросами окна A.
      for (let i = 0; i < 2; i += 1) {
        expect((await request(app).post('/api/auth/refresh-cookie').set('X-Forwarded-For', ip).send({})).status).toBe(200);
      }
      for (let i = 0; i < 2; i += 1) {
        expect((await request(app).get('/api/auth/ws-token').set('X-Forwarded-For', ip)).status).toBe(200);
      }
      const secondLogin = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({});
      expect(secondLogin.status).toBe(200);

      // Но строгий лимит на сам ввод учётных данных сохраняется: ещё 4 логина
      // (всего 6 за минуту) обязан отбить authLimiter.
      for (let i = 0; i < 3; i += 1) {
        expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({})).status).toBe(200);
      }
      const exhausted = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({});
      expect(exhausted.status).toBe(429);
      expect(exhausted.body.error).toContain('авторизации');
    });
  });

  it('POST /api/upload/* → uploadLimiter 10/мин', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      for (let i = 0; i < 10; i += 1) {
        const res = await request(app).post('/api/upload/file').set('X-Forwarded-For', ip).send({});
        expect(res.status).toBe(200);
      }
      const limited = await request(app).post('/api/upload/file').set('X-Forwarded-For', ip).send({});
      expect(limited.status).toBe(429);
      expect(limited.body.error).toBe('Превышен лимит загрузки файлов');
    });
  });

  it('POST /api/chats/:id/messages → messageLimiter 30/мин', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      for (let i = 0; i < 30; i += 1) {
        const res = await request(app).post('/api/chats/c1/messages').set('X-Forwarded-For', ip).send({});
        expect(res.status).toBe(200);
      }
      const limited = await request(app).post('/api/chats/c1/messages').set('X-Forwarded-For', ip).send({});
      expect(limited.status).toBe(429);
      expect(limited.body.error).toBe('Слишком много сообщений. Подождите');
    });
  });

  it('прочие пути → apiLimiter (100) со стандартными заголовками RateLimit', async () => {
    const app = makeApp();
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      const res = await request(app).get('/api/other').set('X-Forwarded-For', ip);
      expect(res.status).toBe(200);
      // standardHeaders: true, legacyHeaders: false → заголовки RateLimit-* без
      // устаревших X-RateLimit-*, лимит общего API = 100 за окно 900 с
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
      expect(res.headers['ratelimit-limit']).toBe('100');
      expect(res.headers['ratelimit-remaining']).toBe('99');
      expect(res.headers['ratelimit-policy']).toBe('100;w=900');
    });
  });
});

describe('getClientId — ключ лимитирования', () => {
  it('аутентифицированные пользователи считаются раздельно с одного IP', async () => {
    const ip = nextIp();

    await withNodeEnv('development', async () => {
      // первый пользователь: 5 попыток исчерпывают authLimiter (ключ user:<id>)
      const appA = makeApp({ user: { id: 'user-A' } });
      for (let i = 0; i < 5; i += 1) {
        expect((await request(appA).post('/api/auth/login').set('X-Forwarded-For', ip).send({})).status).toBe(200);
      }
      expect((await request(appA).post('/api/auth/login').set('X-Forwarded-For', ip).send({})).status).toBe(429);

      // второй пользователь на том же IP — лимит не потрачен
      const appB = makeApp({ user: { id: 'user-B' } });
      expect((await request(appB).post('/api/auth/login').set('X-Forwarded-For', ip).send({})).status).toBe(200);
    });
  });

  it('без req.ip ключ берётся из req.socket.remoteAddress', async () => {
    const app = makeApp({ hideIp: true, socketRemoteAddress: '203.0.113.9' });
    await withNodeEnv('development', async () => {
      for (let i = 0; i < 5; i += 1) {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(200);
      }
      expect((await request(app).post('/api/auth/login').send({})).status).toBe(429);
    });
  });

  it('без ip и без remoteAddress ключ = unknown, лимит работает и не падает', async () => {
    const app = makeApp({ hideIp: true });
    await withNodeEnv('development', async () => {
      for (let i = 0; i < 5; i += 1) {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(200);
      }
      const limited = await request(app).post('/api/auth/login').send({});
      expect(limited.status).toBe(429);
      expect(limited.body.error).toContain('авторизации');
    });
  });
});
