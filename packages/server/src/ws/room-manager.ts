import { WebSocket } from 'ws';
import { AuthenticatedWebSocket } from './types';

// ============================================================
// Менеджер комнат (rooms) и presence
// ============================================================

type RoomId = string;
type UserId = string;

interface TypingState {
  userId: UserId;
  userName?: string;
  isTyping: boolean;
  lastTypingAt: number;
}

export class RoomManager {
  // chatId → Set подключённых WebSocket
  private rooms: Map<RoomId, Set<AuthenticatedWebSocket>> = new Map();

  // storyId → Set подключённых WebSocket
  private storyRooms: Map<RoomId, Set<AuthenticatedWebSocket>> = new Map();

  // userId → AuthenticatedWebSocket
  private connections: Map<UserId, AuthenticatedWebSocket> = new Map();

  // userId → статус presence
  private presence: Map<UserId, { status: 'online' | 'offline' | 'away'; userName?: string }> = new Map();

  // chatId → Map<userId, TypingState>
  private typing: Map<RoomId, Map<UserId, TypingState>> = new Map();

  // Heartbeat interval
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout = 30_000; // 30 секунд

  constructor() {
    this.startHeartbeat();
  }

  // ============================================================
  // Подключение / отключение
  // ============================================================

  public addConnection(ws: WebSocket, userId: string, email: string, username?: string, role?: string): AuthenticatedWebSocket {
    const authedWs: AuthenticatedWebSocket = {
      ws,
      userId,
      email,
      username,
      role,
      lastPing: Date.now(),
      connectedAt: Date.now(),
    };

    this.connections.set(userId, authedWs);
    this.presence.set(userId, { status: 'online', userName: username });

    return authedWs;
  }

  public removeConnection(userId: string): void {
    const conn = this.connections.get(userId);
    if (!conn) return;

    // Удалить из всех комнат
    for (const [roomId, members] of this.rooms.entries()) {
      members.delete(conn);
      if (members.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    for (const [roomId, members] of this.storyRooms.entries()) {
      members.delete(conn);
      if (members.size === 0) {
        this.storyRooms.delete(roomId);
      }
    }

    this.connections.delete(userId);
    this.presence.set(userId, { status: 'offline', userName: conn.username });
    this.clearTyping(userId);

    // Закрыть WebSocket если ещё открыт
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.close(1000, 'Server disconnect');
    }
  }

  // ============================================================
  // Комнаты по chatId
  // ============================================================

  public joinRoom(chatId: string, authedWs: AuthenticatedWebSocket): void {
    if (!this.rooms.has(chatId)) {
      this.rooms.set(chatId, new Set());
    }
    this.rooms.get(chatId)!.add(authedWs);
  }

  public leaveRoom(chatId: string, authedWs: AuthenticatedWebSocket): void {
    const room = this.rooms.get(chatId);
    if (room) {
      room.delete(authedWs);
      if (room.size === 0) {
        this.rooms.delete(chatId);
      }
    }
  }

  public getRoomMembers(chatId: string): Set<AuthenticatedWebSocket> {
    return this.rooms.get(chatId) || new Set();
  }

  public isInRoom(chatId: string, authedWs: AuthenticatedWebSocket): boolean {
    const room = this.rooms.get(chatId);
    return room?.has(authedWs) ?? false;
  }

  // ============================================================
  // Комнаты по storyId
  // ============================================================

  public joinStoryRoom(storyId: string, authedWs: AuthenticatedWebSocket): void {
    const key = `story:${storyId}`;
    if (!this.storyRooms.has(key)) {
      this.storyRooms.set(key, new Set());
    }
    this.storyRooms.get(key)!.add(authedWs);
  }

  public broadcastToRoom(roomId: string, message: string, exclude?: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const member of room) {
      if (exclude && member.ws === exclude) continue;
      if (member.ws.readyState === WebSocket.OPEN) {
        member.ws.send(message);
      }
    }
  }

  public broadcastToStoryRoom(storyId: string, message: string): void {
    const key = `story:${storyId}`;
    const room = this.storyRooms.get(key);
    if (!room) return;

    for (const member of room) {
      if (member.ws.readyState === WebSocket.OPEN) {
        member.ws.send(message);
      }
    }
  }

  // ============================================================
  // Глобальный broadcast
  // ============================================================

  public broadcastAll(message: string): void {
    for (const [, conn] of this.connections) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    }
  }

  // ============================================================
  // Presence
  // ============================================================

  public setUserPresence(userId: string, userName?: string, status: 'online' | 'offline' | 'away' = 'online'): void {
    this.presence.set(userId, { status, userName });
  }

  public getUserPresence(userId: string): { status: 'online' | 'offline' | 'away'; userName?: string } | undefined {
    return this.presence.get(userId);
  }

  public isUserOnline(userId: string): boolean {
    const p = this.presence.get(userId);
    return p?.status === 'online';
  }

  public getOnlineUsers(): Map<UserId, { status: 'online' | 'offline' | 'away'; userName?: string }> {
    return this.presence;
  }

  // ============================================================
  // Typing indicators
  // ============================================================

  public setTyping(userId: string, userName: string | undefined, chatId: string, isTyping: boolean): void {
    if (!this.typing.has(chatId)) {
      this.typing.set(chatId, new Map());
    }

    const chatTyping = this.typing.get(chatId)!;
    chatTyping.set(userId, {
      userId,
      userName,
      isTyping,
      lastTypingAt: Date.now(),
    });

    // Автостоп через 5 секунд
    if (isTyping) {
      setTimeout(() => {
        this.setTyping(userId, userName, chatId, false);
      }, 5000);
    }
  }

  public clearTyping(userId: string): void {
    for (const [, chatTyping] of this.typing.entries()) {
      chatTyping.delete(userId);
    }
  }

  public getTypingUsers(chatId: string): TypingState[] {
    const chatTyping = this.typing.get(chatId);
    if (!chatTyping) return [];

    // Удалить истёкшие (5 сек)
    const now = Date.now();
    for (const [uid, state] of chatTyping.entries()) {
      if (now - state.lastTypingAt > 5000) {
        chatTyping.delete(uid);
      }
    }

    return Array.from(chatTyping.values());
  }

  // ============================================================
  // Heartbeat (ping/pong)
  // ============================================================

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [, conn] of this.connections) {
        const elapsed = now - conn.lastPing;
        if (elapsed > this.heartbeatTimeout) {
          // Таймаут — закрыть connection
          if (conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.close(1001, 'Heartbeat timeout');
          }
          this.removeConnection(conn.userId);
        } else {
          // Отправить ping
          if (conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.ping();
          }
        }
      }
    }, 15000); // Проверка каждые 15 секунд
  }

  public recordPing(userId: string): void {
    const conn = this.connections.get(userId);
    if (conn) {
      conn.lastPing = Date.now();
    }
  }

  // ============================================================
  // Утилиты
  // ============================================================

  public getConnectionsCount(): number {
    return this.connections.size;
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Закрыть все подключения
    for (const [, conn] of this.connections) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.close(1000, 'Server shutdown');
      }
    }
    this.connections.clear();
    this.rooms.clear();
    this.storyRooms.clear();
    this.presence.clear();
    this.typing.clear();
  }
}

export const roomManager = new RoomManager();
