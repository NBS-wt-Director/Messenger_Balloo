import { app, registerTestUser } from './helpers';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let userA: { id: string; accessToken: string };
let userB: { id: string; accessToken: string };
let channel: { id: string };

beforeEach(async () => {
  // Очистка данных
  await prisma.blogChannelSubscriber.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.blogChannel.deleteMany();
  await prisma.blogPost.deleteMany();

  // Создаём канал
  channel = await prisma.blogChannel.create({
    data: {
      id: 'ch_test_b5',
      name: 'Test Channel',
      description: 'Test',
      createdAt: Date.now(),
    },
  });

  // Создаём пользователей
  userA = await registerTestUser();
  userB = await registerTestUser();

  // Создаём пост канала (чтобы был автор для каскада)
  await prisma.blogPost.create({
    data: {
      id: 'post_test_b5',
      authorId: userA.id,
      channelId: channel.id,
      title: 'Test Post',
      content: 'Test',
      createdAt: Date.now(),
    },
  });
});

afterEach(async () => {
  await prisma.blogChannelSubscriber.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogChannel.deleteMany();
});

describe('B5: Channel subscription', () => {
  describe('POST /api/channels/:id/subscribe', () => {
    it('subscribes successfully', async () => {
      const res = await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.subscription).toBeTruthy();
      expect(res.body.subscription.channelId).toBe(channel.id);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post(`/api/channels/${channel.id}/subscribe`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent channel', async () => {
      const res = await request(app)
        .post('/api/channels/nonexistent/subscribe')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 409 if already subscribed', async () => {
      await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const res = await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('already_subscribed');
    });

    it('increments followers count', async () => {
      const channelBefore = await prisma.blogChannel.findUnique({
        where: { id: channel.id },
      });

      await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const channelAfter = await prisma.blogChannel.findUnique({
        where: { id: channel.id },
      });

      expect(channelAfter!.followers).toBe((channelBefore!.followers || 0) + 1);
    });
  });

  describe('POST /api/channels/:id/unsubscribe', () => {
    it('unsubscribes successfully', async () => {
      // Сначала подписываемся
      await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const res = await request(app)
        .post(`/api/channels/${channel.id}/unsubscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 if not subscribed', async () => {
      const res = await request(app)
        .post(`/api/channels/${channel.id}/unsubscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_subscribed');
    });

    it('decrements followers count', async () => {
      await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const channelBefore = await prisma.blogChannel.findUnique({
        where: { id: channel.id },
      });

      await request(app)
        .post(`/api/channels/${channel.id}/unsubscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const channelAfter = await prisma.blogChannel.findUnique({
        where: { id: channel.id },
      });

      expect(channelAfter!.followers).toBe((channelBefore!.followers || 0) - 1);
    });
  });

  describe('B5: follow = aliased subscribe', () => {
    it('POST /api/blog/channels/:id/follow works like subscribe', async () => {
      const res = await request(app)
        .post(`/api/blog/channels/${channel.id}/follow`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.subscription).toBeTruthy();
    });

    it('DELETE /api/blog/channels/:id/follow works like unsubscribe', async () => {
      await request(app)
        .post(`/api/blog/channels/${channel.id}/follow`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const res = await request(app)
        .delete(`/api/blog/channels/${channel.id}/follow`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('B5: DELETE /api/blocked/channels/:id — cascade', () => {
    it('unsubscribes all + blocks channel author', async () => {
      // Подписываем userA на канал
      await request(app)
        .post(`/api/channels/${channel.id}/subscribe`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      // userB блокирует канал
      const res = await request(app)
        .delete(`/api/blocked/channels/${channel.id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unsubscribed).toBe(true);
      expect(res.body.channelBlocked).toBe(true);
      expect(res.body.authorBlocked).toBe(true);

      // Проверка: подписка userA удалена
      const subs = await prisma.blogChannelSubscriber.findMany();
      expect(subs.length).toBe(0);

      // Проверка: userB заблокировал создателя канала
      const blocked = await prisma.blockedUser.findFirst({
        where: {
          blockerId: userB.id,
        },
      });
      expect(blocked).toBeTruthy();
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .delete(`/api/blocked/channels/${channel.id}`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent channel', async () => {
      const res = await request(app)
        .delete('/api/blocked/channels/nonexistent')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/channels/:id — alias on blog getChannel', () => {
    it('returns channel by id', async () => {
      const res = await request(app)
        .get(`/api/channels/${channel.id}`);

      expect(res.status).toBe(200);
      expect(res.body.channel).toBeTruthy();
      expect(res.body.channel.id).toBe(channel.id);
      expect(res.body.channel.name).toBe('Test Channel');
    });

    it('returns 404 for non-existent channel', async () => {
      const res = await request(app)
        .get('/api/channels/nonexistent');

      expect(res.status).toBe(404);
    });
  });
});
