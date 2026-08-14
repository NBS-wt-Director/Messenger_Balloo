import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedWebSocket, WsIncomingMessage, serializeWsMessage } from './types';
import { handleWsMessage } from './handlers';
import { roomManager } from './room-manager';

// ============================================================
// Инициализация WebSocket сервера
// ============================================================

export function setupWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({
    server,
    path: '/ws/',
    verifyClient: verifyClient as any,
  });

  // Подключение
  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const authedWs = ws as unknown as AuthenticatedWebSocket;

    // Извлечение user info из verifiedData (установлено в verifyClient)
    if (!authedWs.userId) {
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Добавление в менеджер комнат
    roomManager.addConnection(ws, authedWs.userId, authedWs.email, authedWs.username, authedWs.role);

    console.log(`[WS] Connection from user ${authedWs.userId} (${authedWs.email})`);

    // Join в комнату presence для получения обновлений статуса
    roomManager.joinRoom('presence:global', authedWs);

    // Отправка подтверждения подключения
    ws.send(
      serializeWsMessage({
        type: 'connected',
        userId: authedWs.userId,
        timestamp: Date.now(),
      } as any)
    );

    // Обработка входящих сообщений
    ws.on('message', (data: string | Buffer | ArrayBuffer | Buffer[]) => {
      const message = data.toString();

      // Ping от клиента
      if (message === 'ping') {
        roomManager.recordPing(authedWs.userId);
        ws.send('pong');
        return;
      }

      try {
        const parsed: any = JSON.parse(message);

        // Ping от клиента (JSON)
        if (parsed.type === 'ping') {
          roomManager.recordPing(authedWs.userId);
          const pong = { type: 'pong' as const, timestamp: Date.now() };
          ws.send(serializeWsMessage(pong));
          return;
        }

        handleWsMessage(authedWs, message);
      } catch (error) {
        console.error('[WS] Error parsing message:', error);
        ws.send(
          serializeWsMessage({
            type: 'error',
            code: 'PARSE_ERROR',
            message: 'Ошибка разбора сообщения',
          } as any)
        );
      }
    });

    // Pong от клиента (обработка heartbeat)
    ws.on('pong', () => {
      roomManager.recordPing(authedWs.userId);
    });

    // Отключение
    ws.on('close', (code: number, reason: Buffer) => {
      console.log(`[WS] Connection closed from user ${authedWs.userId}: code=${code}, reason=${reason.toString()}`);
      roomManager.removeConnection(authedWs.userId);
    });

    // Ошибки
    ws.on('error', (error: Error) => {
      console.error(`[WS] Error for user ${authedWs.userId}:`, error.message);
      roomManager.removeConnection(authedWs.userId);
    });
  });

  // Ошибки сервера
  wss.on('error', (error: Error) => {
    console.error('[WS] Server error:', error);
  });

  console.log('[WS] WebSocket server initialized on /ws/');
}

// ============================================================
// Верификация подключения (JWT auth в query param)
// ============================================================

interface QueryParams {
  token?: string;
  [key: string]: string | undefined;
}

function verifyClient(info: { origin: string; url: URL; req: IncomingMessage }, callback: (ready: boolean, code?: number, message?: string) => void): void {
  const url = info.url;
  const token = url.searchParams.get('token') || (url as any).query?.token;

  if (!token) {
    console.log('[WS] Connection rejected: no token');
    callback(false, 1008, 'Authentication required');
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    if (decoded.type !== 'access') {
      console.log('[WS] Connection rejected: invalid token type');
      callback(false, 1008, 'Invalid token type');
      return;
    }

    // Проверка, что пользователь существует и активен
    // (оптимизация: проверяем только при необходимости, т.к. это adds DB call per connection)
    // В продакшене можно кэшировать активные токены в Redis

    // Добавляем decoded в ws для последующего использования
    (info.req as any).wsUser = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    callback(true);
  } catch (error) {
    console.log('[WS] Connection rejected: invalid token');
    callback(false, 1008, 'Invalid or expired token');
  }
}
