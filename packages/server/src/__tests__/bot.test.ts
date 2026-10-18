// bot.test.ts — тесты для API ботов

import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Bot API', () => {
  describe('POST /api/bots', () => {
    it('создаёт бота', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/bots')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'TestBot', description: 'Тестовый бот' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('TestBot');
      expect(res.body.description).toBe('Тестовый бот');
    });

    it('отклоняет без name', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/bots')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ description: 'Без имени' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('отклоняет без авторизации', async () => {
      const res = await request(app)
        .post('/api/bots')
        .send({ name: 'TestBot' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/bots', () => {
    it('возвращает список ботов', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/bots')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('отклоняет без авторизации', async () => {
      const res = await request(app).get('/api/bots');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/bots/:id', () => {
    it('удаляет бота владельца', async () => {
      const user = await registerTestUser();

      // Создаём бота
      const createRes = await request(app)
        .post('/api/bots')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'DeleteMe' });

      expect(createRes.status).toBe(201);
      const botId = createRes.body.id;

      // Удаляем
      const delRes = await request(app)
        .delete(`/api/bots/${botId}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body).toHaveProperty('message');
    });

    it('возвращает 404 для несуществующего бота', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .delete('/api/bots/nonexistent')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
