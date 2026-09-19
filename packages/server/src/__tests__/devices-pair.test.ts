// Тесты QR pair-token API (POST /devices/pair-token, GET /devices/pair/:token/status,
// POST /devices/pair/confirm) — docs/04-api-websocket-spec.md, макет add-device.md
//
// Redis подменяется in-memory фейком (Map + TTL): прод-семантика
// (одноразовость, истечение) сохраняется, реальное подключение не нужно.

import request from 'supertest';
import { app, registerTestUser, TestUser } from './helpers';

// --- In-memory фейк Redis (set с EX / get с истечением / del) ---
interface Entry {
  value: string;
  expiresAt: number;
}
const store = new Map<string, Entry>();

let fakeRedis: {
  set: (key: string, value: string, ...rest: unknown[]) => Promise<'OK'>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<number>;
} | null = null;

jest.mock('../services/cacheService', () => ({
  getRedis: () => fakeRedis,
}));

beforeAll(() => {
  fakeRedis = {
    set: async (key, value, ...rest) => {
      let ttl = 0;
      // сигнатура ioredis: set(key, value, 'EX', seconds)
      if (rest[0] === 'EX') ttl = Number(rest[1]);
      store.set(key, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : Infinity });
      return 'OK';
    },
    get: async (key) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    del: async (key) => {
      store.delete(key);
      return 1;
    },
  };
});

// Cookie-парсер ответа (токены в httpOnly cookie)
function getCookie(res: request.Response, name: string): string {
  const raw: unknown = res.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? (raw as string[]) : [];
  for (const c of cookies) {
    const [pair] = c.split(';');
    const [key, ...rest] = pair.split('=');
    if (key.trim() === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

describe('QR pair-token API', () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await registerTestUser();
  });

  it('POST /api/devices/pair-token — генерирует код без авторизации', async () => {
    const res = await request(app).post('/api/devices/pair-token').send({});

    expect(res.status).toBe(201);
    expect(res.body.token).toMatch(/^[a-f0-9]{48}$/);
    expect(res.body.code).toBe(`balloo://pair/${res.body.token}`);
    expect(res.body.expiresIn).toBe(60);
  });

  it('GET status — pending до подтверждения', async () => {
    const created = await request(app).post('/api/devices/pair-token').send({});
    const res = await request(app).get(`/api/devices/pair/${created.body.token}/status`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'pending' });
  });

  it('GET status — 400 на некорректный код', async () => {
    const res = await request(app).get('/api/devices/pair/not-a-token/status');
    expect(res.status).toBe(400);
  });

  it('GET status — expired для неизвестного кода', async () => {
    const token = 'a'.repeat(48);
    const res = await request(app).get(`/api/devices/pair/${token}/status`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'expired' });
  });

  it('POST /pair/confirm — 401 без авторизации', async () => {
    const created = await request(app).post('/api/devices/pair-token').send({});
    const res = await request(app)
      .post('/api/devices/pair/confirm')
      .send({ token: created.body.token });

    expect(res.status).toBe(401);
  });

  it('POST /pair/confirm — 404 для несуществующего кода', async () => {
    const res = await request(app)
      .post('/api/devices/pair/confirm')
      .set('Cookie', `balloo-access-token=${user.accessToken}`)
      .send({ token: 'b'.repeat(48), deviceType: 'desktop' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Код не найден или истёк');
  });

  it('полный поток: код → pending → confirm → confirmed + cookie → код одноразовый', async () => {
    // 1. Новое устройство получает код
    const created = await request(app).post('/api/devices/pair-token').send({});
    const token: string = created.body.token;

    // 2. Статус — pending
    const pending = await request(app).get(`/api/devices/pair/${token}/status`);
    expect(pending.body).toEqual({ status: 'pending' });

    // 3. Авторизованное устройство подтверждает
    const confirm = await request(app)
      .post('/api/devices/pair/confirm')
      .set('Cookie', `balloo-access-token=${user.accessToken}`)
      .send({ token, deviceType: 'desktop', deviceName: 'Мой ПК', platform: 'Linux' });

    expect(confirm.status).toBe(200);
    expect(confirm.body.message).toBe('Вход подтверждён');
    expect(confirm.body.deviceId).toBeTruthy();

    // 4. Повторное подтверждение того же кода — 409
    const confirmAgain = await request(app)
      .post('/api/devices/pair/confirm')
      .set('Cookie', `balloo-access-token=${user.accessToken}`)
      .send({ token });
    expect(confirmAgain.status).toBe(409);

    // 5. Новое устройство опрашивает статус: confirmed + auth-cookie в ответе
    const status = await request(app).get(`/api/devices/pair/${token}/status`);
    expect(status.status).toBe(200);
    expect(status.body.status).toBe('confirmed');
    expect(status.body.user.username).toBe(user.username);
    // Токены — только в httpOnly cookie, не в body
    expect(status.body).not.toHaveProperty('accessToken');
    expect(getCookie(status, 'balloo-access-token')).toBeTruthy();
    expect(getCookie(status, 'balloo-refresh-token')).toBeTruthy();

    // 6. Код одноразовый: повторный опрос — expired
    const statusAgain = await request(app).get(`/api/devices/pair/${token}/status`);
    expect(statusAgain.body).toEqual({ status: 'expired' });
  });

  it('POST /pair/confirm — некорректный deviceType заменяется на web', async () => {
    const created = await request(app).post('/api/devices/pair-token').send({});
    const res = await request(app)
      .post('/api/devices/pair/confirm')
      .set('Cookie', `balloo-access-token=${user.accessToken}`)
      .send({ token: created.body.token, deviceType: 'toaster' });

    expect(res.status).toBe(200);
  });
});
