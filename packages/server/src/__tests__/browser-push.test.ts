/**
 * Тикет 1794831100 (A.5): POST /api/devices/browser-push — сохранение подписки.
 *
 * Проверяет:
 *  - 401 без токена
 *  - 400 без endpoint / keys.p256dh / keys.auth
 *  - 201 при валидной подписке + запись в БД
 *  - 201 при повторной подписке (upsert, не дубль)
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app, registerTestUser } from './helpers';

const env = require('../config/env').env;
const dbUrl: string = env.DATABASE_URL;
const pooledUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}connection_limit=2`;

const prisma = new PrismaClient({
  datasources: { db: { url: pooledUrl } },
});

afterAll(async () => {
  await prisma.$disconnect();
});

const ENDPOINT = 'https://push.example.com/subscribe/test-browser-push-token';
const KEYS = { p256dh: 'BP-test-p256dh-key', auth: 'test-auth-secret' };

describe('POST /api/devices/browser-push', () => {
  it('401 без токена', async () => {
    const res = await request(app)
      .post('/api/devices/browser-push')
      .send({ endpoint: ENDPOINT, keys: KEYS })
      .expect(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('400 без endpoint', async () => {
    const user = await registerTestUser();
    await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ keys: KEYS })
      .expect(400);
  });

  it('400 без keys.p256dh', async () => {
    const user = await registerTestUser();
    await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endpoint: ENDPOINT, keys: { auth: KEYS.auth } })
      .expect(400);
  });

  it('400 без keys.auth', async () => {
    const user = await registerTestUser();
    await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endpoint: ENDPOINT, keys: { p256dh: KEYS.p256dh } })
      .expect(400);
  });

  it('201 при валидной подписке + запись в БД', async () => {
    const user = await registerTestUser();
    const res = await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endpoint: ENDPOINT, keys: KEYS })
      .expect(201);

    expect(res.body.message).toMatch(/saved/i);

    const row = await prisma.pushSubscription.findFirst({
      where: { userId: user.id, endpoint: ENDPOINT },
    });
    expect(row).not.toBeNull();
    expect(row!.p256dh).toBe(KEYS.p256dh);
    expect(row!.auth).toBe(KEYS.auth);
  });

  it('201 при повторной подписке того же endpoint (upsert, не дубль)', async () => {
    const user = await registerTestUser();
    // Первая подписка
    await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endpoint: ENDPOINT, keys: KEYS })
      .expect(201);

    // Повторная — те же endpoint, другие keys
    await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endpoint: ENDPOINT, keys: { p256dh: 'BP-updated-key', auth: 'updated-auth' } })
      .expect(201);

    // В БД одна строка с обновлёнными keys
    const rows = await prisma.pushSubscription.findMany({
      where: { userId: user.id, endpoint: ENDPOINT },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].p256dh).toBe('BP-updated-key');
    expect(rows[0].auth).toBe('updated-auth');
  });
});

describe('DELETE /api/devices/browser-push', () => {
  it('401 без токена', async () => {
    await request(app)
      .delete('/api/devices/browser-push')
      .send({ endpoint: ENDPOINT })
      .expect(401);
  });

  it('удаляет подписку по endpoint', async () => {
    const user = await registerTestUser();
    // Создаём подписку
    await request(app)
      .post('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ endpoint: ENDPOINT, keys: KEYS })
      .expect(201);

    // Удаляем
    await request(app)
      .delete('/api/devices/browser-push')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('Content-Type', 'application/json')
      .send({ endpoint: ENDPOINT })
      .expect(200);

    const row = await prisma.pushSubscription.findFirst({
      where: { userId: user.id, endpoint: ENDPOINT },
    });
    expect(row).toBeNull();
  });
});
