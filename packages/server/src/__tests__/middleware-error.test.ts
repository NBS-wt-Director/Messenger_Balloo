/**
 * Unit-тесты middleware/errorHandler.ts (тикеты 1790479490-08 / В-93, критический
 * контур до 100%). Обработчик вызываетcя напрямую — без БД и HTTP-сервера.
 */
import { errorHandler, notFoundHandler, asyncHandler } from '../middleware/errorHandler';

type FakeRes = {
  statusCode: number;
  body: any;
  status(code: number): FakeRes;
  json(payload: any): FakeRes;
};

function makeRes(): FakeRes {
  const res: any = { statusCode: 0, body: null };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    return res;
  };
  return res as FakeRes;
}

function makeReq(method = 'GET', path = '/api/нет-такого'): any {
  return { method, path };
}

const withNodeEnv = (value: string, fn: () => void) => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = value;
  try {
    fn();
  } finally {
    process.env.NODE_ENV = previous;
  }
};

describe('errorHandler — ответ и логирование', () => {
  it('берёт statusCode из ошибки (не-500) и name из Error', () => {
    withNodeEnv('test', () => {
      const err = new Error('Пользователь не найден') as Error & { statusCode?: number };
      err.statusCode = 404;
      const res = makeRes();

      errorHandler(err, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'Error', message: 'Пользователь не найден' });
    });
  });

  it('подставляет 500, если statusCode не задан', () => {
    withNodeEnv('test', () => {
      const res = makeRes();

      errorHandler(new Error('упало'), makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('упало');
    });
  });

  it('подставляет текст по умолчанию, если message пустой', () => {
    withNodeEnv('test', () => {
      const err = new Error('');
      const res = makeRes();

      errorHandler(err, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.body.message).toBe('Внутренняя ошибка сервера');
    });
  });

  it('в development логирует stack и кладёт его в тело ответа', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    withNodeEnv('development', () => {
      const err = new Error('dev-ошибка');
      const res = makeRes();

      errorHandler(err, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(500);
      expect(typeof res.body.stack).toBe('string');
      expect(String(res.body.stack)).toContain('dev-ошибка');
    });
    // одна строка «[ERROR] …» + stack отдельным вызовом
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('вне development логирует одной строкой и не отдаёт stack', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    withNodeEnv('production', () => {
      const res = makeRes();

      errorHandler(new Error('prod-ошибка'), makeReq() as any, res as any, (() => undefined) as any);

      expect(res.body).toEqual({ error: 'Error', message: 'prod-ошибка' });
      expect(res.body).not.toHaveProperty('stack');
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('[ERROR] 500 - prod-ошибка');
    spy.mockRestore();
  });

  it('не-операционная 5xx: клиенту общий текст, полный message — только в лог (тик. errorHandler)', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    withNodeEnv('production', () => {
      const res = makeRes();
      const err: any = new Error('P2021: table "public.users_secret" does not exist');
      err.isOperational = false;

      errorHandler(err, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Внутренняя ошибка сервера');
    });
    // в лог ушло исходное сообщение с внутренностями
    expect(spy.mock.calls[0][0]).toContain('users_secret');
    spy.mockRestore();
  });

  it('не-операционная 4xx: сообщение клиенту остаётся (валидационные тексты)', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    withNodeEnv('production', () => {
      const res = makeRes();
      const err: any = new Error('Поле обязательно');
      err.statusCode = 400;
      err.isOperational = false;

      errorHandler(err, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Поле обязательно');
    });
    spy.mockRestore();
  });

  it('сериализует BigInt, не падая (BigInt-поля из Prisma) — регрессия 30.09', () => {
    withNodeEnv('test', () => {
      const err = new Error('bad id') as Error & { statusCode?: number };
      // message намеренно bigint: до правки 30.09 replacer был у JSON.parse, и
      // обработчик падал с TypeError вместо ответа клиенту
      (err as any).message = 12345678901234567890n;
      const res = makeRes();

      errorHandler(err, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('12345678901234567890');
    });
  });

  it('подставляет имя ошибки «Error», если у объекта нет name', () => {
    withNodeEnv('test', () => {
      const res = makeRes();
      const errLike = { message: 'без имени', statusCode: 400 } as any;

      errorHandler(errLike, makeReq() as any, res as any, (() => undefined) as any);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: 'Error', message: 'без имени' });
    });
  });
});

describe('notFoundHandler', () => {
  it('404 с методом и путём в сообщении', () => {
    const res = makeRes();

    notFoundHandler(makeReq('POST', '/api/чего-нет') as any, res as any, (() => undefined) as any);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found', message: 'Маршрут POST /api/чего-нет не найден' });
  });
});

describe('asyncHandler', () => {
  it('не трогает next, если промис разрешился', async () => {
    const next = jest.fn();
    const handler = asyncHandler(async (_req, res) => {
      (res as any).done = true;
    });

    handler({} as any, { done: false } as any, next as any);
    await Promise.resolve();

    expect(next).not.toHaveBeenCalled();
  });

  it('передаёт ошибку в next, если промис отклонился', async () => {
    const next = jest.fn();
    const boom = new Error('асинхронно упало');
    const handler = asyncHandler(async () => {
      throw boom;
    });

    handler({} as any, {} as any, next as any);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(boom);
  });

  it('пробрасывает синхронный возврат без промиса', async () => {
    const next = jest.fn();
    // Promise.resolve(notAPromise) — ветка «контроллер вернул не промис»
    const handler = asyncHandler((async (_req, _res, _next) => undefined) as any);

    handler({} as any, {} as any, next as any);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).not.toHaveBeenCalled();
  });
});
