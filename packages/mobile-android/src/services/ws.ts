// WebSocket Service — Mobile
// Real-time messaging, presence, typing indicators

import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3100/ws';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;
  private maxReconnectAttempts = 10;
  private reconnectAttempt = 0;
  private reconnectDelay = 1000; // starts at 1s, exponential backoff

  /**
   * Connect to WebSocket server with JWT auth
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = await AsyncStorage.getItem('balloo-accessToken');
    if (!token) {
      console.warn('[WS] No token available for connection');
      return;
    }

    this.disconnect();

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.isConnected = true;
        this.reconnectAttempt = 0;
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.dispatch(message.type, message.payload);
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code);
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect on intentional close
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempt = 0;
  }

  /**
   * Send a message through WebSocket
   */
  send(type: string, payload: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected, cannot send');
      return;
    }

    this.ws.send(JSON.stringify({ type, payload }));
  }

  /**
   * Subscribe to a message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Join a room (chat channel)
   */
  joinRoom(chatId: string): void {
    this.send('room.join', { chatId });
  }

  /**
   * Leave a room
   */
  leaveRoom(chatId: string): void {
    this.send('room.leave', { chatId });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    this.send(isTyping ? 'typing.start' : 'typing.stop', { chatId });
  }

  /**
   * Mark message as read
   */
  markAsRead(chatId: string, messageId: string): void {
    this.send('message.read', { chatId, messageId });
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'offline' | 'away'): void {
    this.send('presence.update', { status });
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Dispatch message to handlers
   */
  private dispatch(type: string, payload: any): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }

    // Also dispatch to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler({ type, payload }));
    }
  }

  /**
   * Schedule reconnect with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempt++;
    const delay = Math.min(this.reconnectDelay, 30000); // max 30s
    this.reconnectDelay *= 2; // exponential backoff

    console.log(
      `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Singleton instance
export const wsService = new WebSocketService();