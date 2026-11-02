// ============================================================
// Push Notification Service — WebSocket + VAPID Web Push
// ============================================================
// Balloo использует:
// 1. Self-hosted WebSocket для push-уведомлений (мобильные/десктоп)
// 2. VAPID Web Push (RFC 8030) для браузерных уведомлений
//
// Принцип работы WebSocket:
//   1. Мобильное приложение поддерживает постоянное WebSocket-соединение
//      (даже в фоне, через foreground service)
//   2. Сервер отправляет push-уведомления через открытый WebSocket-канал
//   3. Если приложение в фоне — WebSocket-соединение перехватывается
//      системой и показывается нативное уведомление
//
// Принцип работы VAPID Web Push (браузеры):
//   1. Пользователь разрешает push-уведомления в браузере
//   2. Сервер сохраняет push-подписку (endpoint, keys)
//   3. При событии сервер отправляет push через VAPID-ключи
//   4. Browser Service Worker показывает системное уведомление
//
// Push-события отправляются из WebSocket-хаба (wsHub):
//   wsHub.sendToUser(userId, {
//     type: 'push',
//     payload: { title, body, data, ... }
//   });

import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// ============================================================
// VAPID конфигурация
// ============================================================

// VAPID ключи из ENV (генерируются через generate-secrets.sh)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@balloo.su';

// Инициализация web-push (если ключи есть).
// web-push валидирует ключи синхронно и бросает исключение при ошибке. Вызов
// происходит на верхнем уровне модуля, а модуль импортируется через
// routes/index → devices → deviceController: любой бросок здесь останавливал
// весь процесс до httpServer.listen() (падение прода 02.11.2026). Push
// опционален, переписка — нет, поэтому ошибка ключей деградирует gracefully.
let vapidReady = false;

// Длина значения в байтах после base64url-декодирования (для diagnostic-лога;
// сами ключи в лог не пишутся).
const decodedBytes = (value: string): number => {
  try {
    return Buffer.from(value, 'base64url').length;
  } catch {
    return -1;
  }
};

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidReady = true;
    console.log('[Push] VAPID Web Push initialized');
  } catch (error) {
    console.error(
      '[Push] VAPID keys rejected by web-push — browser push notifications ' +
        'disabled, server startup continues. ' +
        `VAPID_PUBLIC_KEY=${decodedBytes(VAPID_PUBLIC_KEY)} bytes (need 65), ` +
        `VAPID_PRIVATE_KEY=${decodedBytes(VAPID_PRIVATE_KEY)} bytes (need 32). ` +
        `Reason: ${(error as Error).message}`
    );
  }
} else {
  console.warn('[Push] VAPID keys not set — browser push notifications disabled');
}

// Готов ли VAPID к отправке (ключи заданы и приняты web-push)
export const isVapidReady = (): boolean => vapidReady;

// ============================================================
// Интерфейсы
// ============================================================

export interface PushPayload {
  type: 'new_message' | 'story_available' | 'call_incoming' | 'poll_update' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  chatId?: string;
  messageId?: string;
  senderId?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface PushToken {
  userId: string;
  deviceId: string;
  token: string; // WebSocket session ID или push token
  platform: 'android' | 'ios';
  createdAt: number;
}

// Интерфейс push-подписки для браузера (локальный)
export interface BrowserPushSubscription {
  userId: string;
  endpoint: string;
  p256dh: string; // Public key for encryption
  auth: string;     // Auth secret
  createdAt: number;
}

// ============================================================
// Сохранение push-токена устройства
// ============================================================
// Каждое устройство регистрирует свой WebSocket session ID как push-токен

export const registerPushToken = async (
  userId: string,
  deviceId: string,
  platform: 'android' | 'ios',
  token: string
): Promise<void> => {
  const now = Math.floor(Date.now() / 1000);

  await prisma.device.update({
    where: { id: deviceId, userId },
    data: {
      pushToken: token,
      platform,
      lastActive: BigInt(now),
    },
  });
};

// ============================================================
// Отправка push-уведомления пользователю через WebSocket
// ============================================================
// Функция вызывается из WebSocket-хаба для отправки push

export const formatPushMessage = (
  payload: PushPayload
): string => {
  return JSON.stringify({
    type: 'push',
    subtype: payload.type,
    title: payload.title,
    body: payload.body,
    data: {
      ...payload.data,
      chatId: payload.chatId,
      messageId: payload.messageId,
      senderId: payload.senderId,
    },
    priority: payload.priority || 'normal',
    timestamp: Date.now(),
  });
};

// ============================================================
// Формирование push-уведомлений для разных событий
// ============================================================

export const newMessagePush = (
  senderName: string,
  chatName: string,
  messagePreview: string,
  chatId: string,
  messageId: string,
  senderId: string
): PushPayload => ({
  type: 'new_message',
  title: senderName,
  body: `${messagePreview}`,
  chatId,
  messageId,
  senderId,
  priority: 'high',
});

export const storyAvailablePush = (
  userName: string,
  userId: string
): PushPayload => ({
  type: 'story_available',
  title: 'Новая история',
  body: `У ${userName} появилась новая история`,
  senderId: userId,
  priority: 'normal',
});

export const callIncomingPush = (
  callerName: string,
  callType: 'audio' | 'video',
  chatId: string
): PushPayload => ({
  type: 'call_incoming',
  title: `Входящий ${callType === 'video' ? 'видеозвонок' : 'звонок'}`,
  body: `${callerName} звонит вам...`,
  chatId,
  priority: 'high',
  data: { callType },
});

export const systemNotificationPush = (
  title: string,
  body: string,
  data?: Record<string, any>
): PushPayload => ({
  type: 'system',
  title,
  body,
  data,
  priority: 'low',
});

// ============================================================
// Получение всех устройств пользователя для push
// ============================================================

export const getUserDevices = async (
  userId: string
): Promise<Array<{ id: string; platform: string; pushToken: string | null }>> => {
  const devices = await prisma.device.findMany({
    where: {
      userId,
      pushToken: { not: null },
    },
    select: {
      id: true,
      platform: true,
      pushToken: true,
    },
  });

  return devices as Array<{ id: string; platform: string; pushToken: string | null }>;
};

// ============================================================
// VAPID Web Push — браузерные push-уведомления
// ============================================================

// Сохранение push-подписки браузера
export const saveBrowserPushSubscription = async (
  userId: string,
  subscription: webpush.PushSubscription
): Promise<void> => {
  await prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: (subscription as any).keys?.p256dh || '',
      auth: (subscription as any).keys?.auth || '',
    },
  });
};

// Удаление push-подписки (отписка)
export const removeBrowserPushSubscription = async (
  userId: string,
  endpoint: string
): Promise<void> => {
  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });
};

// Отправка VAPID push-уведомления
export const sendVapidPush = async (
  subscription: webpush.PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    tag?: string;
  }
): Promise<void> => {
  if (!vapidReady) {
    console.warn('[Push] VAPID not configured (keys missing or invalid), skipping push');
    return;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('[Push] VAPID send failed:', error);
    // Удаляём неработающую подписку
    if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
      // Subscription expired — можно удалить из БД
    }
  }
};

// Отправка VAPID push всем подписанным пользователям
export const sendVapidPushToUsers = async (
  userIds: string[],
  payload: {
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, any>;
  }
): Promise<void> => {
  if (!vapidReady) {
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  for (const sub of subscriptions) {
    const webpushSub: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    await sendVapidPush(webpushSub, payload);
  }
};
