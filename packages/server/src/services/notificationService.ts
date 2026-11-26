// Уведомления пользователя (тикет 1795677854).
//
// Модель `Notification` в БД была, но REST/WS для неё не было вовсе —
// колокольчик показывал заглушку, а морзе-тикер подвала не имел источника.
// Здесь: запись уведомления + доставка онлайн-получателю кадром
// `notification.new`, список и отметка прочтения.

import { PrismaClient } from '@prisma/client';
import { roomManager } from '../ws/room-manager';
import { serializeWsMessage, type WsNotificationNew } from '../ws/types';

const prisma = new PrismaClient();

export type NotificationKind = 'chat' | 'group' | 'contact' | 'invite' | 'call' | 'update' | 'emergency';
export type NotificationPriority = 'notification' | 'update' | 'emergency';

const PRIORITY_BY_KIND: Record<NotificationKind, NotificationPriority> = {
  emergency: 'emergency',
  update: 'update',
  chat: 'notification',
  group: 'notification',
  contact: 'notification',
  invite: 'notification',
  call: 'notification',
};

const PREVIEW_LIMIT = 200;

export interface NotifyInput {
  userId: string;
  kind: NotificationKind;
  /** Левый тикер: источник (чат/группа/контакт/приглашение/вызов/обновление) */
  source: string;
  /** Правый тикер: тело уведомления */
  body: string;
  payload?: Record<string, unknown>;
}

/**
 * Пишет уведомление в БД и, если получатель онлайн, шлёт `notification.new`.
 * Ошибка доставки не должна ломать основной сценарий (сообщение отправлено).
 */
export const notifyUser = async (input: NotifyInput) => {
  const now = Date.now();
  const preview = input.body.slice(0, PREVIEW_LIMIT);

  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.kind,
      preview,
      payload: (input.payload ?? {}) as object,
      createdAt: BigInt(Math.floor(now / 1000)),
    },
  });

  const frame: WsNotificationNew = {
    type: 'notification.new',
    notificationId: row.id,
    kind: input.kind,
    source: input.source,
    body: preview,
    priority: PRIORITY_BY_KIND[input.kind] ?? 'notification',
    timestamp: now,
  };

  try {
    roomManager.sendToUser(input.userId, serializeWsMessage(frame));
  } catch {
    // Получатель офлайн / сокет закрыт — уведомление осталось в БД,
    // клиент дочитает его через GET /api/notifications.
  }

  return row;
};

/** Список уведомлений пользователя (новые первыми). */
export const listNotifications = async (userId: string, limit = 30) => {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      preview: r.preview,
      isRead: r.isRead,
      payload: r.payload ?? null,
      createdAt: r.createdAt,
    })),
    unread: rows.filter((r) => !r.isRead).length,
  };
};

/** Отметить прочитанным (свое — проверяется по userId в where). */
export const markNotificationRead = async (userId: string, notificationId: string) => {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  return result.count > 0;
};

/** Разослать обновление всем онлайн (service API, тик. 1795677854 шаг 7). */
export const announceUpdate = async (text: string) => {
  const online = Array.from(roomManager.getOnlineUsers().keys());
  let delivered = 0;

  for (const userId of online) {
    await notifyUser({ userId, kind: 'update', source: 'Обновление', body: text });
    delivered += 1;
  }

  return { online: online.length, delivered };
};
