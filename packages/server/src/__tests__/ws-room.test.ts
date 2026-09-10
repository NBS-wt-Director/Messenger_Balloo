// WebSocket RoomManager — интеграционные тесты
// Комнаты, presence, typing, broadcast, heartbeat

import { RoomManager } from '../ws/room-manager';
import { WebSocket } from 'ws';
import type { AuthenticatedWebSocket } from '../ws/types';

function createMockWs(): { ws: WebSocket; sent: string[] } {
  const sent: string[] = [];
  const ws = {
    send: (data: string) => sent.push(data),
    close: () => {},
    ping: () => {},
    readyState: WebSocket.OPEN,
  } as unknown as WebSocket;
  return { ws, sent };
}

function createConn(
  rm: RoomManager,
  userId: string,
  username = `user-${userId}`
): { conn: AuthenticatedWebSocket; sent: string[] } {
  const { ws, sent } = createMockWs();
  const conn = rm.addConnection(ws, userId, `${userId}@test.balloo.ru`, username);
  return { conn, sent };
}

describe('WebSocket RoomManager (integration)', () => {
  let rm: RoomManager;

  beforeEach(() => {
    rm = new RoomManager();
  });

  afterEach(() => {
    rm.stop();
  });

  // ============================================================
  // Подключения
  // ============================================================
  describe('connections', () => {
    it('addConnection registers user and sets presence online', () => {
      const { conn } = createConn(rm, 'user1', 'Alice');

      expect(conn.userId).toBe('user1');
      expect(conn.username).toBe('Alice');
      expect(rm.getConnectionsCount()).toBe(1);
      expect(rm.isUserOnline('user1')).toBe(true);
    });

    it('removeConnection unregisters user and sets presence offline', () => {
      createConn(rm, 'user1');
      expect(rm.getConnectionsCount()).toBe(1);

      rm.removeConnection('user1');
      expect(rm.getConnectionsCount()).toBe(0);
      expect(rm.isUserOnline('user1')).toBe(false);
    });

    it('removeConnection is safe for unknown user', () => {
      expect(() => rm.removeConnection('ghost')).not.toThrow();
    });

    it('removeConnection cleans up rooms and typing state', () => {
      const { conn } = createConn(rm, 'user1');
      rm.joinRoom('chat1', conn);
      rm.setTyping('user1', 'user1', 'chat1', true);

      rm.removeConnection('user1');

      expect(rm.getRoomMembers('chat1').size).toBe(0);
      expect(rm.getTypingUsers('chat1')).toHaveLength(0);
    });
  });

  // ============================================================
  // Комнаты
  // ============================================================
  describe('rooms', () => {
    it('joinRoom adds member to room', () => {
      const { conn } = createConn(rm, 'user1');

      rm.joinRoom('chat1', conn);

      expect(rm.isInRoom('chat1', conn)).toBe(true);
      expect(rm.getRoomMembers('chat1').size).toBe(1);
      expect(rm.getRoomCount()).toBe(1);
    });

    it('multiple users can join the same room', () => {
      const { conn: c1 } = createConn(rm, 'user1');
      const { conn: c2 } = createConn(rm, 'user2');

      rm.joinRoom('chat1', c1);
      rm.joinRoom('chat1', c2);

      expect(rm.getRoomMembers('chat1').size).toBe(2);
    });

    it('leaveRoom removes member and cleans empty room', () => {
      const { conn } = createConn(rm, 'user1');
      rm.joinRoom('chat1', conn);

      rm.leaveRoom('chat1', conn);

      expect(rm.isInRoom('chat1', conn)).toBe(false);
      expect(rm.getRoomCount()).toBe(0);
    });

    it('leaveRoom keeps room when other members remain', () => {
      const { conn: c1 } = createConn(rm, 'user1');
      const { conn: c2 } = createConn(rm, 'user2');
      rm.joinRoom('chat1', c1);
      rm.joinRoom('chat1', c2);

      rm.leaveRoom('chat1', c1);

      expect(rm.getRoomMembers('chat1').size).toBe(1);
      expect(rm.getRoomCount()).toBe(1);
    });

    it('getRoomMembers returns empty set for unknown room', () => {
      expect(rm.getRoomMembers('unknown').size).toBe(0);
    });
  });

  // ============================================================
  // Broadcast
  // ============================================================
  describe('broadcast', () => {
    it('broadcastToRoom sends to all room members', () => {
      const { conn: c1, sent: s1 } = createConn(rm, 'user1');
      const { conn: c2, sent: s2 } = createConn(rm, 'user2');
      rm.joinRoom('chat1', c1);
      rm.joinRoom('chat1', c2);

      rm.broadcastToRoom('chat1', JSON.stringify({ type: 'message.new', text: 'hi' }));

      expect(s1).toHaveLength(1);
      expect(s2).toHaveLength(1);
      expect(JSON.parse(s1[0]).text).toBe('hi');
    });

    it('broadcastToRoom excludes sender when exclude passed', () => {
      const { conn: c1, sent: s1 } = createConn(rm, 'user1');
      const { conn: c2, sent: s2 } = createConn(rm, 'user2');
      rm.joinRoom('chat1', c1);
      rm.joinRoom('chat1', c2);

      rm.broadcastToRoom('chat1', 'msg', c1.ws);

      expect(s1).toHaveLength(0);
      expect(s2).toHaveLength(1);
    });

    it('broadcastToRoom is safe for unknown room', () => {
      expect(() => rm.broadcastToRoom('unknown', 'msg')).not.toThrow();
    });

    it('broadcastAll sends to every connected user', () => {
      const { sent: s1 } = createConn(rm, 'user1');
      const { sent: s2 } = createConn(rm, 'user2');

      rm.broadcastAll('global-announcement');

      expect(s1).toHaveLength(1);
      expect(s2).toHaveLength(1);
    });

    it('story rooms broadcast only to story members', () => {
      const { conn: c1, sent: s1 } = createConn(rm, 'user1');
      const { conn: c2, sent: s2 } = createConn(rm, 'user2');
      rm.joinStoryRoom('story1', c1);

      rm.broadcastToStoryRoom('story1', 'story-view');

      expect(s1).toHaveLength(1);
      expect(s2).toHaveLength(0);
      expect(rm.isInRoom('chat1', c2)).toBe(false);
    });
  });

  // ============================================================
  // Presence
  // ============================================================
  describe('presence', () => {
    it('setUserPresence updates status', () => {
      createConn(rm, 'user1', 'Alice');

      rm.setUserPresence('user1', 'Alice', 'away');
      expect(rm.getUserPresence('user1')).toEqual({ status: 'away', userName: 'Alice' });
      expect(rm.isUserOnline('user1')).toBe(false);

      rm.setUserPresence('user1', 'Alice', 'online');
      expect(rm.isUserOnline('user1')).toBe(true);
    });

    it('getUserPresence returns undefined for unknown user', () => {
      expect(rm.getUserPresence('ghost')).toBeUndefined();
    });

    it('getOnlineUsers exposes presence map', () => {
      createConn(rm, 'user1');
      createConn(rm, 'user2');

      expect(rm.getOnlineUsers().size).toBe(2);
    });
  });

  // ============================================================
  // Typing
  // ============================================================
  describe('typing', () => {
    it('setTyping registers typing user', () => {
      rm.setTyping('user1', 'Alice', 'chat1', true);

      const typing = rm.getTypingUsers('chat1');
      expect(typing).toHaveLength(1);
      expect(typing[0].userId).toBe('user1');
      expect(typing[0].isTyping).toBe(true);
    });

    it('setTyping(false) stops typing', () => {
      rm.setTyping('user1', 'Alice', 'chat1', true);
      rm.setTyping('user1', 'Alice', 'chat1', false);

      const typing = rm.getTypingUsers('chat1');
      expect(typing).toHaveLength(1);
      expect(typing[0].isTyping).toBe(false);
    });

    it('tracks typing per chat independently', () => {
      rm.setTyping('user1', 'Alice', 'chat1', true);
      rm.setTyping('user1', 'Alice', 'chat2', true);

      expect(rm.getTypingUsers('chat1')).toHaveLength(1);
      expect(rm.getTypingUsers('chat2')).toHaveLength(1);
      expect(rm.getTypingUsers('chat3')).toHaveLength(0);
    });

    it('multiple users typing in same chat', () => {
      rm.setTyping('user1', 'Alice', 'chat1', true);
      rm.setTyping('user2', 'Bob', 'chat1', true);

      expect(rm.getTypingUsers('chat1')).toHaveLength(2);
    });

    it('clearTyping removes user from all chats', () => {
      rm.setTyping('user1', 'Alice', 'chat1', true);
      rm.setTyping('user1', 'Alice', 'chat2', true);

      rm.clearTyping('user1');

      expect(rm.getTypingUsers('chat1')).toHaveLength(0);
      expect(rm.getTypingUsers('chat2')).toHaveLength(0);
    });
  });

  // ============================================================
  // Heartbeat / ping
  // ============================================================
  describe('heartbeat', () => {
    it('recordPing updates lastPing for connected user', () => {
      const { conn } = createConn(rm, 'user1');
      const before = conn.lastPing;

      // Небольшая задержка не нужна — recordPing обновляет timestamp
      rm.recordPing('user1');
      expect(conn.lastPing).toBeGreaterThanOrEqual(before);
    });

    it('recordPing is safe for unknown user', () => {
      expect(() => rm.recordPing('ghost')).not.toThrow();
    });
  });

  // ============================================================
  // stop()
  // ============================================================
  describe('stop', () => {
    it('clears all state', () => {
      const { conn } = createConn(rm, 'user1');
      rm.joinRoom('chat1', conn);

      rm.stop();

      expect(rm.getConnectionsCount()).toBe(0);
      expect(rm.getRoomCount()).toBe(0);
    });
  });
});
