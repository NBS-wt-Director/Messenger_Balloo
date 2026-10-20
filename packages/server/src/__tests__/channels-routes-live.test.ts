/**
 * Прямая проверка (не через dump-скрипт): реально ли Express отдаёт
 * маршруты channelRouter / followRouter / blockedChannelRouter.
 * Тикет 1792335000 — сверка аудита с живым приложением.
 */
import request from 'supertest';
import { app } from './helpers';

describe('GET /api/channels/:id (живой роут, не дамп)', () => {
  it('несуществующий канал → 404 (не 404-роут-не-найден)', async () => {
    const res = await request(app).get('/api/channels/no-such-channel-id');
    // 404 с телом channel_not_found = роут существует и отработал
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('channel_not_found');
  });
});

describe('GET /api/channels (список)', () => {
  it('отвечает JSON с полем channels', async () => {
    const res = await request(app).get('/api/channels');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.channels)).toBe(true);
  });
});

describe('DELETE /api/blocked/channels/:id — маршрут существует', () => {
  it('без авторизации → 401 (значит маршрут смонтирован)', async () => {
    const res = await request(app).delete('/api/blocked/channels/abc');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/blog/channels/:id/follow — маршрут существует', () => {
  it('без авторизации → 401', async () => {
    const res = await request(app).post('/api/blog/channels/abc/follow');
    expect(res.status).toBe(401);
  });
});
