import { serializeWsMessage, deserializeWsMessage } from '../ws/types';
import { handleWsMessage } from '../ws/handlers';
import type { AuthenticatedWebSocket } from '../ws/types';

// Create a mock AuthenticatedWebSocket
function createMockWs(): AuthenticatedWebSocket & { sentMessages: any[] } {
  const sentMessages: any[] = [];
  return {
    ws: {
      send: (data: string) => sentMessages.push(JSON.parse(data)),
      close: () => {},
      readyState: 1, // OPEN
    } as any,
    userId: 'test-user-id',
    email: 'test@test.balloo.ru',
    username: 'testuser',
    role: 'user',
    lastPing: Date.now(),
    connectedAt: Date.now(),
    sentMessages,
  } as any;
}

describe('WebSocket Types', () => {
  describe('serializeWsMessage', () => {
    it('serializes a ping message', () => {
      const msg = { type: 'ping' as const, timestamp: Date.now() };
      const serialized = serializeWsMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed.type).toBe('ping');
      expect(parsed.timestamp).toBe(msg.timestamp);
    });

    it('serializes a pong message', () => {
      const msg = { type: 'pong' as const, timestamp: Date.now() };
      const serialized = serializeWsMessage(msg);
      expect(JSON.parse(serialized).type).toBe('pong');
    });

    it('serializes a connected message', () => {
      const msg = { type: 'connected' as const, userId: 'user123', timestamp: Date.now() };
      const serialized = serializeWsMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed.type).toBe('connected');
      expect(parsed.userId).toBe('user123');
    });

    it('serializes an error message', () => {
      const msg = { type: 'error' as const, code: 'TEST_ERROR', message: 'Test error' };
      const serialized = serializeWsMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed.type).toBe('error');
      expect(parsed.code).toBe('TEST_ERROR');
      expect(parsed.message).toBe('Test error');
    });

    it('serializes a typing indicator', () => {
      const msg = {
        type: 'typing.indicator' as const,
        chatId: 'chat1',
        userId: 'user1',
        isTyping: true,
      };
      const serialized = serializeWsMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed.type).toBe('typing.indicator');
      expect(parsed.isTyping).toBe(true);
    });

    it('serializes a presence update broadcast', () => {
      const msg = {
        type: 'presence.update.broadcast' as const,
        userId: 'user1',
        status: 'online' as const,
      };
      const serialized = serializeWsMessage(msg);
      expect(JSON.parse(serialized).status).toBe('online');
    });
  });

  describe('deserializeWsMessage', () => {
    it('deserializes a message.send', () => {
      const data = JSON.stringify({
        type: 'message.send',
        chatId: 'chat1',
        content: 'Hello',
      });
      const msg = deserializeWsMessage(data);
      expect(msg.type).toBe('message.send');
    });

    it('deserializes a typing.start', () => {
      const data = JSON.stringify({
        type: 'typing.start',
        chatId: 'chat1',
      });
      const msg = deserializeWsMessage(data);
      expect(msg.type).toBe('typing.start');
    });

    it('deserializes a reaction.add', () => {
      const data = JSON.stringify({
        type: 'reaction.add',
        messageId: 'msg1',
        emoji: '👍',
      });
      const msg = deserializeWsMessage(data);
      expect(msg.type).toBe('reaction.add');
    });

    it('deserializes a presence.update', () => {
      const data = JSON.stringify({
        type: 'presence.update',
        status: 'away',
      });
      const msg = deserializeWsMessage(data);
      expect(msg.type).toBe('presence.update');
    });
  });
});

describe('WebSocket Handlers', () => {
  describe('handleWsMessage', () => {
    it('returns error for invalid JSON', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, 'not-valid-json');
      expect(mockWs.sentMessages.length).toBeGreaterThan(0);
      const errorMsg = mockWs.sentMessages[0];
      expect(errorMsg.type).toBe('error');
      expect(errorMsg.code).toBe('INVALID_JSON');
    });

    it('returns error for missing type field', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, JSON.stringify({ data: 'no type' }));
      expect(mockWs.sentMessages.length).toBeGreaterThan(0);
      const errorMsg = mockWs.sentMessages[0];
      expect(errorMsg.type).toBe('error');
      expect(errorMsg.code).toBe('MISSING_TYPE');
    });

    it('returns error for unknown message type', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, JSON.stringify({ type: 'unknown.type' }));
      expect(mockWs.sentMessages.length).toBeGreaterThan(0);
      const errorMsg = mockWs.sentMessages[0];
      expect(errorMsg.type).toBe('error');
      expect(errorMsg.code).toBe('UNKNOWN_TYPE');
    });

    it('handles typing.start without error', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, JSON.stringify({
        type: 'typing.start',
        chatId: 'test-chat-id',
      }));
      // typing.start should not send an error
      const errors = mockWs.sentMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBe(0);
    });

    it('handles typing.stop without error', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, JSON.stringify({
        type: 'typing.stop',
        chatId: 'test-chat-id',
      }));
      const errors = mockWs.sentMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBe(0);
    });

    it('handles presence.update without error', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, JSON.stringify({
        type: 'presence.update',
        status: 'online',
      }));
      const errors = mockWs.sentMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBe(0);
    });

    it('handles message.send with non-existent chat (returns error)', async () => {
      const mockWs = createMockWs();
      await handleWsMessage(mockWs, JSON.stringify({
        type: 'message.send',
        chatId: 'non-existent-chat',
        content: 'Hello',
      }));
      const errors = mockWs.sentMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('CHAT_NOT_FOUND');
    });
  });
});
