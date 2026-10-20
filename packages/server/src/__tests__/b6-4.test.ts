import { app, registerTestUser } from './helpers';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TS = Date.now();

let userA: { id: string; accessToken: string };
let userB: { id: string; accessToken: string };
let chat: { id: string };

beforeAll(async () => {
  userA = await registerTestUser({ username: `user_a_${TS}` });
  userB = await registerTestUser({ username: `user_b_${TS}` });

  chat = await prisma.chat.create({
    data: {
      id: `chat_b6_${TS}`,
      name: 'B6 Test Chat',
      createdAt: Date.now(),
    },
  });

  // userA — участник
  await prisma.userChat.create({
    data: { userId: userA.id, chatId: chat.id, joinedAt: Date.now() },
  });

  // Push-подписка
  await prisma.pushSubscription.create({
    data: {
      id: `push_b6_${TS}`,
      userId: userA.id,
      endpoint: 'https://push.example.com/test',
      p256dh: 'test-p256dh',
      auth: 'test-auth',
      createdAt: Date.now(),
    },
  });

  // AccountDeviceLink (для notifications)
  await prisma.accountDeviceLink.create({
    data: {
      userId: userA.id,
      deviceId: `device_b6_${TS}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });
});

afterAll(async () => {
  await prisma.accountDeviceLink.deleteMany({ where: { deviceId: `device_b6_${TS}` } });
  await prisma.pushSubscription.deleteMany({ where: { userId: userA.id } });
  await prisma.userChat.deleteMany({ where: { chatId: chat.id } });
  await prisma.chat.deleteMany({ where: { id: chat.id } });
});

describe('B6-4: subscriptions / invites / notifications', () => {
  describe('GET /api/users/me/subscriptions', () => {
    it('returns push subscriptions', async () => {
      const res = await request(app)
        .get('/api/users/me/subscriptions')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.subscriptions).toBeTruthy();
      expect(res.body.subscriptions.length).toBeGreaterThan(0);
    });

    it('does not expose auth secret', async () => {
      const res = await request(app)
        .get('/api/users/me/subscriptions')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      for (const sub of res.body.subscriptions) {
        expect(sub.auth).toBeUndefined();
        expect(sub.endpoint).toBeTruthy();
        expect(sub.p256dh).toBeTruthy();
      }
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/users/me/subscriptions');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/invites', () => {
    it('creates invite for participant', async () => {
      const res = await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ chatId: chat.id });

      expect(res.status).toBe(201);
      expect(res.body.inviteLink).toBeTruthy();
      expect(res.body.inviteLink.chatId).toBe(chat.id);
    });

    it('returns 403 for non-participant', async () => {
      const res = await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .send({ chatId: chat.id });

      expect(res.status).toBe(403);
    });

    it('returns 400 without chatId', async () => {
      const res = await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/invites').send({ chatId: chat.id });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me/notifications', () => {
    it('returns 400 without enabled', async () => {
      const res = await request(app)
        .put('/api/users/me/notifications')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put('/api/users/me/notifications')
        .send({ enabled: true });

      expect(res.status).toBe(401);
    });

    it('accepts enabled=true', async () => {
      const res = await request(app)
        .put('/api/users/me/notifications')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('X-Device-Id', `device_b6_${TS}`)
        .send({ enabled: true });

      expect(res.status).toBe(200);
    });
  });
});
