/**
 * Unit-тесты middleware/auth.ts (тикеты 1790479490-08 / В-93: критический контур
 * auth+payments+middleware до 100%).
 *
 * Тесты вызывают middleware напрямую с фейковыми req/res/next — без БД и без
 * HTTP-сервера, чтобы закрыть все ветки, а не только те, до которых доходят
 * интеграционные тесты роутов.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  authRequired,
  authRefresh,
  adminOnly,
  setAuthCookies,
  clearAuthCookies,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from '../middleware/auth';

type FakeReq = {
  cookies?: Record<string, string>;
  headers: Record<string, string>;
  user?: { id: string; email: string; username?: string; role?: string };
};

type FakeRes = {
  statusCode: number;
  body: any;
  cookies: { name: string; value: string; opts: any }[];
  cleared: { name: string; opts: any }[];
  status(code: number): FakeRes;
  json(payload: any): FakeRes;
  cookie(name: string, value: string, opts: any): FakeRes;
  clearCookie(name: string, opts: any): FakeRes;
};

function makeRes(): FakeRes {
  const res: any = {
    statusCode: 0,
    body: null,
    cookies: [],
    cleared: [],
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    return res;
  };
  res.cookie = (name: string, value: string, opts: any) => {
    res.cookies.push({ name, value, opts });
    return res;
  };
  res.clearCookie = (name: string, opts: any) => {
    res.cleared.push({ name, opts });
    return res;
  };
  return res as FakeRes;
}

function makeReq(opts?: { cookie?: Record<string, string>; header?: Record<string, string> }): FakeReq {
  return { cookies: opts?.cookie ?? {}, headers: opts?.header ?? {} };
}

const accessToken = (payload?: Partial<{ userId: string; email: string; username: string; role: string }>) =>
  jwt.sign(
    { userId: 'user-1', email: 'u@test.balloo.ru', username: 'user1', role: 'user', type: 'access', ...payload },
    env.JWT_ACCESS_SECRET,
    { expiresIn: 60 },
  );

const refreshToken = () =>
  jwt.sign(
    { userId: 'user-1', email: 'u@test.balloo.ru', username: 'user1', role: 'user', type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: 60 },
  );

const expiredAccessToken = () =>
  jwt.sign(
    { userId: 'user-1', email: 'u@test.balloo.ru', username: 'user1', role: 'user', type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '-10s' },
  );

describe('middleware/auth.ts — extractToken + authRequired', () => {
  it('401 без токена: ни cookie, ни Authorization (строки 55-61)', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    authRequired(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized', message: 'Токен авторизации не предоставлен' });
  });

  it('берёт токен из httpOnly cookie и приоритетно, а не из заголовка (строки 33-36)', async () => {
    const req = makeReq({
      cookie: { [ACCESS_COOKIE]: accessToken() },
      header: { authorization: 'Bearer мусор-в-заголовке' },
    });
    const res = makeRes();
    const next = jest.fn();

    // authRequired стал async: перед next() он ждёт проверку отзыва сессии
    await authRequired(req as any, res as any, next as any);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(0);
    expect(req.user).toEqual({ id: 'user-1', email: 'u@test.balloo.ru', username: 'user1', role: 'user' });
  });

  it('fallback на Authorization: Bearer для API/мобильных (строки 39-42)', async () => {
    const req = makeReq({ header: { authorization: `Bearer ${accessToken()}` } });
    const next = jest.fn();

    await authRequired(req as any, makeRes() as any, next as any);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user?.id).toBe('user-1');
  });

  it('401 на токене неверного типа, присланном в authRequired (строки 66-72)', () => {
    // Тот же secret, но type=refresh — иначе verify упал бы раньше проверки типа
    const wrongType = jwt.sign(
      { userId: 'user-1', email: 'u@test.balloo.ru', type: 'refresh' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: 60 },
    );
    const req = makeReq({ header: { authorization: `Bearer ${wrongType}` } });
    const res = makeRes();
    const next = jest.fn();

    authRequired(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized', message: 'Недействительный тип токена' });
  });

  it('401 Token expired на истёкшем access (строки 83-89)', () => {
    const req = makeReq({ cookie: { [ACCESS_COOKIE]: expiredAccessToken() } });
    const res = makeRes();
    const next = jest.fn();

    authRequired(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Token expired', message: 'Токен истёк. Обновите access token' });
  });

  it('401 Invalid token на подписанном другим секретом (строки 91-94)', () => {
    const forged = jwt.sign({ userId: 'x', type: 'access' }, 'another-secret-another-secret-1234567890', { expiresIn: 60 });
    const req = makeReq({ cookie: { [ACCESS_COOKIE]: forged } });
    const res = makeRes();
    const next = jest.fn();

    authRequired(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid token', message: 'Недействительный токен авторизации' });
  });

  it('не падает, если у запроса нет cookies (req.cookies === undefined)', () => {
    const req: any = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    authRequired(req, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

describe('middleware/auth.ts — authRefresh', () => {
  it('401 без refresh-токена (строки 106-112)', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    authRefresh(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized', message: 'Refresh токен не предоставлен' });
  });

  it('принимает валидный refresh из cookie и из header (строки 115-132)', async () => {
    const fromCookie = makeReq({ cookie: { [REFRESH_COOKIE]: refreshToken() } });
    const fromHeader = makeReq({ header: { authorization: `Bearer ${refreshToken()}` } });
    const nextCookie = jest.fn();
    const nextHeader = jest.fn();

    await authRefresh(fromCookie as any, makeRes() as any, nextCookie as any);
    await authRefresh(fromHeader as any, makeRes() as any, nextHeader as any);

    expect(nextCookie).toHaveBeenCalledTimes(1);
    expect(nextHeader).toHaveBeenCalledTimes(1);
    expect(fromCookie.user?.id).toBe('user-1');
    expect(fromHeader.user?.email).toBe('u@test.balloo.ru');
  });

  it('401 на токене неверного типа в authRefresh (строки 117-123)', () => {
    // Тот же refresh-secret, но type=access — иначе проверка подписи упала бы раньше
    const wrongType = jwt.sign(
      { userId: 'user-1', email: 'u@test.balloo.ru', type: 'access' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: 60 },
    );
    const req = makeReq({ cookie: { [REFRESH_COOKIE]: wrongType } });
    const res = makeRes();
    const next = jest.fn();

    authRefresh(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized', message: 'Недействительный тип токена' });
  });

  it('401 Invalid refresh token на мусоре (строки 134-137)', () => {
    const req = makeReq({ cookie: { [REFRESH_COOKIE]: 'не-jwt-вовсе' } });
    const res = makeRes();
    const next = jest.fn();

    authRefresh(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid refresh token', message: 'Недействительный refresh токен' });
  });

  it('истёкший refresh попадает в общую ветку Invalid refresh token', () => {
    const expired = jwt.sign(
      { userId: 'user-1', email: 'u@test.balloo.ru', type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '-10s' },
    );
    const req = makeReq({ cookie: { [REFRESH_COOKIE]: expired } });
    const res = makeRes();

    authRefresh(req as any, res as any, jest.fn() as any);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid refresh token');
  });
});

describe('middleware/auth.ts — adminOnly', () => {
  it('401 если req.user отсутствует (строки 147-153)', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    adminOnly(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized', message: 'Требуется авторизация' });
  });

  it('403 если роль не admin (строки 155-161)', () => {
    const req = makeReq();
    req.user = { id: 'user-1', email: 'u@test.balloo.ru', role: 'user' };
    const res = makeRes();
    const next = jest.fn();

    adminOnly(req as any, res as any, next as any);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('пропускает администратора (строка 163)', () => {
    const req = makeReq();
    req.user = { id: 'admin-1', email: 'a@test.balloo.ru', role: 'admin' };
    const next = jest.fn();

    adminOnly(req as any, makeRes() as any, next as any);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('middleware/auth.ts — cookie-утилиты', () => {
  it('setAuthCookies ставит оба httpOnly-cookie с нужными флагами (dev: secure=false)', () => {
    const res = makeRes();

    setAuthCookies(res as any, 'access-value', 'refresh-value');

    expect(res.cookies).toHaveLength(2);
    const [access, refresh] = res.cookies;
    expect(access).toEqual({
      name: ACCESS_COOKIE,
      value: 'access-value',
      opts: { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 15 * 60 * 1000, path: '/' },
    });
    expect(refresh).toEqual({
      name: REFRESH_COOKIE,
      value: 'refresh-value',
      opts: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' },
    });
  });

  it('clearAuthCookies снимает оба cookie (строки 202-215)', () => {
    const res = makeRes();

    clearAuthCookies(res as any);

    expect(res.cleared.map((c) => c.name)).toEqual([ACCESS_COOKIE, REFRESH_COOKIE]);
    expect(res.cleared[0].opts.sameSite).toBe('strict');
    expect(res.cleared[1].opts.sameSite).toBe('lax');
  });
});

describe('middleware/auth.ts — флаги cookie в production', () => {
  // isProduction вычисляется при загрузке модуля, поэтому нужен свежий require
  // с NODE_ENV=production.
  it('при NODE_ENV=production оба cookie получают secure=true', () => {
    const previous = process.env.NODE_ENV;
    jest.resetModules();
    process.env.NODE_ENV = 'production';

    try {
      const prodAuth = require('../middleware/auth');
      const res = makeRes();

      prodAuth.setAuthCookies(res, 'a', 'r');
      prodAuth.clearAuthCookies(res);

      expect(res.cookies).toHaveLength(2);
      expect(res.cookies.every((c: any) => c.opts.secure === true)).toBe(true);
      expect(res.cleared.every((c: any) => c.opts.secure === true)).toBe(true);
    } finally {
      process.env.NODE_ENV = previous;
      jest.resetModules();
    }
  });
});
