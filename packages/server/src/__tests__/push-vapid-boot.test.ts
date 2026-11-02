/**
 * Тикет 1793615244 — страховка от падения прода 02.11.2026.
 *
 * `pushService.ts` вызывал `webpush.setVapidDetails()` на верхнем уровне модуля.
 * Модуль попадает в граф импортов запуска через
 * `routes/index.ts → routes/devices.ts → controllers/deviceController.ts`,
 * поэтому `Error: Vapid public key should be 65 bytes long when decoded.`
 * (VAPID_PUBLIC_KEY в `.env.production` — 32 байта вместо 65) останавливал
 * процесс до `httpServer.listen()`: `balloo-server` уходил в crash-loop.
 *
 * Проверки: битые ключи НЕ валят импорт модуля (push выключен, сервер жив),
 * корректная пара — push включён, отправка не блокируется.
 */
import webpush from 'web-push';

const ENV_KEYS = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'] as const;
const savedEnv: Record<string, string | undefined> = {};

type PushModule = typeof import('../services/pushService');

/** base64url без паддинга — как web-push хранит VAPID-ключи */
const toBase64Url = (bytes: Buffer): string => bytes.toString('base64url');

/** 32-байтное значение: ровно такая длина стоит в прод VAPID_PUBLIC_KEY (битая) */
const INVALID_PUBLIC_KEY = toBase64Url(Buffer.alloc(32, 7));
const VALID_PRIVATE_KEY = toBase64Url(Buffer.alloc(32, 3));
const VALID_PAIR = webpush.generateVAPIDKeys();

/** Загружает свежий модуль pushService с текущим process.env.
 *  Вместе с ним в той же изоляции требует 'web-push' — чтобы spying
 *  достался тому же экземпляру библиотеки, который использует сервис. */
const loadPushService = (): { mod: PushModule; wp: typeof webpush } => {
  let mod!: PushModule;
  let wp!: typeof webpush;
  jest.isolateModules(() => {
    wp = require('web-push');
    mod = require('../services/pushService');
  });
  return { mod, wp };
};

beforeAll(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('VAPID-инициализация не должна валить старт сервера (тик. 1793615244)', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('битый public key (32 байта) — импорт модуля проходит, push выключен', () => {
    process.env.VAPID_PUBLIC_KEY = INVALID_PUBLIC_KEY;
    process.env.VAPID_PRIVATE_KEY = VALID_PRIVATE_KEY;
    process.env.VAPID_SUBJECT = 'mailto:admin@balloo.su';

    const { mod } = loadPushService();

    expect(mod.isVapidReady()).toBe(false);
    // Причина в лог обязательно пишется — иначе деградация незаметна
    expect(consoleErrorSpy).toHaveBeenCalled();
    const message = String(consoleErrorSpy.mock.calls[0][0]);
    expect(message).toContain('VAPID keys rejected by web-push');
    expect(message).toContain('need 65');
  });

  it('битые ключи — sendVapidPush завершается без обращения к web-push', async () => {
    process.env.VAPID_PUBLIC_KEY = INVALID_PUBLIC_KEY;
    process.env.VAPID_PRIVATE_KEY = VALID_PRIVATE_KEY;

    const { mod, wp } = loadPushService();
    const sendSpy = jest
      .spyOn(wp, 'sendNotification')
      .mockImplementation(async () => ({}) as never);

    await expect(
      mod.sendVapidPush(
        { endpoint: 'https://example.push/serviceWorker', keys: { p256dh: 'a', auth: 'b' } },
        { title: 't', body: 'b' }
      )
    ).resolves.toBeUndefined();

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('битые ключи — sendVapidPushToUsers не идёт в БД за подписками', async () => {
    process.env.VAPID_PUBLIC_KEY = INVALID_PUBLIC_KEY;
    process.env.VAPID_PRIVATE_KEY = VALID_PRIVATE_KEY;

    const { mod } = loadPushService();
    await expect(mod.sendVapidPushToUsers(['u1'], { title: 't', body: 'b' })).resolves.toBeUndefined();
  });

  it('ключи не заданы — push выключен, старт проходит', () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const { mod } = loadPushService();

    expect(mod.isVapidReady()).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VAPID keys not set')
    );
  });

  it('корректная пара (public 65 байт) — push включён', () => {
    expect(Buffer.from(VALID_PAIR.publicKey, 'base64url').length).toBe(65);
    process.env.VAPID_PUBLIC_KEY = VALID_PAIR.publicKey;
    process.env.VAPID_PRIVATE_KEY = VALID_PAIR.privateKey;

    const { mod } = loadPushService();

    expect(mod.isVapidReady()).toBe(true);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
