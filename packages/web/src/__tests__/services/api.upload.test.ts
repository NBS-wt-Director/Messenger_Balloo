/**
 * Тикет 1795381463: FormData-запросы (загрузка файла/аватара/истории) уходили
 * с заголовком `Content-Type: application/json` — сервер (express.json до
 * multer) пытался распарсить multipart-тело как JSON и отдавал 400.
 *
 * Проверка идёт через реальный api.uploadFile с подменённым global.fetch:
 * мокается только транспорт, сборка заголовков — настоящий код api.ts.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { api } from '@/services/api';

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe('api.ts — Content-Type для FormData (тикет 1795381463)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploadFile: тело — FormData, Content-Type НЕ application/json', async () => {
    let seenInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      seenInit = init;
      return jsonResponse(200, { success: true, data: { url: 'https://cdn/x.png' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['hello'], 'x.png', { type: 'image/png' });
    await api.uploadFile(file, 'chat-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(seenInit?.body).toBeInstanceOf(FormData);

    const headers = (seenInit?.headers ?? {}) as Record<string, string>;
    // Ключевое: браузер сам ставит multipart/form-data + boundary.
    expect(headers['Content-Type']).toBeUndefined();
    expect((seenInit?.body as FormData).get('chatId')).toBe('chat-1');
    expect((seenInit?.body as FormData).get('file')).toBe(file);
  });

  it('uploadAvatar: тоже без application/json', async () => {
    let seenInit: RequestInit | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenInit = init;
        return jsonResponse(200, { success: true, data: { url: 'https://cdn/a.png' } });
      })
    );

    await api.uploadAvatar(new File(['a'], 'a.png', { type: 'image/png' }));

    const headers = (seenInit?.headers ?? {}) as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('обычный JSON-запрос по-прежнему уходит с application/json', async () => {
    let seenInit: RequestInit | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenInit = init;
        return jsonResponse(200, { ok: true });
      })
    );

    await api.post('/api/chats', { type: 'direct' });

    const headers = (seenInit?.headers ?? {}) as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(seenInit?.body).toBe(JSON.stringify({ type: 'direct' }));
  });
});
