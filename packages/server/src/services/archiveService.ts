// archiveService.ts — Сервис для работы с архивом чатов
// Заглушка: поле archivedAt отсутствует в UserChat — используем pinned как флаг архива

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ArchivedChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: number;
  avatarUrl?: string;
  unreadCount: number;
}

// Получить список архивированных чатов (используем pinned как флаг)
export const getArchivedChats = async (userId: string) => {
  const userChats = await prisma.userChat.findMany({
    where: {
      userId,
      pinned: true,
    },
    include: {
      chat: true,
    },
    orderBy: { lastRead: 'desc' },
  });

  const chats: ArchivedChat[] = userChats.map((uc) => ({
    id: uc.chat.id,
    name: uc.chat.name || 'Без названия',
    lastMessage: '',
    lastMessageTime: Number(uc.lastRead || BigInt(Math.floor(Date.now() / 1000))),
    avatarUrl: uc.chat.avatarUrl || undefined,
    unreadCount: uc.unread,
  }));

  return { chats };
};

// Восстановить чат из архива
export const restoreChat = async (chatId: string, userId: string) => {
  await prisma.userChat.update({
    where: {
      userId_chatId: { userId, chatId },
    },
    data: { pinned: false },
  });

  return { message: 'Чат восстановлен' };
};

// Удалить чат из архива навсегда
export const deleteChatPermanently = async (chatId: string, userId: string) => {
  await prisma.userChat.deleteMany({
    where: {
      userId,
      chatId,
    },
  });

  return { message: 'Чат удалён' };
};

// Архивировать чат
export const archiveChat = async (chatId: string, userId: string) => {
  await prisma.userChat.update({
    where: {
      userId_chatId: { userId, chatId },
    },
    data: { pinned: true },
  });

  return { message: 'Чат архивирован' };
};
