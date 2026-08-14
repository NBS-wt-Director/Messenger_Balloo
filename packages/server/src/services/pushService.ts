// ============================================================
// Push Notification Service — WebSocket-based
// ============================================================
// Balloo использует self-hosted WebSocket для push-уведомлений
// (без Firebase Cloud Messaging)
//
// Принцип работы:
//   1. Мобильное приложение поддерживает постоянное WebSocket-соединение
//      (даже в фоне, через foreground service)
//   2. Сервер отправляет push-уведомления через открытый WebSocket-канал
//   3. Если приложение в фоне — WebSocket-соединение перехватывается
//      системой и показывается нативное уведомление
//
// Push-события отправляются из WebSocket-хаба (wsHub):
//   wsHub.sendToUser(userId, {
//     type: 'push',
//     payload: { title, body, data, ... }
//   });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
