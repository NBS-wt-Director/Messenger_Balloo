/**
 * Тикет 1790480787-01 (P38-0): гостя сбрасывало с публичных страниц на #/login.
 *
 * Клиент в services/api.ts обязан различать ответы POST /api/auth/refresh-cookie:
 *   400 — refresh-куки нет вообще, сессии не было (гость) → URL НЕ меняется;
 *   401 — refresh-токен есть, но истёк/невалиден (сессия протухла) → редирект;
 *   сетевая ошибка/5xx — неизвестно → редиректа нет.
 *
 * Проверка идёт через реальный api.getMe() с подменённым global.fetch:
 * мокается только транспорт, ветвление обработки 400/401 — настоящий код api.ts.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '@/services/api';

type StaticReply = { status: number; body?: unknown } | { networkError: true };

type Reply = StaticReply | (() => Reply);

interface Handler {
  /** Сопоставление по оканчивающемуся пути endpoint'а. */
  path: string;
  reply: Reply;
}

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

/** Подменяет fetch: каждый handler отвечает по совпадению пути, reply может быть
 *  функцией (разные ответы на повторных вызовах, например retry после refresh). */
function stubFetch(handlers: Handler[]): string[] {
  const calls: string[] = [];

  const resolveReply = (reply: Reply): StaticReply =>
    typeof reply === 'function' ? resolveReply(reply()) : reply;

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const handler = handlers.find((h) => url.endsWith(h.path));
    if (!handler) return jsonResponse(404, { error: 'Not Found' });

    const reply = resolveReply(handler.reply);
    if ('networkError' in reply) throw new TypeError('Failed to fetch');
    return jsonResponse(reply.status, reply.body ?? {});
  });

  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

describe('api.ts — обработка 401 и ответов /refresh-cookie (тикет 1790480787-01)', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.location.hash = '';
  });

  it('refresh 400 (куки нет, гость): бросает ошибку, hash остаётся прежним', async () => {
    const calls = stubFetch([
      { path: '/api/users/me', reply: { status: 401, body: { error: 'Unauthorized' } } },
      { path: '/api/auth/refresh-cookie', reply: { status: 400, body: { error: 'Bad Request' } } },
    ]);

    await expect(api.getMe()).rejects.toThrow();

    expect(window.location.hash).toBe('');
    // Запрос на refresh всё же уходил — ветка 400 идёт после попытки refresh
    expect(calls.some((u) => u.endsWith('/api/auth/refresh-cookie'))).toBe(true);
  });

  it('refresh 401 (сессия протухла): редирект на #/login', async () => {
    stubFetch([
      { path: '/api/users/me', reply: { status: 401, body: { error: 'Unauthorized' } } },
      { path: '/api/auth/refresh-cookie', reply: { status: 401, body: { error: 'Unauthorized' } } },
    ]);

    await expect(api.getMe()).rejects.toThrow('Session expired. Please login again.');
    expect(window.location.hash).toBe('#/login');
  });

  it('refresh ok: исходный запрос повторяется, hash не меняется', async () => {
    let meAttempts = 0;
    const calls = stubFetch([
      {
        path: '/api/users/me',
        reply: () => {
          meAttempts += 1;
          return meAttempts === 1
            ? { status: 401, body: { error: 'Token expired' } }
            : { status: 200, body: { id: 'u1', username: 'edb' } };
        },
      },
      { path: '/api/auth/refresh-cookie', reply: { status: 200, body: { message: 'Tokens refreshed' } } },
    ]);

    const me = await api.getMe();

    expect(me).toEqual({ id: 'u1', username: 'edb' });
    expect(window.location.hash).toBe('');
    expect(calls.filter((u) => u.endsWith('/api/users/me'))).toHaveLength(2);
  });

  it('refresh упал по сети: на публичной странице не редиректит', async () => {
    stubFetch([
      { path: '/api/users/me', reply: { status: 401, body: { error: 'Unauthorized' } } },
      { path: '/api/auth/refresh-cookie', reply: { networkError: true } },
    ]);

    await expect(api.getMe()).rejects.toThrow();
    expect(window.location.hash).toBe('');
  });

  it('refresh вернул 500: редиректа нет', async () => {
    stubFetch([
      { path: '/api/users/me', reply: { status: 401, body: { error: 'Unauthorized' } } },
      { path: '/api/auth/refresh-cookie', reply: { status: 500, body: { error: 'Internal Error' } } },
    ]);

    await expect(api.getMe()).rejects.toThrow();
    expect(window.location.hash).toBe('');
  });

  it('не-401 ошибка API (403) не трогает hash и не зовёт refresh', async () => {
    const calls = stubFetch([
      { path: '/api/users/me', reply: { status: 403, body: { error: 'Forbidden' } } },
    ]);

    await expect(api.getMe()).rejects.toThrow();
    expect(window.location.hash).toBe('');
    expect(calls.some((u) => u.endsWith('/api/auth/refresh-cookie'))).toBe(false);
  });
});
