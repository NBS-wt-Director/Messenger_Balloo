/**
 * Тесты кода входа (13 цифр) — тикет 1795101593.
 *
 * Проверяем:
 *  - генерацию ровно 13-значного кода;
 *  - выбор канала доставки: push при наличии browser-push подписки, иначе email;
 *  - сохранение/проверку кода в Redis (in-memory фейк) и его одноразовость;
 *  - аннулирование после 5 неверных попыток;
 *  - API: 400 без email, 200 при неизвестном email (анти-enumeration);
 *  - полный поток: enable2FA → login(needs2FA) → send-code → verify по 13 цифрам.
 *
 * Redis подменяется in-memory фейком (как в devices-pair.test.ts), emailService
 * и pushService — моками (реальной отправки нет).
 */
import request from 'supertest';
import crypto from 'crypto';
import { app, registerTestUser } from './helpers';
import { PrismaClient } from '@prisma/client';

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

jest.mock('../services/pushService', () => ({
  sendVapidPushToUsers: jest.fn().mockResolvedValue(undefined),
}));

import { sendLoginCodeEmail } from '../services/emailService';
import { sendVapidPushToUsers } from '../services/pushService';
import {
  generateLoginCode,
  issueLoginCode,
  verifyLoginCode,
  resolveCodeChannel,
  LOGIN_CODE_LENGTH,
  LOGIN_CODE_TTL_SECONDS,
} from '../services/loginCodeService';

const prisma = new PrismaClient();
const emailMock = sendLoginCodeEmail as unknown as jest.Mock;
const pushMock = sendVapidPushToUsers as unknown as jest.Mock;

// TOTP-код тем же алгоритмом, что verifyTOTP в authService (SHA1, 6 цифр, окно 1)
function totpCode(secretHex: string): string {
  const secretBuffer = Buffer.from(secretHex, 'hex');
  const period = 30;
  const step = Math.floor(Date.now() / 1000 / period);
  const hmac = crypto.createHmac('sha1', secretBuffer).update(Buffer.from(step.toString())).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

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

beforeAll(() => {
  fakeRedis = {
    set: async (key, value, ...rest) => {
      let ttl = 0;
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

beforeEach(() => {
  store.clear();
  emailMock.mockClear();
  pushMock.mockClear();
});

describe('loginCodeService', () => {
  it('generateLoginCode: ровно 13 цифр', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateLoginCode();
      expect(code).toMatch(/^\d{13}$/);
      expect(code).toHaveLength(LOGIN_CODE_LENGTH);
    }
  });

  it('resolveCodeChannel: без push-подписки → email, с подпиской → push', async () => {
    const user = await registerTestUser();
    expect(await resolveCodeChannel(user.id)).toBe('email');

    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: `https://push.example.com/${Date.now()}-${user.id}`,
        p256dh: 'test-p256dh',
        auth: 'test-auth',
      },
    });

    expect(await resolveCodeChannel(user.id)).toBe('push');
  });

  it('issueLoginCode: email-канал, код 13 цифр, verify одноразовый', async () => {
    const user = await registerTestUser();

    const res = await issueLoginCode({ userId: user.id, email: user.email });
    expect(res.channel).toBe('email');
    expect(res.expiresIn).toBe(LOGIN_CODE_TTL_SECONDS);

    expect(emailMock).toHaveBeenCalledTimes(1);
    const code = emailMock.mock.calls[0][1] as string;
    expect(code).toMatch(/^\d{13}$/);

    expect(await verifyLoginCode(user.id, code)).toBe(true);
    // одноразовость: повторная проверка того же кода — уже false
    expect(await verifyLoginCode(user.id, code)).toBe(false);
  });

  it('issueLoginCode: канал push при наличии подписки (email не отправляется)', async () => {
    const user = await registerTestUser();
    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: `https://push.example.com/${Date.now()}-${user.id}`,
        p256dh: 'k',
        auth: 'a',
      },
    });

    const res = await issueLoginCode({ userId: user.id, email: user.email });
    expect(res.channel).toBe('push');
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(emailMock).not.toHaveBeenCalled();
    // код уходит в теле push-уведомления
    const payload = pushMock.mock.calls[0][1] as { body: string };
    expect(payload.body).toMatch(/\d{13}/);
  });

  it('verifyLoginCode: неверный код → false; после 5 попыток код аннулируется', async () => {
    const user = await registerTestUser();
    await issueLoginCode({ userId: user.id, email: user.email });
    const code = emailMock.mock.calls[0][1] as string;

    for (let i = 0; i < 5; i++) {
      expect(await verifyLoginCode(user.id, '0000000000000')).toBe(false);
    }

    // после исчерпания попыток даже верный код не принимается
    expect(await verifyLoginCode(user.id, code)).toBe(false);
  });

  it('verifyLoginCode: без выданного кода → false', async () => {
    const user = await registerTestUser();
    expect(await verifyLoginCode(user.id, '1234567890123')).toBe(false);
  });
});

describe('POST /api/auth/2fa/send-code', () => {
  it('без email → 400', async () => {
    const res = await request(app).post('/api/auth/2fa/send-code').send({});
    expect(res.status).toBe(400);
  });

  it('неизвестный email → 200 без отправки (анти-enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/send-code')
      .send({ email: 'ghost_no_such_user@test.balloo.ru' });

    expect(res.status).toBe(200);
    expect(res.body.channel).toBe('email');
    expect(emailMock).not.toHaveBeenCalled();
  });

  it('полный поток: enable2FA → login needs2FA → send-code → verify по 13 цифрам', async () => {
    const user = await registerTestUser();

    // 1. Включаем 2FA (TOTP)
    const enable = await request(app)
      .post('/api/auth/2fa/enable')
      .set('Cookie', [`balloo-access-token=${user.accessToken}`])
      .send({ method: 'totp' });
    expect(enable.status).toBe(200);
    const secret = enable.body.secret as string;
    expect(secret).toBeTruthy();

    const enableVerify = await request(app)
      .post('/api/auth/2fa/verify-enable')
      .set('Cookie', [`balloo-access-token=${user.accessToken}`])
      .send({ code: totpCode(secret) });
    expect(enableVerify.status).toBe(200);

    // 2. Логин по паролю → needs2FA
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(login.status).toBe(200);
    expect(login.body.user.needs2FA).toBe(true);

    // 3. Запрос кода входа → email-канал (push-подписки нет)
    const send = await request(app)
      .post('/api/auth/2fa/send-code')
      .send({ email: user.email });
    expect(send.status).toBe(200);
    expect(send.body.channel).toBe('email');

    const code = emailMock.mock.calls.at(-1)![1] as string;
    expect(code).toMatch(/^\d{13}$/);

    // 4. Проверка кода → cookie
    const verify = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ email: user.email, code });
    expect(verify.status).toBe(200);
    expect(getCookie(verify, 'balloo-access-token')).toBeTruthy();
  });
});
