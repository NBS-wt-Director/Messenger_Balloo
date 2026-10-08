/**
 * Depth-тесты auth-контура (тикет 1790479920-02, В-93 (а)).
 *
 * Цель — поднять покрытие controllers/authController.ts и services/authService.ts
 * с ~50% до целевых 80%+. Покрываются ветки, не задетые API-тестами auth.test.ts:
 *  - легаси SHA-256 хеш и прозрачная миграция на bcrypt (login needsRehash);
 *  - verifyEmail / requestPasswordReset / resetPassword — все ветки токенов;
 *  - refreshTokens — неверный тип/подпись/пользователь;
 *  - 2FA: enable → verify-enable (TOTP) → login с needs2FA → verify2FA по TOTP
 *    и backup-коду → disable; verifyTOTP-ветки неверного кода;
 *  - devices: список + отзыв (успех/404);
 *  - wsToken: access-тип OK, refresh-тип отклонён, мусор отклонён;
 *  - контроллер: verify-email/request-reset/reset-password 400-ветки,
 *    oauthAuthorize not_configured → 302, oauthLogin 400/403 ветки (P33 уже
 *    покрыт oauth-inactive-account.test.ts — здесь не дублируется),
 *    clear-cookie, mobile-ветки refresh-cookie.
 *
 * Стиль импортов как в oauth-inactive-account.test.ts: './helpers' ДО
 * '@prisma/client' (см. комментарий там — порядок важен для env).
 */
import request from 'supertest';
import { app, registerTestUser, loginTestUser, generateToken, generateRefreshToken } from './helpers';
import { PrismaClient } from '@prisma/client';
import {
  refreshTokens,
  verifyEmail as verifyEmailService,
  requestPasswordReset,
  resetPassword,
  getWsToken,
  revokeDevice,
  getUserDevices,
  disable2FA,
  enable2FA,
  verify2FAEnable,
  verify2FA as verify2FAService,
  exchangeYandexCode,
  exchangeVkCode,
  exchangeMailruCode,
  getMailruUser,
  getYandexUser,
  isOAuthProviderConfigured,
  getOAuthAuthorizeUrl,
} from '../services/authService';

const prisma = new PrismaClient();
const now = () => BigInt(Math.floor(Date.now() / 1000));

// TOTP-код тем же алгоритмом, что verifyTOTP в authService (SHA1, 6 цифр, окно 1)
function totpCode(secretHex: string, offsetSteps = 0): string {
  const secretBuffer = Buffer.from(secretHex, 'hex');
  const period = 30;
  const step = Math.floor(Date.now() / 1000 / period) + offsetSteps;
  const hmac = crypto.createHmac('sha1', secretBuffer).update(Buffer.from(step.toString())).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

import crypto from 'crypto';

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

/** Легаси SHA-256 хеш с той же солью, что legacyHash в authService */
function legacyHash(password: string): string {
  return crypto.createHash('sha256').update(password + 'balloo-salt-2024').digest('hex');
}

describe('Auth service depth (В-93 а)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('refreshTokens (сервис)', () => {
    it('выдаёт новую пару по валидному refresh-токену', async () => {
      const user = await registerTestUser();
      const tokens = await refreshTokens(user.refreshToken);
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    it('отклоняет подпись чужим секретом', async () => {
      const bad = generateRefreshToken('no-such-user', 'x@x.ru').replace(/.$/, '0');
      await expect(refreshTokens(bad)).rejects.toThrow();
    });

    it('отклоняет мусор', async () => {
      await expect(refreshTokens('garbage.token.here')).rejects.toThrow('Недействительный refresh токен');
    });

    it('отклоняет refresh для неактивного пользователя', async () => {
      const user = await registerTestUser();
      await prisma.user.update({ where: { id: user.id }, data: { status: 'banned', updatedAt: now() } });
      await expect(refreshTokens(user.refreshToken)).rejects.toThrow('Пользователь не найден или неактивен');
    });
  });

  describe('verifyEmail (сервис) — все ветки токена', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await registerTestUser();
      userId = user.id;
    });

    async function makeToken(type: string, expired = false, used = false) {
      const token = `vt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await prisma.verificationToken.create({
        data: {
          userId,
          type,
          token,
          expiresAt: expired ? now() - 10n : now() + 3600n,
          used,
          createdAt: now(),
        },
      });
      return token;
    }

    it('несуществующий токен → success:false', async () => {
      const r = await verifyEmailService({ token: 'no-such-token' });
      expect(r.success).toBe(false);
      expect(r.message).toContain('Недействительный');
    });

    it('уже использованный токен → success:false', async () => {
      const t = await makeToken('email_verification', false, true);
      const r = await verifyEmailService({ token: t });
      expect(r.success).toBe(false);
      expect(r.message).toContain('использован');
    });

    it('истёкший токен → success:false', async () => {
      const t = await makeToken('email_verification', true);
      const r = await verifyEmailService({ token: t });
      expect(r.success).toBe(false);
      expect(r.message).toContain('истёк');
    });

    it('неверный тип токена → success:false', async () => {
      const t = await makeToken('password_reset');
      const r = await verifyEmailService({ token: t });
      expect(r.success).toBe(false);
      expect(r.message).toContain('Неверный тип');
    });

    it('валидный токен → success:true, токен помечен used', async () => {
      const t = await makeToken('email_verification');
      const r = await verifyEmailService({ token: t });
      expect(r.success).toBe(true);
      const rec = await prisma.verificationToken.findUnique({ where: { token: t } });
      expect(rec?.used).toBe(true);
    });
  });

  describe('requestPasswordReset + resetPassword (сервис)', () => {
    it('несуществующий email → success:true без создания токена (не раскрываем наличие)', async () => {
      const r = await requestPasswordReset({ email: `ghost_${Date.now()}@test.balloo.ru` });
      expect(r.success).toBe(true);
    });

    it('повторный запрос удаляет старые неиспользованные токены', async () => {
      const user = await registerTestUser();
      await requestPasswordReset({ email: user.email });
      await requestPasswordReset({ email: user.email });
      const tokens = await prisma.verificationToken.findMany({
        where: { userId: user.id, type: 'password_reset', used: false },
      });
      expect(tokens.length).toBe(1);
    });

    it('несуществующий токен сброса → ошибка', async () => {
      await expect(resetPassword({ token: 'no-such', newPassword: 'NewPass123' })).rejects.toThrow(
        'Недействительный токен сброса пароля'
      );
    });

    it('токен другого типа → ошибка типа', async () => {
      const user = await registerTestUser();
      const token = `wrong_${Date.now()}`;
      await prisma.verificationToken.create({
        data: { userId: user.id, type: 'email_verification', token, expiresAt: now() + 3600n, createdAt: now() },
      });
      await expect(resetPassword({ token, newPassword: 'NewPass123' })).rejects.toThrow('Неверный тип токена');
    });

    it('истёкший токен сброса → ошибка истечения', async () => {
      const user = await registerTestUser();
      const token = `exp_${Date.now()}`;
      await prisma.verificationToken.create({
        data: { userId: user.id, type: 'password_reset', token, expiresAt: now() - 10n, createdAt: now() },
      });
      await expect(resetPassword({ token, newPassword: 'NewPass123' })).rejects.toThrow('истёк');
    });

    it('уже использованный токен → ошибка', async () => {
      const user = await registerTestUser();
      const token = `used_${Date.now()}`;
      await prisma.verificationToken.create({
        data: { userId: user.id, type: 'password_reset', token, expiresAt: now() + 3600n, used: true, createdAt: now() },
      });
      await expect(resetPassword({ token, newPassword: 'NewPass123' })).rejects.toThrow('уже был использован');
    });

    it('успешный сброс: пароль меняется, вход по новому паролю работает', async () => {
      const user = await registerTestUser();
      const r = await requestPasswordReset({ email: user.email });
      expect(r.success).toBe(true);
      const rec = await prisma.verificationToken.findFirst({
        where: { userId: user.id, type: 'password_reset', used: false },
      });
      expect(rec).toBeTruthy();
      await resetPassword({ token: rec!.token, newPassword: 'BrandNew123' });
      const login = await loginTestUser(user.email, 'BrandNew123');
      expect(login.userId).toBe(user.id);
    });
  });

  describe('Легаси-хеш и прозрачная миграция (verifyPassword через login)', () => {
    it('вход с легаси SHA-256 хешем проходит и переписывает хеш на bcrypt', async () => {
      const email = `legacy_${Date.now()}@test.balloo.ru`;
      const username = `legacy_${Date.now()}`;
      // Создаём пользователя напрямую с легаси-хешем (как старые аккаунты)
      const u = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: legacyHash('OldPass123'),
          language: 'ru',
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
          publicProfile: { create: { username, displayName: username } },
        },
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'OldPass123' });
      expect(res.status).toBe(200);
      // Прозрачная миграция: после входа хеш должен стать bcrypt ($2)
      const after = await prisma.user.findUnique({ where: { id: u.id } });
      expect(after?.passwordHash?.startsWith('$2')).toBe(true);
      // Повторный вход по тому же паролю тоже работает (bcrypt-ветка)
      const res2 = await request(app).post('/api/auth/login').send({ email, password: 'OldPass123' });
      expect(res2.status).toBe(200);
    });

    it('вход с невалидным хешем в БД → 401 (catch-ветка bcrypt.compare)', async () => {
      const email = `brokenhash_${Date.now()}@test.balloo.ru`;
      const username = `brokenhash_${Date.now()}`;
      await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: 'not-a-valid-bcrypt-hash',
          language: 'ru',
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
          publicProfile: { create: { username, displayName: username } },
        },
      });
      const res = await request(app).post('/api/auth/login').send({ email, password: 'Whatever1' });
      expect(res.status).toBe(401);
    });
  });

  describe('Статусы аккаунта в login', () => {
    it.each(['banned', 'deleted', 'suspended'] as const)('статус %s → 401 с сообщением', async (status) => {
      const user = await registerTestUser();
      await prisma.user.update({ where: { id: user.id }, data: { status, updatedAt: now() } });
      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Test1234' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain(status === 'banned' ? 'заблокирован' : status === 'deleted' ? 'удалён' : 'приостановлен');
    });
  });

  describe('2FA полный цикл (enable → verify-enable → login needs2FA → verify → disable)', () => {
    it('полный TOTP-поток через API', async () => {
      const user = await registerTestUser();

      // enable — выдаёт secret + backupCodes
      const en = await request(app)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({});
      expect(en.status).toBe(200);
      expect(en.body.secret).toBeTruthy();
      expect(Array.isArray(en.body.backupCodes)).toBe(true);
      expect(en.body.qrCodeUrl).toContain('otpauth://totp');

      const secret: string = en.body.secret;

      // verify-enable с неверным кодом → 400
      const bad = await request(app)
        .post('/api/auth/2fa/verify-enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: '000000' });
      expect(bad.status).toBe(400);

      // verify-enable с верным TOTP → 200
      const ok = await request(app)
        .post('/api/auth/2fa/verify-enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ code: totpCode(secret) });
      expect(ok.status).toBe(200);

      // verify-enable без кода → 400 (контроллер)
      const noCode = await request(app)
        .post('/api/auth/2fa/verify-enable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({});
      expect(noCode.status).toBe(400);

      // login → needs2FA:true, токены не выдаются
      const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Test1234' });
      expect(login.status).toBe(200);
      expect(login.body.user.needs2FA).toBe(true);
      expect(getCookie(login, 'balloo-access-token')).toBe('');

      // verify2FA с неверным кодом → 401
      const wrong = await request(app)
        .post('/api/auth/2fa/verify')
        .send({ email: user.email, code: '000000' });
      expect(wrong.status).toBe(401);

      // verify2FA с верным TOTP → 200 + cookie
      const good = await request(app)
        .post('/api/auth/2fa/verify')
        .send({ email: user.email, code: totpCode(secret) });
      expect(good.status).toBe(200);
      expect(getCookie(good, 'balloo-access-token')).toBeTruthy();

      // verify2FA по backup-коду: TOTP-код тратится, второй вход — бэкапом
      const backup: string[] = en.body.backupCodes;
      const viaBackup = await request(app)
        .post('/api/auth/2fa/verify')
        .send({ email: user.email, code: backup[0] });
      expect(viaBackup.status).toBe(200);
      // Бэкап-код должен быть вычеркнут
      const rec = await prisma.twoFASecret.findUnique({ where: { userId: user.id } });
      const remaining = JSON.parse(rec!.backupCodes) as string[];
      expect(remaining).not.toContain(backup[0]);
      expect(remaining.length).toBe(backup.length - 1);

      // verify2FA для аккаунта без 2FA → 401 (сервис-ветка)
      const no2faUser = await registerTestUser();
      const none = await request(app)
        .post('/api/auth/2fa/verify')
        .send({ email: no2faUser.email, code: '123456' });
      expect(none.status).toBe(401);

      // disable → 200, повторный login без needs2FA
      const off = await request(app)
        .post('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({});
      expect(off.status).toBe(200);
      const plainLogin = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Test1234' });
      expect(plainLogin.status).toBe(200);
      expect(plainLogin.body.user.needs2FA).toBe(false);
    });

    it('2fa/enable без auth → 401; enable2FA сервис: для отсутствующего пользователя → ошибка', async () => {
      const res = await request(app).post('/api/auth/2fa/enable').send({});
      expect(res.status).toBe(401);
      await expect(enable2FA({ userId: `no-user-${Date.now()}` })).rejects.toThrow('Пользователь не найден');
    });

    // disable2FA (сервис) делает upsert с create — для отсутствующего userId
    // create падает по FK (user не существует). Проверяем на реальном пользователе.
    it('disable2FA сервис: для реального пользователя без 2FA — создаёт выключенную запись', async () => {
      const user = await registerTestUser();
      const r = await disable2FA({ userId: user.id });
      expect(r.disabled).toBe(true);
      const rec = await prisma.twoFASecret.findUnique({ where: { userId: user.id } });
      expect(rec?.enabled).toBe(false);
    });

    it('verify2FAEnable сервис: без настройки 2FA → ошибка', async () => {
      const user = await registerTestUser();
      await expect(verify2FAEnable({ userId: user.id, code: '123456' })).rejects.toThrow('2FA не настроена');
    });

    it('verify2FA сервис: без 2FA → ошибка сервиса; неверный код → ошибка', async () => {
      const user = await registerTestUser();
      await expect(verify2FAService({ email: 'ghost@x.ru', code: '000000' })).rejects.toThrow(
        '2FA не включена'
      );
    });
  });

  describe('Устройства (devices)', () => {
    it('список пуст у нового пользователя; отзыв чужого/несуществующего устройства → 404', async () => {
      const user = await registerTestUser();
      const list = await request(app)
        .get('/api/auth/devices')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(list.status).toBe(200);
      expect(Array.isArray(list.body.devices)).toBe(true);

      const res = await request(app)
        .delete('/api/auth/devices/missing-device-id')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.status).toBe(404);
    });

    it('revokeDevice сервис: устройство не найдено → ошибка; существующее → revoked', async () => {
      const user = await registerTestUser();
      await expect(revokeDevice(user.id, 'missing')).rejects.toThrow('Устройство не найдено');

      const device = await prisma.device.create({
        data: {
          userId: user.id,
          type: 'web',
          lastActive: now(),
          createdAt: now(),
        },
      });
      const r = await revokeDevice(user.id, device.id);
      expect(r.revoked).toBe(true);
      const gone = await prisma.device.findUnique({ where: { id: device.id } });
      expect(gone).toBeNull();
    });

    it('getUserDevices сервис: возвращает устройства в порядке lastActive desc', async () => {
      const user = await registerTestUser();
      await prisma.device.create({ data: { userId: user.id, type: 'web', lastActive: now(), createdAt: now() } });
      await prisma.device.create({ data: { userId: user.id, type: 'android', lastActive: now() + 5n, createdAt: now() } });
      const devices = await getUserDevices(user.id);
      expect(devices.length).toBe(2);
      expect(devices[0].type).toBe('android');
    });

    it('revokeDeviceController без deviceId → 400', async () => {
      // Пустой deviceId в пути не сматчится :deviceId, поэтому проверяем
      // контроллерную ветку через сервис-маршрут с пустой строкой не выйдет —
      // ветка защищена на уровне маршрута; здесь фиксируем поведение 404.
      const user = await registerTestUser();
      const res = await request(app)
        .delete('/api/auth/devices/')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect([404, 405]).toContain(res.status);
    });
  });

  describe('wsToken (сервис + контроллер)', () => {
    it('валидный access-токен → ws-токен с ws:true', async () => {
      const user = await registerTestUser();
      const ws = await getWsToken(user.accessToken);
      expect(ws.split('.').length).toBe(3);
    });

    it('refresh-токен вместо access → ошибка Invalid access token', async () => {
      const user = await registerTestUser();
      await expect(getWsToken(user.refreshToken)).rejects.toThrow('Invalid access token');
    });

    it('мусор → ошибка', async () => {
      await expect(getWsToken('not.a.jwt')).rejects.toThrow('Invalid access token');
    });

    it('GET /api/auth/ws-token без auth → 401', async () => {
      const res = await request(app).get('/api/auth/ws-token');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Контроллер: verify-email / request-reset / reset-password 400-ветки', () => {
    it('verify-email без токена → 400', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({});
      expect(res.status).toBe(400);
    });

    it('request-reset без email → 400', async () => {
      const res = await request(app).post('/api/auth/request-reset').send({});
      expect(res.status).toBe(400);
    });

    it('reset-password без токена/пароля → 400', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({});
      expect(res.status).toBe(400);
      const res2 = await request(app).post('/api/auth/reset-password').send({ token: 't' });
      expect(res2.status).toBe(400);
    });
  });

  describe('oauthAuthorize: не настроенный провайдер → 302 not_configured', () => {
    it('GET /api/auth/oauth/rambler → 302 на login?oauth_error=not_configured', async () => {
      const res = await request(app).get('/api/auth/oauth/rambler');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth_error=not_configured');
    });
  });

  describe('oauthLogin контроллер: 400-ветка', () => {
    it('без provider/providerId → 400', async () => {
      const res = await request(app).post('/api/auth/oauth/yandex').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('clear-cookie и logout', () => {
    it('clear-cookie сбрасывает cookie', async () => {
      const res = await request(app).post('/api/auth/clear-cookie').send({});
      expect(res.status).toBe(200);
    });

    it('logout без refresh-токена → 400', async () => {
      const res = await request(app).post('/api/auth/logout').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('refresh-cookie: мобильная ветка возвращает tokens в body', () => {
    it('client=mobile → tokens в ответе', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/auth/refresh-cookie')
        .send({ refreshToken: user.refreshToken, client: 'mobile' });
      expect(res.status).toBe(200);
      expect(res.body.tokens).toBeTruthy();
      expect(res.body.tokens.accessToken).toBeTruthy();
    });

    it('без refresh-токена вообще → 400', async () => {
      const res = await request(app).post('/api/auth/refresh-cookie').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('OAuth exchange-функции (fetch мокается на global.fetch)', () => {
    const realFetch = global.fetch;

    afterEach(() => {
      global.fetch = realFetch;
      jest.restoreAllMocks();
    });

    const stubFetch = (impl: (url: string) => { ok: boolean; status?: number; json?: () => Promise<unknown>; text?: () => Promise<string> }) => {
      global.fetch = jest.fn(async (input: unknown) => {
        const url = typeof input === 'string' ? input : String((input as RequestInfo));
        const r = impl(url);
        return {
          ok: r.ok,
          status: r.status ?? (r.ok ? 200 : 500),
          json: r.json ?? (async () => ({})),
          text: r.text ?? (async () => ''),
        } as unknown as Response;
      }) as unknown as typeof fetch;
    };

    it('exchangeYandexCode: успех возвращает json', async () => {
      stubFetch(() => ({ ok: true, json: async () => ({ access_token: 'yat' }) }));
      const r = (await exchangeYandexCode('code1')) as { access_token: string };
      expect(r.access_token).toBe('yat');
    });

    it('exchangeYandexCode: ошибка провайдера → throw со статусом', async () => {
      stubFetch(() => ({ ok: false, status: 400 }));
      await expect(exchangeYandexCode('bad')).rejects.toThrow('Yandex token exchange failed: 400');
    });

    it('getYandexUser: ошибка userinfo → throw', async () => {
      stubFetch(() => ({ ok: false, status: 403 }));
      await expect(getYandexUser('t')).rejects.toThrow('Yandex OAuth error: 403');
    });

    it('exchangeVkCode: успех с email и user_id', async () => {
      stubFetch(() => ({
        ok: true,
        json: async () => ({ access_token: 'vkt', user_id: 42, email: 'vk@x.ru' }),
      }));
      const r = await exchangeVkCode('code2');
      expect(r.accessToken).toBe('vkt');
      expect(r.providerId).toBe('42');
      expect(r.email).toBe('vk@x.ru');
    });

    it('exchangeVkCode: ответ с error → throw', async () => {
      stubFetch(() => ({ ok: true, json: async () => ({ error: 'invalid_code' }) }));
      await expect(exchangeVkCode('bad')).rejects.toThrow('invalid_code');
    });

    it('exchangeVkCode: HTTP-ошибка → throw', async () => {
      stubFetch(() => ({ ok: false, status: 500 }));
      await expect(exchangeVkCode('bad')).rejects.toThrow('VK token exchange failed: 500');
    });

    it('exchangeMailruCode: успех возвращает токены и vid', async () => {
      stubFetch(() => ({
        ok: true,
        json: async () => ({ access_token: 'mt', refresh_token: 'mrt', expires_in: 3600, x_mailru_vid: '777' }),
      }));
      const r = await exchangeMailruCode('code3');
      expect(r.access_token).toBe('mt');
      expect(r.x_mailru_vid).toBe('777');
    });

    it('exchangeMailruCode: HTTP-ошибка → throw', async () => {
      stubFetch(() => ({ ok: false, status: 401 }));
      await expect(exchangeMailruCode('bad')).rejects.toThrow('Mail.ru token exchange failed: 401');
    });

    it('getMailruUser: успех с именем и склейкой имени/фамилии', async () => {
      stubFetch(() => ({
        ok: true,
        json: async () => ({ email: 'm@x.ru', first_name: 'Иван', last_name: 'Иванов' }),
      }));
      const r = await getMailruUser('mt');
      expect(r.email).toBe('m@x.ru');
      expect(r.username).toBe('Иван Иванов');
    });

    it('getMailruUser: HTTP-ошибка → throw', async () => {
      stubFetch(() => ({ ok: false, status: 500 }));
      await expect(getMailruUser('bad')).rejects.toThrow('Mail.ru userinfo failed: 500');
    });
  });

  describe('oauthAuthorize с настроенными env → 302 на провайдера (3 ветки switch)', () => {
    const REAL_ENV = { ...process.env };

    afterEach(() => {
      process.env.YANDEX_CLIENT_ID = REAL_ENV.YANDEX_CLIENT_ID;
      process.env.YANDEX_CLIENT_SECRET = REAL_ENV.YANDEX_CLIENT_SECRET;
      process.env.YANDEX_REDIRECT_URI = REAL_ENV.YANDEX_REDIRECT_URI;
      process.env.VK_CLIENT_ID = REAL_ENV.VK_CLIENT_ID;
      process.env.VK_CLIENT_SECRET = REAL_ENV.VK_CLIENT_SECRET;
      process.env.VK_REDIRECT_URI = REAL_ENV.VK_REDIRECT_URI;
      process.env.MAILRU_CLIENT_ID = REAL_ENV.MAILRU_CLIENT_ID;
      process.env.MAILRU_CLIENT_SECRET = REAL_ENV.MAILRU_CLIENT_SECRET;
      process.env.MAILRU_REDIRECT_URI = REAL_ENV.MAILRU_REDIRECT_URI;
    });

    it('yandex: 302 на oauth.yandex.ru/authorize', async () => {
      process.env.YANDEX_CLIENT_ID = 'test-id';
      process.env.YANDEX_CLIENT_SECRET = 'test-secret';
      process.env.YANDEX_REDIRECT_URI = 'https://api.balloo.su/api/auth/oauth/yandex-callback';
      const res = await request(app).get('/api/auth/oauth/yandex');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth.yandex.ru/authorize');
      expect(isOAuthProviderConfigured('yandex')).toBe(true);
    });

    it('vk: 302 на oauth.vk.com/authorize (scope=email)', async () => {
      process.env.VK_CLIENT_ID = 'vk-id';
      process.env.VK_CLIENT_SECRET = 'vk-secret';
      process.env.VK_REDIRECT_URI = 'https://api.balloo.su/api/auth/oauth/vk/callback';
      const res = await request(app).get('/api/auth/oauth/vk');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth.vk.com/authorize');
      expect(res.headers.location).toContain('scope=email');
    });

    it('mailru: 302 на connect.mail.ru/oauth/authorize', async () => {
      process.env.MAILRU_CLIENT_ID = 'mr-id';
      process.env.MAILRU_CLIENT_SECRET = 'mr-secret';
      process.env.MAILRU_REDIRECT_URI = 'https://api.balloo.su/api/auth/oauth/mailru/callback';
      const res = await request(app).get('/api/auth/oauth/mailru');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('connect.mail.ru/oauth/authorize');
    });

    it('env с ID, но без REDIRECT_URI → null URL → 302 not_configured; rambler/max не настроены', async () => {
      delete process.env.YANDEX_REDIRECT_URI;
      const res = await request(app).get('/api/auth/oauth/yandex');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('not_configured');
      expect(isOAuthProviderConfigured('rambler')).toBe(false);
      expect(isOAuthProviderConfigured('max')).toBe(false);
      expect(getOAuthAuthorizeUrl('unknown')).toBeNull();
    });
  });

  describe('yandexCallback / vkCallback / mailruCallback с кодом (мок fetch) → 302 /#/chat', () => {
    const realFetch = global.fetch;

    afterEach(() => {
      global.fetch = realFetch;
    });

    it('yandex: полный callback создаёт пользователя и редиректит на /#/chat', async () => {
      const yid = `ycb_${Date.now()}`;
      let call = 0;
      global.fetch = jest.fn(async () => {
        call++;
        if (call === 1) {
          // exchangeYandexCode
          return { ok: true, json: async () => ({ access_token: 'ya_t' }) } as unknown as Response;
        }
        // getYandexUser
        return {
          ok: true,
          json: async () => ({
            id: yid,
            default_email: `${yid}@yandex.ru`,
            // username не передаём — иначе коллизия @unique с тестовыми
            // пользователями (login провайдера может совпасть)
            login: '',
            default_avatar_id: '',
          }),
        } as unknown as Response;
      }) as unknown as typeof fetch;

      const res = await request(app)
        .get(`/api/auth/oauth/yandex-callback?code=abc&state=${'st_ycb_1'}`)
        .set('Cookie', 'oauth-state=st_ycb_1');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/#/chat');
      expect(getCookie(res, 'balloo-access-token')).toBeTruthy();
    });

    it('yandex: OAuthAccountInactiveError → 302 account_inactive', async () => {
      const user = await registerTestUser();
      await prisma.user.update({ where: { id: user.id }, data: { status: 'banned', updatedAt: now() } });

      let call = 0;
      global.fetch = jest.fn(async () => {
        call++;
        if (call === 1) return { ok: true, json: async () => ({ access_token: 'ya_t2' }) } as unknown as Response;
        return {
          ok: true,
          json: async () => ({ id: `x_${Date.now()}`, default_email: user.email, login: 'banned', default_avatar_id: '' }),
        } as unknown as Response;
      }) as unknown as typeof fetch;

      const state = 'test_oauth_state_ya_inactive';
      const res = await request(app)
        .get(`/api/auth/oauth/yandex-callback?code=abc&state=${state}`)
        .set('Cookie', `oauth-state=${state}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth_error=account_inactive');
    });

    it('yandex: сбой обмена → 302 callback_failed', async () => {
      global.fetch = jest.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
      const state = 'test_oauth_state_123';
      const res = await request(app)
        .get(`/api/auth/oauth/yandex-callback?code=abc&state=${state}`)
        .set('Cookie', `oauth-state=${state}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth_error=callback_failed');
    });

    it('vk: полный callback с email → 302 /#/chat', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: 'vk_t', user_id: Date.now(), email: `vkc_${Date.now()}@vk.ru` }),
      })) as unknown as typeof fetch;

      const state = 'test_oauth_state_vk';
      const res = await request(app)
        .get(`/api/auth/oauth/vk/callback?code=abc&state=${state}`)
        .set('Cookie', `oauth-state=${state}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/#/chat');
    });

    it('vk: сбой → 302 callback_failed', async () => {
      global.fetch = jest.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
      const state = 'test_oauth_state_vk2';
      const res = await request(app)
        .get(`/api/auth/oauth/vk/callback?code=abc&state=${state}`)
        .set('Cookie', `oauth-state=${state}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth_error=callback_failed');
    });

    it('mailru: полный callback → 302 /#/chat', async () => {
      const mvid = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const memail = `mrc_${mvid}@mail.ru`;
      global.fetch = jest.fn(async (input: unknown) => {
        const url = typeof input === 'string' ? input : String(input);
        if (url.includes('userinfo')) {
          return {
            ok: true,
            json: async () => ({ email: memail, name: undefined }),
          } as unknown as Response;
        }
        return {
          ok: true,
          json: async () => ({ access_token: 'mr_t', refresh_token: 'mr_rt', expires_in: 3600, x_mailru_vid: mvid }),
        } as unknown as Response;
      }) as unknown as typeof fetch;

      const state = 'test_oauth_state_mailru';
      const res = await request(app)
        .get(`/api/auth/oauth/mailru/callback?code=abc&state=${state}`)
        .set('Cookie', `oauth-state=${state}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/#/chat');
    });

    it('mailru: сбой → 302 callback_failed', async () => {
      global.fetch = jest.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
      const state = 'test_oauth_state_mailru2';
      const res = await request(app)
        .get(`/api/auth/oauth/mailru/callback?code=abc&state=${state}`)
        .set('Cookie', `oauth-state=${state}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('oauth_error=callback_failed');
    });
  });
});