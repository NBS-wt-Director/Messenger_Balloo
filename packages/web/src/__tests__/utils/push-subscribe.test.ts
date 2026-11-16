/**
 * Тикет 1794831100 (A.5): subscribeAndRegisterPush вызывается после логина.
 *
 * Мок pushManager в jsdom: проверка, что подписка создаётся и POST-ится на сервер.
 * На localhost (dev) — не вызывается (SW не зарегистрирован).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Мок api.post — перехватываем вызовы POST
const mockPost = vi.fn().mockResolvedValue({});

// Мок import.meta.env — VITE_VAPID_PUBLIC_KEY
vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BPublicVapidKeyTest1234567890abcdefghij');

// Мок navigator.serviceWorker
const mockSubscription = {
  endpoint: 'https://push.example.com/fake',
  keys: { p256dh: 'fake-p256dh', auth: 'fake-auth' },
  toJSON() {
    return { endpoint: this.endpoint, keys: this.keys };
  },
};

const mockPushManager = {
  subscribe: vi.fn().mockResolvedValue(mockSubscription),
  getSubscription: vi.fn().mockResolvedValue(null),
};

const mockRegistration = {
  pushManager: mockPushManager,
  scope: 'https://balloo.su/',
};

// Мок window.location.hostname (по умолчанию прод-хост)
let mockHostname = 'balloo.su';

beforeEach(() => {
  mockHostname = 'balloo.su';
  Object.defineProperty(window, 'location', {
    value: { hostname: mockHostname },
    writable: true,
  });

  // Мок navigator.serviceWorker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve(mockRegistration),
      register: vi.fn(),
      getRegistrations: vi.fn().mockResolvedValue([]),
    },
    writable: true,
    configurable: true,
  });

  // Мок Notification API
  Object.defineProperty(window, 'Notification', {
    value: {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    },
    writable: true,
    configurable: true,
  });

  // Мок PushManager in window
  (window as any).PushManager = class {};

  mockPost.mockResolvedValue({});
  mockPushManager.subscribe.mockResolvedValue(mockSubscription);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('subscribeAndRegisterPush', () => {
  it('на прод-хосте: подписывается и POST-ит на сервер', async () => {
    mockHostname = 'balloo.su';
    Object.defineProperty(window, 'location', {
      value: { hostname: mockHostname },
      writable: true,
    });

    const { subscribeAndRegisterPush } = await import('@/service-worker-registration');
    await subscribeAndRegisterPush(mockPost);

    expect(mockPushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    expect(mockPost).toHaveBeenCalledWith('/api/devices/browser-push', {
      endpoint: mockSubscription.endpoint,
      keys: mockSubscription.keys,
    });
  });

  it('на localhost: НЕ подписывается (SW не зарегистрирован)', async () => {
    mockHostname = 'localhost';
    Object.defineProperty(window, 'location', {
      value: { hostname: mockHostname },
      writable: true,
    });

    const { subscribeAndRegisterPush } = await import('@/service-worker-registration');
    await subscribeAndRegisterPush(mockPost);

    expect(mockPushManager.subscribe).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('если VITE_VAPID_PUBLIC_KEY пуст — пропускает без ошибки', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    mockHostname = 'balloo.su';
    Object.defineProperty(window, 'location', {
      value: { hostname: mockHostname },
      writable: true,
    });

    const { subscribeAndRegisterPush } = await import('@/service-worker-registration');
    await subscribeAndRegisterPush(mockPost);

    expect(mockPost).not.toHaveBeenCalled();
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BPublicVapidKeyTest1234567890abcdefghij');
  });
});
