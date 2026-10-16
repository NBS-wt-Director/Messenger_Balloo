// Мультиаккаунт: API подключённых аккаунтов устройства
// Тикет 1792124252 (приёмка макета 1.1.9 → 6.33);
// сущность account_device_links (миграция 20261016000000).
import request from 'supertest';
import { app } from './helpers';

// deviceId ограничен контроллером форматом ^[A-Za-z0-9_-]{8,64}$
const DEVICE = `testdev${Date.now()}_${process.pid}`;

interface AccountUser {
  id: string;
  email: string;
  accessToken: string;
}

// Регистрация с X-Device-Id: токен берём из body (мобильный client type —
// тот же путь, что ревью-тесты desktop), ссылка на устройство создаётся
// сервером в account_device_links.
async function registerOnDevice(email: string): Promise<AccountUser> {
  const res = await request(app)
    .post('/api/auth/register')
    .set('X-Device-Id', DEVICE)
    .send({ email, password: 'Test1234', username: email.split('@')[0], deviceInfo: { type: 'android' } });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { id: res.body.user.id, email, accessToken: res.body.tokens.accessToken };
}

describe('Accounts API (мультиаккаунт, /api/accounts)', () => {
  let userA: AccountUser;
  let userB: AccountUser;
  let userC: AccountUser; // зарегистрирован БЕЗ устройства

  const authA = () => ['Authorization', `Bearer ${userA.accessToken}`] as const;
  const authB = () => ['Authorization', `Bearer ${userB.accessToken}`] as const;
  const authC = () => ['Authorization', `Bearer ${userC.accessToken}`] as const;

  beforeAll(async () => {
    const tag = `${Date.now()}_${process.pid}`;
    userA = await registerOnDevice(`accA${tag}@test.balloo.ru`);
    userB = await registerOnDevice(`accB${tag}@test.balloo.ru`);
    // C — без X-Device-Id, ссылка не создаётся
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `accC${tag}@test.balloo.ru`, password: 'Test1234', username: `accC${tag}`, deviceInfo: { type: 'android' } });
    if (res.status !== 201) throw new Error(`register C failed: ${res.status}`);
    userC = { id: res.body.user.id, email: res.body.email, accessToken: res.body.tokens.accessToken };
  });

  describe('GET /api/accounts', () => {
    it('возвращает аккаунты устройства; последний вошедший — активный', async () => {
      const [key, value] = authA();
      const res = await request(app).get('/api/accounts').set(key, value).set('X-Device-Id', DEVICE);

      expect(res.status).toBe(200);
      expect(res.body.accounts).toHaveLength(2);
      const a = res.body.accounts.find((x: any) => x.userId === userA.id);
      const b = res.body.accounts.find((x: any) => x.userId === userB.id);
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      expect(a.isActive).toBe(false); // B вошёл позже → активен B
      expect(b.isActive).toBe(true);
      expect(a.pushEnabled).toBe(true);
      expect(typeof a.chatsCount).toBe('number');
      expect(typeof a.unreadCount).toBe('number');
    });

    it('без X-Device-Id → 400', async () => {
      const [key, value] = authA();
      const res = await request(app).get('/api/accounts').set(key, value);
      expect(res.status).toBe(400);
    });

    it('чужой пользователь с этим deviceId → 403 (не подключён к устройству)', async () => {
      const [key, value] = authC();
      const res = await request(app).get('/api/accounts').set(key, value).set('X-Device-Id', DEVICE);
      expect(res.status).toBe(403);
    });

    it('без авторизации → 401', async () => {
      const res = await request(app).get('/api/accounts').set('X-Device-Id', DEVICE);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/accounts/switch', () => {
    it('переключение делает целевой аккаунт активным и выдаёт cookie', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .post('/api/accounts/switch')
        .set(key, value)
        .set('X-Device-Id', DEVICE)
        .send({ userId: userA.id });

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(userA.id);
      const cookies: string[] = res.headers['set-cookie'] || [];
      expect(cookies.some((c) => c.startsWith('balloo-access-token='))).toBe(true);

      // состояние переключилось
      const [k2, v2] = authB();
      const list = await request(app).get('/api/accounts').set(k2, v2).set('X-Device-Id', DEVICE);
      const a = list.body.accounts.find((x: any) => x.userId === userA.id);
      const b = list.body.accounts.find((x: any) => x.userId === userB.id);
      expect(a.isActive).toBe(true);
      expect(b.isActive).toBe(false);
    });

    it('переключение на не подключённый аккаунт → 404', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .post('/api/accounts/switch')
        .set(key, value)
        .set('X-Device-Id', DEVICE)
        .send({ userId: 'nonexistent-user-id-000' });
      expect(res.status).toBe(404);
    });

    it('без userId → 400', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .post('/api/accounts/switch')
        .set(key, value)
        .set('X-Device-Id', DEVICE)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/accounts/:userId/notifications', () => {
    it('выключение push сохраняется', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .patch(`/api/accounts/${userB.id}/notifications`)
        .set(key, value)
        .set('X-Device-Id', DEVICE)
        .send({ enabled: false });
      expect(res.status).toBe(200);
      expect(res.body.pushEnabled).toBe(false);

      const list = await request(app).get('/api/accounts').set(key, value).set('X-Device-Id', DEVICE);
      expect(list.body.accounts.find((x: any) => x.userId === userB.id).pushEnabled).toBe(false);
    });

    it('неboolean enabled → 400', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .patch(`/api/accounts/${userB.id}/notifications`)
        .set(key, value)
        .set('X-Device-Id', DEVICE)
        .send({ enabled: 'yes' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/accounts/:userId', () => {
    it('нельзя отключить активный аккаунт → 400', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .delete(`/api/accounts/${userA.id}`)
        .set(key, value)
        .set('X-Device-Id', DEVICE);
      expect(res.status).toBe(400);
    });

    it('отключение неактивного убирает его из списка', async () => {
      const [key, value] = authA();
      const res = await request(app)
        .delete(`/api/accounts/${userB.id}`)
        .set(key, value)
        .set('X-Device-Id', DEVICE);
      expect(res.status).toBe(200);

      const list = await request(app).get('/api/accounts').set(key, value).set('X-Device-Id', DEVICE);
      expect(list.body.accounts).toHaveLength(1);
      expect(list.body.accounts[0].userId).toBe(userA.id);
    });
  });
});
