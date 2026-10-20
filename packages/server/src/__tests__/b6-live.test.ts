/**
 * Проверка живых маршрутов B6 (не через dump-скрипт, который слеп к части
 * mount'ов). Тикет 1792335000.
 */
import request from 'supertest';
import { app } from './helpers';

describe('GET /api/users/me/subscriptions', () => {
  it('без авторизации → 401 (маршрут смонтирован)', async () => {
    const res = await request(app).get('/api/users/me/subscriptions');
    expect(res.status).toBe(401);
  });

  it('/api/me/subscriptions (без /users) отсутствует — клиент обязан использовать /users/…', async () => {
    const res = await request(app).get('/api/me/subscriptions');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/me/notifications', () => {
  it('без авторизации → 401', async () => {
    const res = await request(app).put('/api/users/me/notifications').send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/invites', () => {
  it('без авторизации → 401', async () => {
    const res = await request(app).post('/api/invites').send({});
    expect(res.status).toBe(401);
  });
});
