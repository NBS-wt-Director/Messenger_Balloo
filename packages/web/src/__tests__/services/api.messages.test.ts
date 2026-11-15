/**
 * Контракт api.getMessages — тикет 1793791062 (регрессия, найденная приёмкой
 * «два окна» 15.11.2026).
 *
 * Сервер отвечает СТРАНИЦЕЙ, а не массивом. Замер живым запросом:
 *   GET /api/chats/:id/messages → 200 {"messages":[],"pagination":{"hasMore":false,…}}
 *
 * ChatViewScreen делает messagesData.map(...) — на объекте это TypeError,
 * он попадал в catch и экран выбрасывало обратно на /chat. Практически:
 * чат нельзя было открыть, поэтому и realtime-доставку проверить было нечем.
 *
 * Нормализация формы ответа живёт в api.getMessages (единственное место,
 * где известна форма HTTP-ответа), поэтому проверяем её здесь, подменяя
 * только транспорт.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { api } from '@/services/api';

/** Подменяет fetch одним ответом на указанный путь. */
function stubOne(path: string, status: number, body: unknown): string[] {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
      } as Response;
    })
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api.getMessages — форма ответа сервера (тик. 1793791062)', () => {
  it('страницу {messages, pagination} превращает в массив сообщений', async () => {
    stubOne('/api/chats/c1/messages', 200, {
      messages: [
        { id: 'm1', chatId: 'c1', content: 'раз', senderId: 'u1', sender: { username: 'bob' } },
        { id: 'm2', chatId: 'c1', content: 'два', senderId: 'u2', sender: { username: 'alice' } },
      ],
      pagination: { hasMore: false, nextCursor: null, prevCursor: null, limit: 50 },
    });

    const messages = await api.getMessages('c1');

    // Ключевое: у результата есть .map — на нём держится ChatViewScreen.
    expect(Array.isArray(messages)).toBe(true);
    expect(messages).toHaveLength(2);
    expect(messages.map((m: any) => m.id)).toEqual(['m1', 'm2']);
  });

  it('пустая страница даёт пустой массив, а не объект', async () => {
    stubOne('/api/chats/c1/messages', 200, {
      messages: [],
      pagination: { hasMore: false, nextCursor: null, prevCursor: null, limit: 50 },
    });

    const messages = await api.getMessages('c1');

    expect(messages).toEqual([]);
  });

  it('голый массив (старая форма) остаётся голым массивом', async () => {
    stubOne('/api/chats/c1/messages', 200, [{ id: 'm1', content: 'раз' }]);

    const messages = await api.getMessages('c1');

    expect(messages).toEqual([{ id: 'm1', content: 'раз' }]);
  });

  it('ответ без поля messages не роняет клиента (даёт [])', async () => {
    stubOne('/api/chats/c1/messages', 200, { pagination: { hasMore: false } });

    await expect(api.getMessages('c1')).resolves.toEqual([]);
  });
});
