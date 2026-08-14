import { PrismaClient } from '@prisma/client';
import {
  AuthenticatedWebSocket,
  WsIncomingMessage,
  WsOutgoingMessage,
  WsMessageReceived,
  WsMessageRead,
  WsTypingStart,
  WsTypingStop,
  WsPresenceUpdate,
  WsStoryView,
  WsReactionAdd,
  WsReactionRemove,
  serializeWsMessage,
} from './types';
import { roomManager } from './room-manager';

const prisma = new PrismaClient();

// ============================================================
// Обработка входящих сообщений
// ============================================================

export const handleWsMessage = async (
  ws: AuthenticatedWebSocket,
  data: string
): Promise<void> => {
  let parsed: WsIncomingMessage;

  try {
    parsed = JSON.parse(data) as WsIncomingMessage;
  } catch {
    sendError(ws, 'INVALID_JSON', 'Неверный формат JSON');
    return;
  }

  // Валидация обязательных полей
  if (!parsed.type) {
    sendError(ws, 'MISSING_TYPE', 'Отсутствует поле type');
    return;
  }

  try {
    switch (parsed.type) {
      case 'message.send':
        await handleMessageSend(ws, parsed);
        break;

      case 'message.read':
        await handleMessageRead(ws, parsed);
        break;

      case 'typing.start':
        handleTypingStart(ws, parsed);
        break;

      case 'typing.stop':
        handleTypingStop(ws, parsed);
        break;

      case 'presence.update':
        handlePresenceUpdate(ws, parsed);
        break;

      case 'story.view':
        await handleStoryView(ws, parsed);
        break;

      case 'reaction.add':
        await handleReactionAdd(ws, parsed);
        break;

      case 'reaction.remove':
        await handleReactionRemove(ws, parsed);
        break;

      default:
        sendError(ws, 'UNKNOWN_TYPE', `Неизвестный тип сообщения: ${(parsed as any).type}`);
    }
  } catch (error) {
    console.error(`[WS] Error handling message type ${(parsed as any).type}:`, error);
    sendError(ws, 'INTERNAL_ERROR', 'Внутренняя ошибка сервера');
  }
};

// ============================================================
// message.send — отправка сообщения в чат
// ============================================================

const handleMessageSend = async (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'message.send' }
): Promise<void> => {
  const { chatId, content, messageType = 'text', replyToId } = msg;

  // Проверка: существует ли чат
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    sendError(ws, 'CHAT_NOT_FOUND', 'Чат не найден');
    return;
  }

  // Проверка: является ли пользователь участником чата
  const member = await prisma.userChat.findFirst({
    where: { userId: ws.userId, chatId },
  });

  if (!member) {
    sendError(ws, 'NOT_IN_CHAT', 'Вы не участник этого чата');
    return;
  }

  // Проверка: не заблокирован ли чат
  const chatSettings = await prisma.chatSettings.findUnique({
    where: { chatId },
  });

  if (chatSettings && !chatSettings.allowMessages) {
    sendError(ws, 'CHAT_MESSAGES_DISABLED', 'Отправка сообщений в этом чате запрещена');
    return;
  }

  // Создание сообщения в БД
  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: ws.userId,
      type: messageType,
      content,
      replyToId: replyToId || null,
      status: 'sent',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  // Формирование исходящего сообщения
  const outgoing: WsOutgoingMessage & { type: 'message.received' } = {
    type: 'message.received',
    messageId: message.id,
    chatId,
    senderId: ws.userId,
    senderName: ws.username,
    content,
    messageType,
    replyToId: replyToId || undefined,
    timestamp: message.createdAt,
  };

  // Broadcast всем участникам чата, кроме отправителя
  roomManager.broadcastToRoom(chatId, serializeWsMessage(outgoing), ws.ws);

  // Уведомление отправителю (подтверждение)
  const sentConfirmation: WsOutgoingMessage & { type: 'message.sent' } = {
    type: 'message.sent',
    messageId: message.id,
    chatId,
    senderId: ws.userId,
    content,
    messageType,
    timestamp: Number(message.createdAt),
  };
  ws.ws.send(serializeWsMessage(sentConfirmation));
};

// ============================================================
// message.read — отметка прочтения
// ============================================================

const handleMessageRead = async (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'message.read' }
): Promise<void> => {
  const { chatId, messageId } = msg;

  // Обновление lastRead у участника чата
  await prisma.userChat.updateMany({
    where: {
      userId: ws.userId,
      chatId,
    },
    data: {
      lastRead: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  // Broadcast всем в комнате
  const broadcast: WsOutgoingMessage & { type: 'message.read.update' } = {
    type: 'message.read.update',
    chatId,
    messageId,
    readerId: ws.userId,
    readAt: BigInt(Math.floor(Date.now() / 1000)),
  };

  roomManager.broadcastToRoom(chatId, serializeWsMessage(broadcast));
};

// ============================================================
// typing.start / typing.stop — индикатор набора
// ============================================================

const handleTypingStart = (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'typing.start' }
): void => {
  roomManager.setTyping(ws.userId, ws.username, msg.chatId, true);

  const indicator: WsOutgoingMessage & { type: 'typing.indicator' } = {
    type: 'typing.indicator',
    chatId: msg.chatId,
    userId: ws.userId,
    userName: ws.username,
    isTyping: true,
  };

  roomManager.broadcastToRoom(msg.chatId, serializeWsMessage(indicator), ws.ws);
};

const handleTypingStop = (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'typing.stop' }
): void => {
  roomManager.setTyping(ws.userId, ws.username, msg.chatId, false);

  const indicator: WsOutgoingMessage & { type: 'typing.indicator' } = {
    type: 'typing.indicator',
    chatId: msg.chatId,
    userId: ws.userId,
    userName: ws.username,
    isTyping: false,
  };

  roomManager.broadcastToRoom(msg.chatId, serializeWsMessage(indicator), ws.ws);
};

// ============================================================
// presence.update — статус онлайн/оффлайн
// ============================================================

const handlePresenceUpdate = (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'presence.update' }
): void => {
  // Обновление статуса пользователя
  roomManager.setUserPresence(ws.userId, ws.username, msg.status);

  // Broadcast всем подключённым (для обновления онлайн-статуса в списке контактов)
  const broadcast: WsOutgoingMessage & { type: 'presence.update.broadcast' } = {
    type: 'presence.update.broadcast',
    userId: ws.userId,
    userName: ws.username,
    status: msg.status,
  };

  roomManager.broadcastAll(serializeWsMessage(broadcast));
};

// ============================================================
// story.view — просмотр истории
// ============================================================

const handleStoryView = async (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'story.view' }
): Promise<void> => {
  const { storyId } = msg;

  // Проверка: существует ли история
  const story = await prisma.story.findUnique({
    where: { id: storyId },
  });

  if (!story) {
    sendError(ws, 'STORY_NOT_FOUND', 'История не найдена');
    return;
  }

  // Проверка: не истекла ли история
  if (story.expiresAt && BigInt(story.expiresAt) < BigInt(Math.floor(Date.now() / 1000))) {
    sendError(ws, 'STORY_EXPIRED', 'История истекла');
    return;
  }

  // Проверка: не записан ли уже просмотр
  const existingView = await prisma.storyView.findFirst({
    where: {
      storyId,
      viewerId: ws.userId,
    },
  });

  if (!existingView) {
    await prisma.storyView.create({
      data: {
        storyId,
        viewerId: ws.userId,
        viewedAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });

    // Обновление счётчика просмотров
    await prisma.story.update({
      where: { id: storyId },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  // Broadcast владельцу истории
  const broadcast: WsOutgoingMessage & { type: 'story.view.broadcast' } = {
    type: 'story.view.broadcast',
    storyId,
    viewerId: ws.userId,
    viewerName: ws.username,
    viewedAt: BigInt(Math.floor(Date.now() / 1000)),
  };

  roomManager.broadcastToRoom(`story:${storyId}`, serializeWsMessage(broadcast));
};

// ============================================================
// reaction.add / reaction.remove — реакции на сообщения
// ============================================================

const handleReactionAdd = async (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'reaction.add' }
): Promise<void> => {
  const { messageId, emoji } = msg;

  // Проверка: существует ли сообщение
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    sendError(ws, 'MESSAGE_NOT_FOUND', 'Сообщение не найдено');
    return;
  }

  // Создание/обновление реакции в БД
  await prisma.messageReaction.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId: ws.userId,
      },
    },
    create: {
      messageId,
      userId: ws.userId,
      emoji,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    },
    update: {
      emoji,
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  // Broadcast всем в комнате чата
  const broadcast: WsOutgoingMessage & { type: 'reaction.update' } = {
    type: 'reaction.update',
    messageId,
    userId: ws.userId,
    emoji,
    action: 'add',
  };

  roomManager.broadcastToRoom(message.chatId, serializeWsMessage(broadcast));
};

const handleReactionRemove = async (
  ws: AuthenticatedWebSocket,
  msg: WsIncomingMessage & { type: 'reaction.remove' }
): Promise<void> => {
  const { messageId, emoji } = msg;

  // Удаление реакции из БД
  await prisma.messageReaction.deleteMany({
    where: {
      messageId,
      userId: ws.userId,
      emoji,
    },
  });

  // Broadcast всем в комнате чата
  const broadcast: WsOutgoingMessage & { type: 'reaction.update' } = {
    type: 'reaction.update',
    messageId,
    userId: ws.userId,
    emoji,
    action: 'remove',
  };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (message) {
    roomManager.broadcastToRoom(message.chatId, serializeWsMessage(broadcast));
  }
};

// ============================================================
// Утилиты
// ============================================================

const sendError = (ws: AuthenticatedWebSocket, code: string, message: string): void => {
  const error: WsOutgoingMessage & { type: 'error' } = {
    type: 'error',
    code,
    message,
  };
  ws.ws.send(serializeWsMessage(error));
};
