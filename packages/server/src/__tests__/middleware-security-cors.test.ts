/**
 * Тесты безопасности middleware (security.ts + cors.ts).
 *
 * До этого файла из security.ts был покрыт только cspConnectSrc: csrfProtection,
 * inputSanitizer, rateLimitLogger, securityLogger и dataExport не исполнялись ни в
 * одном тесте, cors.ts — тоже. Здесь проверяется фактическое поведение:
 *  - csrfProtection пропускает безопасные методы и JWT, а без JWT и без
 *    X-CSRF-Token пишет предупреждение (и всё равно идёт дальше — это fallback);
 *  - inputSanitizer вырезает <script>/<style>/теги/обработчики из body, query и
 *    cookies, рекурсивно, не трогая числа/boolean/null;
 *  - rateLimitLogger перехватывает res.json и логирует только 429;
 *  - securityLogger детектит подозрительные паттерны в path/query/referer;
 *  - cors: при CORS_ORIGIN='*' origin отражается, при списке — только свои,
 *    preflight получает Allow-Methods/Allow-Headers/Max-Age.
 */
import request from 'supertest';
import express from 'express';
import {
  csrfProtection,
  inputSanitizer,
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

describe('inputSanitizer', () => {
  const withBody = (body: Json) =>
    request(makeApp(inputSanitizer)).post('/api/target').send(body);

  it('вырезает <script>, <style>, теги и on*-обработчики из строк body', async () => {
    const res = await withBody({
      title: '<script>alert(1)</script>Привет',
      style: '<style>body{color:red}</style>текст',
      bio: '<b>жирный</b> текст',
      click: 'a onclick=evil()',
    });

    const body = res.body.body as Json;
    expect(body.title).toBe('Привет');
    expect(body.style).toBe('текст');
    expect(body.bio).toBe('жирный текст');
    expect(body.click).toBe('a evil()');
  });

  it('рекурсивен для массивов и вложенных объектов', async () => {
    const res = await withBody({
      tags: ['<i>т1</i>', 'обычный', 7, null, true],
      profile: { name: '<script>x</script>Имя', nested: { deep: '<b>!</b>' } },
    });

    const body = res.body.body as Json;
    expect(body.tags).toEqual(['т1', 'обычный', 7, null, true]);
    expect((body.profile as Json).name).toBe('Имя');
    expect(((body.profile as Json).nested as Json).deep).toBe('!');
  });

  it('чистит query и значения cookies, не трогая не-строки', async () => {
    const app = makeApp(inputSanitizer, (a) => {
      a.use((req, _res, next) => {
        (req as any).cookies = { sid: ' <script>bad()</script>value ', num: 42 };
        next();
      });
    });

    const res = await request(app).get('/api/target?q=<script>bad()</script>&page=2');

    // <script>…</script> вырезается целиком (вместе с содержимым), поэтому q === ''
    expect(res.body.query).toEqual({ q: '', page: '2' });
    expect(res.body.cookies).toEqual({ sid: 'value', num: 42 });
  });

  it('проходит мимо, когда body/query/cookies отсутствуют или не объекты', async () => {
    const app = express();
    app.use(inputSanitizer);
    app.get('/api/target', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/api/target');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
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

  it('CORS_ORIGIN="*" (dev): origin отражается, credentials включены', async () => {
    const { corsMiddleware } = require('../middleware/cors');
    const app = buildApp(corsMiddleware);

    const res = await request(app).get('/api/ping').set('Origin', 'https://anywhere.test');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://anywhere.test');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    // exposedHeaders нужны клиенту для чтения лимитов и X-Request-Id
    expect(res.headers['access-control-expose-headers']).toBe(
      'X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset',
    );
    // X-Request-Id (middleware/requestId.ts) в exposedHeaders не добавлен — браузер его
    // не читает; для клиентской трассировки заголовок нужно добавлять в middleware/cors.ts
    expect(res.headers['access-control-expose-headers']).not.toContain('X-Request-Id');
  });

  it('CORS_ORIGIN-список (тик. №0): разрешает только свои origin' + 'ы поддоменов', async () => {
    const prev = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://balloo.su,https://admin.balloo.su';
    jest.resetModules();
    let corsMiddleware: express.RequestHandler;
    try {
      corsMiddleware = require('../middleware/cors').corsMiddleware;
    } finally {
      process.env.CORS_ORIGIN = prev;
    }

    const app = buildApp(corsMiddleware);

    const allowed = await request(app).get('/api/ping').set('Origin', 'https://admin.balloo.su');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://admin.balloo.su');

    const foreign = await request(app).get('/api/ping').set('Origin', 'https://evil.test');
    expect(foreign.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preflight: Allow-Methods с PATCH, Allow-Headers с Authorization, Max-Age 600', async () => {
    const { corsMiddleware } = require('../middleware/cors');
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

  it('запрос без Origin (curl/сервер-сервер) проходит без CORS-заголовков', async () => {
    const { corsMiddleware } = require('../middleware/cors');
    const app = buildApp(corsMiddleware);

    const res = await request(app).get('/api/ping');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  afterAll(() => {
    jest.resetModules();
  });
});
