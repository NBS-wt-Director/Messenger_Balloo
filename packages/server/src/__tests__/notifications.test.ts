// Уведомления: REST-список/прочтение + запись (тикет 1795677854 —
// источник морзе-тикера подвала и колокольчика).

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app, registerTestUser } from './helpers';
import { notifyUser } from '../services/notificationService';

const prisma = new PrismaClient();

describe('Notifications API', () => {
  let user: { id: string; accessToken: string };

  beforeAll(async () => {
    user = await registerTestUser();
  });

  describe('GET /api/notifications', () => {
    it('требует авторизации', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('возвращает items и unread', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(typeof res.body.unread).toBe('number');
    });

    it('отдаёт только уведомления текущего пользователя', async () => {
      const other = await registerTestUser();
      await notifyUser({
        userId: other.id,
        kind: 'chat',
        source: 'Другой чат',
        body: 'Чужое уведомление',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      const previews = res.body.items.map((i: any) => i.preview);
      expect(previews).not.toContain('Чужое уведомление');
    });
  });

  describe('POST /api/notifications/:id/read', () => {
    it('помечает своё уведомление прочитанным', async () => {
      const row = await notifyUser({
        userId: user.id,
        kind: 'chat',
        source: 'Чат',
        body: 'Непрочитанное',
      });

      const res = await request(app)
        .post(`/api/notifications/${row.id}/read`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const fresh = await prisma.notification.findUnique({ where: { id: row.id } });
      expect(fresh?.isRead).toBe(true);
    });

    it('404 на чужое уведомление', async () => {
      const other = await registerTestUser();
      const row = await notifyUser({
        userId: other.id,
        kind: 'chat',
        source: 'Чат',
        body: 'Чужое',
      });

      const res = await request(app)
        .post(`/api/notifications/${row.id}/read`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });

    it('404 на несуществующее уведомление', async () => {
      const res = await request(app)
        .post('/api/notifications/nonexistent-id/read')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('notifyUser — запись', () => {
    it('пишет уведомление с типом, превью и payload', async () => {
      const row = await notifyUser({
        userId: user.id,
        kind: 'invite',
        source: 'Приглашение',
        body: 'Приглашаем в группу',
        payload: { chatId: 'chat-1' },
      });

      expect(row.type).toBe('invite');
      expect(row.preview).toBe('Приглашаем в группу');
      expect(row.isRead).toBe(false);
      expect((row.payload as any).chatId).toBe('chat-1');
    });

    it('обрезает превью до 200 символов', async () => {
      const long = 'а'.repeat(500);
      const row = await notifyUser({ userId: user.id, kind: 'chat', source: 'Чат', body: long });
      expect(row.preview.length).toBe(200);
    });
  });
});
