// contactGroup.test.ts — тесты API групп контактов
// Тикет 1794850879

import request from 'supertest';
import { app, registerTestUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Contact Groups API', () => {
  let userA: { id: string; email: string; accessToken: string };
  let userB: { id: string; email: string; accessToken: string };
  let groupId: string;

  beforeAll(async () => {
    userA = await registerTestUser();
    userB = await registerTestUser();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/users/contact-groups', () => {
    it('создаёт группу с названием', async () => {
      const res = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'Коллеги' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Коллеги');
      expect(res.body.emoji).toBe('👥');
      expect(res.body.memberCount).toBe(0);
      groupId = res.body.id;
    });

    it('создаёт группу с эмодзи и описанием', async () => {
      const res = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          name: 'Семья',
          emoji: '❤️',
          description: 'Близкие родственники',
        });

      expect(res.status).toBe(201);
      expect(res.body.emoji).toBe('❤️');
      expect(res.body.description).toBe('Близкие родственники');
    });

    it('создаёт группу с участниками', async () => {
      const res = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          name: 'Тестовая',
          memberIds: [userB.id],
        });

      expect(res.status).toBe(201);
      expect(res.body.memberCount).toBe(1);
      expect(res.body.previewMemberIds).toContain(userB.id);
    });

    it('отклоняет без названия', async () => {
      const res = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ description: 'Без имени' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('отклоняет пустое название', async () => {
      const res = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: '  ' });

      expect(res.status).toBe(400);
    });

    it('отклоняет без авторизации', async () => {
      const res = await request(app)
        .post('/api/users/contact-groups')
        .send({ name: 'Хакерская' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/contact-groups', () => {
    it('возвращает список групп владельца', async () => {
      const res = await request(app)
        .get('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('возвращает пустой список для другого пользователя', async () => {
      const res = await request(app)
        .get('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('отклоняет без авторизации', async () => {
      const res = await request(app).get('/api/users/contact-groups');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/contact-groups/:id', () => {
    it('обновляет группу', async () => {
      // Создаём группу для обновления
      const createRes = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'До обновления' });

      const patchRes = await request(app)
        .patch(`/api/users/contact-groups/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'После обновления', emoji: '🔥' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.name).toBe('После обновления');
      expect(patchRes.body.emoji).toBe('🔥');
    });
  });

  describe('POST /api/users/contact-groups/:id/members', () => {
    it('добавляет участника', async () => {
      const createRes = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'Для теста' });

      const addRes = await request(app)
        .post(`/api/users/contact-groups/${createRes.body.id}/members`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ memberId: userB.id });

      expect(addRes.status).toBe(200);
      expect(addRes.body).toHaveProperty('message');

      // Проверяем что участник добавился
      const listRes = await request(app)
        .get('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const group = listRes.body.find((g: { id: string }) => g.id === createRes.body.id);
      expect(group).toBeDefined();
      expect(group.memberCount).toBe(1);
    });
  });

  describe('DELETE /api/users/contact-groups/:id/members/:memberId', () => {
    it('удаляет участника', async () => {
      const createRes = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'Удалить участника', memberIds: [userB.id] });

      // Удаляем
      const delRes = await request(app)
        .delete(`/api/users/contact-groups/${createRes.body.id}/members/${userB.id}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(delRes.status).toBe(200);

      // Проверяем что участник удалён
      const listRes = await request(app)
        .get('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const group = listRes.body.find((g: { id: string }) => g.id === createRes.body.id);
      expect(group).toBeDefined();
      expect(group.memberCount).toBe(0);
    });
  });

  describe('DELETE /api/users/contact-groups/:id', () => {
    it('удаляет группу', async () => {
      const createRes = await request(app)
        .post('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ name: 'Удалить группу' });

      const groupIdToDelete = createRes.body.id;

      const delRes = await request(app)
        .delete(`/api/users/contact-groups/${groupIdToDelete}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body).toHaveProperty('message');

      // Проверяем что группа удалена
      const listRes = await request(app)
        .get('/api/users/contact-groups')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const found = listRes.body.find((g: { id: string }) => g.id === groupIdToDelete);
      expect(found).toBeUndefined();
    });
  });
});
