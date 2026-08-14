import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Типы входных данных
// ============================================================

export interface SendMessageInput {
  chatId: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'poll' | 'system';
  content?: string;
  replyToId?: string;
  attachments?: Array<{
    type: string;
    url: string;
    thumbnail?: string;
    size?: number;
    name?: string;
    width?: number;
    height?: number;
    duration?: number;
  }>;
}

export interface UpdateMessageInput {
  content?: string;
}

export interface GetMessagesInput {
  chatId: string;
  cursor?: string; // messageId
  limit?: number;
  before?: BigInt; // timestamp
  after?: BigInt; // timestamp
  search?: string;
}

// ============================================================
// Вспомогательная функция: форматирование sender
// ============================================================

const formatSender = (user: any) => ({
  id: user.id,
  username: user.username,
  avatarUrl: user.avatarUrl,
  displayName: user.publicProfile?.displayName || user.username || '',
});

// ============================================================
// Отправка сообщения
// ============================================================

export const sendMessage = async (userId: string, input: SendMessageInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Проверка существования чата и принадлежности пользователя
  const membership = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId, chatId: input.chatId } },
    select: { role: true, muted: true },
  });

  if (!membership) {
    throw new Error('Вы не являетесь участником этого чата');
  }

  // Проверка, не замучен ли чат
  if (membership.muted) {
    throw new Error('Вы заблокировали уведомления в этом чате');
  }

  // Проверка replyTo
  if (input.replyToId) {
    const replyTo = await prisma.message.findUnique({
      where: { id: input.replyToId },
    });
    if (!replyTo || replyTo.chatId !== input.chatId) {
      throw new Error('Сообщение для ответа не найдено');
    }
  }

  // Создание сообщения с вложениями
  const message = await prisma.message.create({
    data: {
      chatId: input.chatId,
      senderId: userId,
      type: input.type as any,
      content: input.content || null,
      replyToId: input.replyToId || null,
      attachments: input.attachments && input.attachments.length > 0
        ? {
            create: input.attachments.map((att) => ({
              type: att.type,
              url: att.url,
              thumbnail: att.thumbnail || null,
              size: BigInt(att.size || 0),
              name: att.name || null,
              width: att.width || null,
              height: att.height || null,
              duration: att.duration || null,
            })),
          }
        : undefined,
      status: 'sent',
      createdAt: now,
      updatedAt: now,
    },
    include: {
      sender: {
        include: {
          publicProfile: {
            select: { displayName: true },
          },
        },
      },
      attachments: true,
      replyTo: {
        include: {
          sender: {
            include: {
              publicProfile: {
                select: { displayName: true },
              },
            },
          },
        },
      },
    },
  });

  // Обновление unread у всех участников чата (кроме отправителя)
  await prisma.userChat.updateMany({
    where: {
      chatId: input.chatId,
      userId: { not: userId },
    },
    data: {
      unread: { increment: 1 },
    },
  });

  // Обновление lastMessage у чата (для сортировки в списке чатов)
  await prisma.chat.update({
    where: { id: input.chatId },
    data: { updatedAt: now },
  });

  return {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    type: message.type,
    content: message.content,
    replyToId: message.replyToId,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          type: message.replyTo.type,
          content: message.replyTo.content,
          sender: formatSender(message.replyTo.sender),
        }
      : null,
    sender: formatSender(message.sender),
    attachments: message.attachments.map((att) => ({
      id: att.id,
      type: att.type,
      url: att.url,
      thumbnail: att.thumbnail,
      size: Number(att.size),
      name: att.name,
      width: att.width,
      height: att.height,
      duration: att.duration,
    })),
    editCount: message.editCount,
    deleted: message.deleted,
    status: message.status,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

// ============================================================
// Получение истории сообщений (cursor-based pagination)
// ============================================================

export const getMessages = async ({ chatId, cursor, limit = 50, before, after, search }: GetMessagesInput) => {
  // Проверка существования чата
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new Error('Чат не найден');
  }

  // Фильтры
  const where: Record<string, unknown> = { chatId, deleted: false };

  if (cursor) {
    // cursor — это messageId, ищем сообщения ДО этого сообщения
    const cursorMessage = await prisma.message.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });

    if (!cursorMessage) {
      throw new Error('Сообщение-курсор не найдено');
    }

    where.createdAt = {
      lt: cursorMessage.createdAt,
    };
  }

  if (before) {
    where.createdAt = { ...(where.createdAt as any), lt: before };
  }

  if (after) {
    where.createdAt = { ...(where.createdAt as any), gt: after };
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    where.content = {
      contains: search.trim(),
      mode: 'insensitive',
    };
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: {
        include: {
          publicProfile: {
            select: { displayName: true },
          },
        },
      },
      attachments: true,
      replyTo: {
        include: {
          sender: {
            include: {
              publicProfile: {
                select: { displayName: true },
              },
            },
          },
        },
      },
      _count: {
        select: { reactions: true },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit + 1, // берём +1 для определения hasNext
  });

  const hasMore = messages.length > limit;
  const sliced = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: sliced.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      sender: formatSender(msg.sender),
      type: msg.type,
      content: msg.content,
      replyToId: msg.replyToId,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            type: msg.replyTo.type,
            content: msg.replyTo.content,
            sender: formatSender(msg.replyTo.sender),
          }
        : null,
      attachments: msg.attachments.map((att) => ({
        id: att.id,
        type: att.type,
        url: att.url,
        thumbnail: att.thumbnail,
        size: Number(att.size),
        name: att.name,
        width: att.width,
        height: att.height,
        duration: att.duration,
      })),
      reactions: [], // TODO: загрузить реакции
      editCount: msg.editCount,
      deleted: msg.deleted,
      status: msg.status,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    })),
    pagination: {
      hasMore,
      nextCursor: hasMore ? sliced[sliced.length - 1]?.id : null,
      prevCursor: cursor || null,
      limit,
    },
  };
};

// ============================================================
// Редактирование сообщения
// ============================================================

export const updateMessage = async (userId: string, messageId: string, input: UpdateMessageInput) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  if (message.senderId !== userId) {
    throw new Error('Доступ запрещён: только автор может редактировать сообщение');
  }

  if (message.deleted) {
    throw new Error('Нельзя редактировать удалённое сообщение');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  await prisma.message.update({
    where: { id: messageId },
    data: {
      content: input.content ?? message.content,
      editCount: { increment: 1 },
      updatedAt: now,
    },
  });

  return {
    id: messageId,
    content: input.content ?? message.content,
    editCount: message.editCount + 1,
    updatedAt: now,
  };
};

// ============================================================
// Удаление сообщения
// ============================================================

export const deleteMessage = async (userId: string, messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  // Проверка: только автор или админ/модератор чата может удалить
  const isAuthor = message.senderId === userId;
  let isAdminOrMod = false;

  if (!isAuthor) {
    const membership = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId: message.chatId } },
      select: { role: true },
    });

    if (membership && ['admin', 'moderator', 'owner'].includes(membership.role)) {
      isAdminOrMod = true;
    }
  }

  if (!isAuthor && !isAdminOrMod) {
    throw new Error('Доступ запрещён');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  await prisma.message.update({
    where: { id: messageId },
    data: {
      deleted: true,
      content: '[Удалено]',
      updatedAt: now,
    },
  });

  return { message: 'Сообщение удалено' };
};

// ============================================================
// Реакции на сообщения
// ============================================================

export const addReaction = async (userId: string, messageId: string, emoji: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Проверяем, есть ли уже реакция от этого пользователя
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId: { messageId, userId } },
  });

  if (existing) {
    // Обновляем существующую реакцию
    const updated = await prisma.messageReaction.update({
      where: { messageId_userId: { messageId, userId } },
      data: { emoji, updatedAt: now },
    });
    return {
      id: updated.id,
      messageId: updated.messageId,
      userId: updated.userId,
      emoji: updated.emoji,
      createdAt: updated.createdAt,
    };
  }

  // Создаём новую реакцию
  const reaction = await prisma.messageReaction.create({
    data: {
      messageId,
      userId,
      emoji,
      createdAt: now,
      updatedAt: now,
    },
  });

  return {
    id: reaction.id,
    messageId: reaction.messageId,
    userId: reaction.userId,
    emoji: reaction.emoji,
    createdAt: reaction.createdAt,
  };
};

export const removeReaction = async (userId: string, messageId: string, emoji: string) => {
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId: { messageId, userId } },
  });

  if (!existing || existing.emoji !== emoji) {
    throw new Error('Реакция не найдена');
  }

  await prisma.messageReaction.delete({
    where: { messageId_userId: { messageId, userId } },
  });

  return { message: 'Реакция удалена' };
};

export const getReactions = async (messageId: string) => {
  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    include: {
      user: {
        include: {
          publicProfile: {
            select: { displayName: true },
          },
        },
      },
    },
  });

  return reactions.map((r) => ({
    id: r.id,
    messageId: r.messageId,
    userId: r.userId,
    user: formatSender(r.user),
    emoji: r.emoji,
    createdAt: r.createdAt,
  }));
};

// ============================================================
// Статус прочтения
// ============================================================

export const markAsRead = async (userId: string, messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Обновляем lastRead у участника чата
  await prisma.userChat.updateMany({
    where: {
      userId,
      chatId: message.chatId,
    },
    data: {
      lastRead: now,
      unread: 0,
    },
  });

  // Обновляем статус сообщения на "read"
  await prisma.message.update({
    where: { id: messageId },
    data: {
      status: 'read',
      updatedAt: now,
    },
  });

  return { message: 'Сообщение отмечено как прочитанное' };
};

export const getReadStatus = async (messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      chat: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  // Считаем уникальных читателей
  const readCount = await prisma.messageReadCount.count({
    where: { messageId },
  });

  return {
    messageId: message.id,
    status: message.status,
    readCount,
    totalRecipients: message.chat.members.length - 1, // минус отправитель
  };
};

// ============================================================
// Закрепление сообщения
// ============================================================

export const pinMessage = async (userId: string, messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  // Проверка прав
  const membership = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId, chatId: message.chatId } },
    select: { role: true },
  });

  if (!membership || !['owner', 'admin', 'moderator'].includes(membership.role)) {
    throw new Error('Доступ запрещён: только администратор может закреплять сообщения');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Сначала снимаем все закреплённые сообщения в чате
  await prisma.message.updateMany({
    where: { chatId: message.chatId, pinned: true },
    data: { pinned: false, updatedAt: now },
  });

  // Закрепляем новое
  const pinned = await prisma.message.update({
    where: { id: messageId },
    data: { pinned: true, updatedAt: now },
  });

  return {
    id: pinned.id,
    content: pinned.content,
    pinned: true,
    pinnedAt: now,
  };
};

// ============================================================
// Поиск по сообщениям
// ============================================================

export const searchMessages = async (chatId: string, query: string, limit = 20) => {
  if (!query || query.trim().length === 0) {
    return { messages: [], total: 0 };
  }

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      deleted: false,
      content: {
        contains: query.trim(),
        mode: 'insensitive',
      },
    },
    include: {
      sender: {
        include: {
          publicProfile: {
            select: { displayName: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return {
    messages: messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender: formatSender(msg.sender),
      type: msg.type,
      createdAt: msg.createdAt,
    })),
    total: messages.length,
  };
};
