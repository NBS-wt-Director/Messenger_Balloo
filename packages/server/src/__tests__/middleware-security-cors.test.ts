/**
 * Тесты безопасности middleware (security.ts + cors.ts).
 *
 * До этого файла из security.ts был покрыт только cspConnectSrc: csrfProtection,
 * rateLimitLogger, securityLogger и dataExport не исполнялись ни в
 * одном тесте, cors.ts — тоже. Здесь проверяется фактическое поведение:
 *  - csrfProtection пропускает безопасные методы и JWT, а без JWT и без
 *    X-CSRF-Token пишет предупреждение (и всё равно идёт дальше — это fallback);
 *  - rateLimitLogger перехватывает res.json и логирует только 429;
 *  - securityLogger детектит подозрительные паттерны в path/query/referer;
 *  - cors: origin берётся только из списка CORS_ORIGIN; '*' и пустое значение
 *    отклоняет схема env (тик. 1791489922), чужой origin не получает
 *    Access-Control-Allow-Origin, preflight получает Allow-Methods/Allow-Headers/Max-Age.
 */
import request from 'supertest';
import express from 'express';
import {
  csrfProtection,
  rateLimitLogger,
  securityLogger,
  dataExport,
  securityHeaders,
  hppMiddleware,
} from '../middleware/security';

type Json = Record<string, unknown>;

function makeApp(
  mw: (req: express.Request, res: express.Response, next: express.NextFunction) => void,
  extra?: (app: express.Express) => void,
) {
  const app = express();
  app.use(express.json());
  if (extra) extra(app);
  app.use(mw);
  app.all('/api/target', (req, res) =>
    res.json({ body: req.body, query: req.query, cookies: req.cookies }),
  );
  return app;
}

describe('csrfProtection', () => {
  it('не трогает безопасные методы (GET/HEAD/OPTIONS)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = makeApp(csrfProtection);

    const get = await request(app).get('/api/target');
    const head = await request(app).head('/api/target');
    const options = await request(app).options('/api/target');

    expect(get.status).toBe(200);
    expect(head.status).toBe(200);
    expect([200, 204]).toContain(options.status);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('POST с Bearer-токеном — CSRF не нужен', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = makeApp(csrfProtection);

    const res = await request(app)
      .post('/api/target')
      .set('Authorization', 'Bearer abc.def.ghi')
      .send({ a: 1 });

    expect(res.status).toBe(200);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('POST без JWT и без X-CSRF-Token — предупреждение, но запрос проходит', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = makeApp(csrfProtection);

    const res = await request(app).post('/api/target').send({ a: 1 });

    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[CSRF] Missing X-CSRF-Token'),
      'POST',
      '/api/target',
    );
    warn.mockRestore();
  });

  it('POST без JWT, но с X-CSRF-Token — тихо', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = makeApp(csrfProtection);

    const res = await request(app)
      .post('/api/target')
      .set('X-CSRF-Token', 'token-1')
      .send({ a: 1 });

    expect(res.status).toBe(200);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('Authorization не-Bearer (Basic) JWT-запросом не считается', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = makeApp(csrfProtection);

    const res = await request(app).post('/api/target').set('Authorization', 'Basic Zm9vOmJhcg==').send({});

    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('rateLimitLogger', () => {
  it('логирует 429 с методом, путём, ip и пользователем', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = express();
    app.use(rateLimitLogger);
    app.get('/api/limited', (req, res) => {
      (req as any).user = { id: 11 };
      res.status(429).json({ error: 'Too Many Requests' });
    });

    const res = await request(app).get('/api/limited');

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too Many Requests');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[RATE LIMIT] GET /api/limited'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('user: 11'));
    warn.mockRestore();
  });

  it('анонимного пользователя пишет как anonymous', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = express();
    app.use(rateLimitLogger);
    app.get('/api/limited', (_req, res) => res.status(429).json({ error: 'x' }));

    await request(app).get('/api/limited');

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('user: anonymous'));
    warn.mockRestore();
  });

  it('на 200 не пишет ничего и res.json остаётся рабочим', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = express();
    app.use(rateLimitLogger);
    app.get('/api/ok', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/api/ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('securityLogger', () => {
  const run = async (url: string, referer?: string) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = express();
    app.use(securityLogger);
    app.get('/api/search', (_req, res) => res.json({ ok: true }));
    const req = request(app).get(url);
    if (referer) req.set('Referer', referer);
    const res = await req;
    const message = warn.mock.calls.length ? String(warn.mock.calls[0][0]) : '';
    warn.mockRestore();
    return { res, message };
  };

  it.each([
    ['XSS-скрипт в query', '/api/search?q=%3Cscript%3Ealert(1)%3C/script%3E'],
    ['javascript: URL', '/api/search?url=javascript%3Aalert(1)'],
    ['SQL union select', '/api/search?q=union%20select'],
    ['drop table', '/api/search?q=drop%20table'],
    ['; delete', '/api/search?q=%3B%20delete%20from%20users'],
    ['path traversal', '/api/search?f=%2E%2E%2Fetc%2Fpasswd'],
    ['null byte', '/api/search?f=%2500'],
    ['iframe', '/api/search?html=%3Ciframe%3E'],
    ['eval()', '/api/search?c=eval%281%29'],
  ])('детектит (%s) и пишет ALERT, не блокируя запрос', async (_name, url) => {
    const { res, message } = await run(url);
    expect(res.status).toBe(200);
    expect(message).toContain('[SECURITY ALERT]');
  });

  it('детектит подозрительный referer', async () => {
    const { message } = await run('/api/search?q=ok', 'https://evil.test/<script>x</script>');
    expect(message).toContain('[SECURITY ALERT]');
  });

  it('чистый запрос не логирует', async () => {
    const { res, message } = await run('/api/search?q=отзыв%20о%20баллоне');
    expect(res.status).toBe(200);
    expect(message).toBe('');
  });
});

describe('dataExport и экспорт по типу', () => {
  it('dataExport — factory-заглушка, вызывает next', () => {
    const next = jest.fn();
    const req = { method: 'GET' } as any;
    const res = {} as any;

    expect(() => dataExport({}, req, res, next)).not.toThrow();
    expect(next).toHaveBeenCalled();
  });

  it('securityHeaders и hppMiddleware — готовые обработчики express', () => {
    expect(typeof securityHeaders).toBe('function');
    expect(typeof hppMiddleware).toBe('function');
  });

  it('hpp оставляет последний дублированный параметр, whitelist не трогает', async () => {
    const app = express();
    app.use(hppMiddleware);
    app.get('/api/hpp', (req, res) => res.json({ query: req.query }));

    const polluted = await request(app).get('/api/hpp?id=1&id=2');
    expect(polluted.body.query.id).toBe('2');

    const whitelisted = await request(app).get('/api/hpp?tags=a&tags=b');
    expect(whitelisted.body.query.tags).toEqual(['a', 'b']);
  });
});

describe('cors.ts', () => {
  const buildApp = (corsMiddleware: express.RequestHandler) => {
    const app = express();
    app.use(corsMiddleware);
    app.get('/api/ping', (_req, res) => res.json({ pong: true }));
    app.options('/api/ping', (_req, res) => res.sendStatus(204));
    return app;
  };

  // CORS middleware читает env при импорте модуля, поэтому значение ставится
  // перед каждым require + jest.resetModules(). Так тест не зависит от того,
  // что лежит в packages/server/.env или в env прогона CI.
  const loadCors = (corsOrigin: string): express.RequestHandler => {
    process.env.CORS_ORIGIN = corsOrigin;
    jest.resetModules();
    return require('../middleware/cors').corsMiddleware;
  };

  // Сообщения zod ищутся по пути поля, а не по полному тексту — иначе тест
  // падает при любой правке формулировки в config/env.ts.
  const issueFor = (result: { success: boolean; error?: any }, field: string): string => {
    const issues = (result.error?.issues ?? []).filter((i: any) => i.path[0] === field);
    return issues.map((i: any) => i.message).join(' | ');
  };

  const baseEnv = {
    DATABASE_URL: 'postgresql://localhost:5432/balloo',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  it('env: CORS_ORIGIN="*" отклоняется схемой (был бы ACAO любому сайту)', () => {
    const { envSchema } = require('../config/env');
    const result = envSchema.safeParse({ ...baseEnv, CORS_ORIGIN: '*' });

    expect(result.success).toBe(false);
    expect(issueFor(result, 'CORS_ORIGIN')).toContain('*');
  });

  it('env: без CORS_ORIGIN схема отклоняет (fail-fast вместо дефолта "*")', () => {
    const { envSchema } = require('../config/env');
    const result = envSchema.safeParse(baseEnv);

    expect(result.success).toBe(false);
    expect(issueFor(result, 'CORS_ORIGIN')).not.toBe('');
  });

  it('env: список origin\'ов принимается', () => {
    const { envSchema } = require('../config/env');
    const result = envSchema.safeParse({
      ...baseEnv,
      CORS_ORIGIN: 'https://balloo.su,https://admin.balloo.su',
    });

    expect(result.success).toBe(true);
  });

  it('CORS_ORIGIN-список (тик. №0): разрешает только свои origin' + 'ы поддоменов', async () => {
    const corsMiddleware = loadCors('https://balloo.su,https://admin.balloo.su');
    const app = buildApp(corsMiddleware);

    const allowed = await request(app).get('/api/ping').set('Origin', 'https://admin.balloo.su');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://admin.balloo.su');

    const foreign = await request(app).get('/api/ping').set('Origin', 'https://evil.test');
    // Решение владельца (тик. 1791489922): чужому origin не выдаётся
    // Access-Control-Allow-Origin — браузер не отдаст ответ скрипту врага.
    expect(foreign.headers['access-control-allow-origin']).toBeUndefined();
    // Access-Control-Allow-Credentials cors пишет и при запрещённом origin —
    // без ACAO он бесполезен (браузеру нужен разрешающий ACAO), поэтому здесь
    // это не дыра, а шум. Фиксируем поведение, чтобы правка CORS его не меняла.
    expect(foreign.headers['access-control-allow-credentials']).toBe('true');
  });

  it('тик. 1791489922: чужой origin не получает ACAO даже на POST с cookie', async () => {
    const corsMiddleware = loadCors('https://balloo.su');
    const app = buildApp(corsMiddleware);
    app.post('/api/transfer', (_req, res) => res.json({ ok: true }));

    const res = await request(app)
      .post('/api/transfer')
      .set('Origin', 'https://attacker.example')
      .set('Cookie', 'balloo-access-token=stealing')
      .send({});

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preflight: Allow-Methods с PATCH, Allow-Headers с Authorization, Max-Age 600', async () => {
    const corsMiddleware = loadCors('https://balloo.su,http://localhost:5173');
    const app = buildApp(corsMiddleware);

    const res = await request(app)
      .options('/api/ping')
      .set('Origin', 'https://balloo.su')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://balloo.su');
    expect(res.headers['access-control-allow-methods']).toContain('PATCH');
    expect(res.headers['access-control-allow-methods']).toContain('DELETE');
    expect(res.headers['access-control-allow-headers']).toContain('Authorization');
    expect(res.headers['access-control-max-age']).toBe('600');
  });

  it('dev-origin из списка работает, credentials включены, exposedHeaders на месте', async () => {
    const corsMiddleware = loadCors('http://localhost:5173');
    const app = buildApp(corsMiddleware);

    const res = await request(app).get('/api/ping').set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    // exposedHeaders нужны клиенту для чтения лимитов
    expect(res.headers['access-control-expose-headers']).toBe(
      'X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset',
    );
    // X-Request-Id (middleware/requestId.ts) в exposedHeaders не добавлен — браузер его
    // не читает; для клиентской трассировки заголовок нужно добавлять в middleware/cors.ts
    expect(res.headers['access-control-expose-headers']).not.toContain('X-Request-Id');
  });

  it('запрос без Origin (curl/сервер-сервер) проходит без CORS-заголовков', async () => {
    const corsMiddleware = loadCors('https://balloo.su');
    const app = buildApp(corsMiddleware);

    const res = await request(app).get('/api/ping');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  afterAll(() => {
    jest.resetModules();
  });
});
