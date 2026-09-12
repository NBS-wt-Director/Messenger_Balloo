import { IncomingMessage } from 'http';
import { JwtPayload } from 'jsonwebtoken';

// ============================================================
// JWT payload для WebSocket аутентификации
// ============================================================

export interface WsJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  username?: string;
  role?: string;
  type: 'access';
}

// ============================================================
// Подключённый WebSocket с авторизованным пользователем
// ============================================================

export interface AuthenticatedWebSocket {
  ws: import('ws').WebSocket;
  userId: string;
  email: string;
  username?: string;
  role?: string;
  lastPing: number;
  connectedAt: number;
}

// ============================================================
// Запрос handshake с данными авторизованного пользователя
// (verifyClient заполняет wsUser, connection-хендлер читает его)
// ============================================================

export interface WsAuthedRequest extends IncomingMessage {
  wsUser?: {
    userId: string;
    email: string;
    username?: string;
    role?: string;
  };
}

// ============================================================
// Типы WebSocket сообщений (direction: client→server)
// ============================================================

export type WsMessageType =
  | 'message.send'
  | 'message.read'
  | 'typing.start'
  | 'typing.stop'
  | 'presence.update'
  | 'story.view'
  | 'reaction.add'
  | 'reaction.remove';

// ============================================================
// Входящие сообщения от клиента
// ============================================================

export interface WsMessageSend {
  type: 'message.send';
  chatId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'voice' | 'video' | 'poll' | 'system';
  replyToId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentWidth?: number;
  attachmentHeight?: number;
  attachmentDuration?: number;
}

export interface WsMessageRead {
  type: 'message.read';
  chatId: string;
  messageId: string;
  readAt: number;
}

export interface WsTypingStart {
  type: 'typing.start';
  chatId: string;
}

export interface WsTypingStop {
  type: 'typing.stop';
  chatId: string;
}

export interface WsPresenceUpdate {
  type: 'presence.update';
  status: 'online' | 'offline' | 'away';
}

export interface WsStoryView {
  type: 'story.view';
  storyId: string;
  viewedAt: number;
}

export interface WsReactionAdd {
  type: 'reaction.add';
  messageId: string;
  emoji: string;
}

export interface WsReactionRemove {
  type: 'reaction.remove';
  messageId: string;
  emoji: string;
}

// Union type всех входящих сообщений
export type WsIncomingMessage =
  | WsMessageSend
  | WsMessageRead
  | WsTypingStart
  | WsTypingStop
  | WsPresenceUpdate
  | WsStoryView
  | WsReactionAdd
  | WsReactionRemove;

// ============================================================
// Исходящие сообщения от сервера (server→client)
// ============================================================

export interface WsMessageSent {
  type: 'message.sent';
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: string;
  timestamp: number;
}

export interface WsMessageReceived {
  type: 'message.received';
  messageId: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: string;
  replyToId?: string;
  attachmentUrl?: string;
  timestamp: bigint;
}

export interface WsMessageReadUpdate {
  type: 'message.read.update';
  chatId: string;
  messageId: string;
  readerId: string;
  readAt: bigint;
}

export interface WsTypingIndicator {
  type: 'typing.indicator';
  chatId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
}

export interface WsPresenceUpdateBroadcast {
  type: 'presence.update.broadcast';
  userId: string;
  userName?: string;
  status: 'online' | 'offline' | 'away';
}

export interface WsStoryViewBroadcast {
  type: 'story.view.broadcast';
  storyId: string;
  viewerId: string;
  viewerName?: string;
  viewedAt: bigint;
}

export interface WsReactionUpdate {
  type: 'reaction.update';
  messageId: string;
  userId: string;
  emoji: string;
  action: 'add' | 'remove';
}

export interface WsChatNotification {
  type: 'chat.notification';
  chatId: string;
  chatName?: string;
  senderId: string;
  senderName?: string;
  preview?: string;
  timestamp: number;
}

export interface WsError {
  type: 'error';
  code: string;
  message: string;
}

export interface WsPing {
  type: 'ping';
  timestamp: number;
}

export interface WsPong {
  type: 'pong';
  timestamp: number;
}

export interface WsConnected {
  type: 'connected';
  userId: string;
  timestamp: number;
}

// Union type всех исходящих сообщений
export type WsOutgoingMessage =
  | WsMessageSent
  | WsMessageReceived
  | WsMessageReadUpdate
  | WsTypingIndicator
  | WsPresenceUpdateBroadcast
  | WsStoryViewBroadcast
  | WsReactionUpdate
  | WsChatNotification
  | WsError
  | WsPing
  | WsPong
  | WsConnected;

// ============================================================
// Утилитарные функции
// ============================================================

export const serializeWsMessage = (msg: WsOutgoingMessage): string =>
  JSON.stringify(msg);

export const deserializeWsMessage = (data: string): WsIncomingMessage =>
  JSON.parse(data) as WsIncomingMessage;
