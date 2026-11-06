/**
 * Реальная доставка сообщений по WebSocket — тикет 1793791062.
 *
 * В отличие от `ws-room.test.ts`, который вызывает `roomManager.joinRoom()`
 * напрямую и потому зелёный при полностью неработающей доставке, этот набор
 * идёт только по настоящему контракту: клиент подключается, шлёт `chat.join`,
 * отправляет сообщение (REST и WS) и **ждет события на сокете получателя**.
 *
 * Проверяет три независимых разрыва, найденных 04.11.2026:
 *  1. сервер не знает `chat.join` → комнаты чатов пустые → broadcast в никуда;
 *  2. REST `POST /api/chats/:id/messages` не делает broadcast вообще;
 *  3. WS `message.send` кладёт BigInt в JSON.stringify → INTERNAL_ERROR.
 */
import http from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import WebSocket from 'ws';
import { app } from '../app';
import { setupWebSocket } from '../ws';
import { registerTestUser, generateToken, TestUser } from './helpers';

jest.setTimeout(30_000);

let server: http.Server;
let port: number;

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      server = http.createServer(app);
      setupWebSocket(server);
      server.listen(0, '127.0.0.1', () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    })
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
);

interface TestSocket {
  ws: WebSocket;
  events: any[];
  /** Ждёт событие указанного типа; отбрасывает, если не дошло за timeout. */
  waitFor(type: string, timeout = 5_000): Promise<any>;
  send(payload: Record<string, unknown>): void;
  close(): void;
}

/** Подключение реального WS-клиента с access-токеном пользователя. */
function connect(user: TestUser): Promise<TestSocket> {
  const token = generateToken(user.id, user.email, user.username, 'user');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/?token=${token}`);
    const events: any[] = [];
    const waiters: Array<{ type: string; resolve: (v: any) => void; timer: NodeJS.Timeout }> = [];

    const testSocket: TestSocket = {
      ws,
      events,
      waitFor(type: string, timeout = 5_000) {
        const existing = events.find((e) => e.type === type);
        if (existing) return Promise.resolve(existing);
        return new Promise((res, rej) => {
          const timer = setTimeout(() => rej(new Error(`нет события '${type}' за ${timeout} мс`)), timeout);
          waiters.push({ type, resolve: res, timer });
        });
      },
      send(payload) {
        ws.send(JSON.stringify(payload));
      },
      close() {
        ws.close();
      },
    };

    ws.on('message', (raw) => {
      let parsed: any;
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        return;
      }
      events.push(parsed);
      for (let i = waiters.length - 1; i >= 0; i--) {
        if (waiters[i].type === parsed.type) {
          clearTimeout(waiters[i].timer);
          waiters[i].resolve(parsed);
          waiters.splice(i, 1);
        }
      }
    });

    // Сервер шлёт connected сразу после авторизации — это и есть факт
    // успешного подключения; без него тесты висели бы на таймауте.
    const onFirst = (raw: WebSocket.RawData) => {
      const parsed = JSON.parse(raw.toString());
      if (parsed.type === 'connected') {
        ws.off('message', onFirst);
        resolve(testSocket);
      }
    };
    ws.on('message', onFirst);
    ws.on('error', reject);
    setTimeout(() => reject(new Error('WS не подключился за 5 с')), 5_000);
  });
}

/** Групповой чат с двумя участниками, созданный через REST. */
async function createChatWithTwoMembers(a: TestUser, b: TestUser): Promise<string> {
  const created = await request(app)
    .post('/api/chats')
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send({ type: 'group', name: 'WS realtime' });

  if (created.status !== 201) {
    throw new Error(`чат не создан: ${created.status} ${JSON.stringify(created.body)}`);
  }

  const chatId = created.body.id;
  await request(app)
    .post(`/api/chats/${chatId}/members`)
    .set('Authorization', `Bearer ${a.accessToken}`)
    .send({ memberId: b.id });

  return chatId;
}

describe('WebSocket: подписка на комнату чата', () => {
  it('chat.join подтверждается событием chat.joined', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const sock = await connect(alice);
    try {
      sock.send({ type: 'chat.join', chatId });
      const ack = await sock.waitFor('chat.joined');
      expect(ack.chatId).toBe(chatId);
    } finally {
      sock.close();
    }
  });

  it('chat.join чужого чата не подписывает: join отклонён ошибкой', async () => {
    const alice = await registerTestUser();
    const stranger = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, stranger);

    const sock = await connect(alice);
    try {
      // bob в этот чат не добавлен — подписать его нельзя (IDOR по комнатам)
      const bob = await registerTestUser();
      const bobSock = await connect(bob);
      try {
        bobSock.send({ type: 'chat.join', chatId });
        const err = await bobSock.waitFor('error');
        expect(err.code).toBe('NOT_IN_CHAT');
      } finally {
        bobSock.close();
      }
    } finally {
      sock.close();
    }
  });
});

describe('WebSocket: доставка нового сообщения', () => {
  it('REST-отправка доставляет message.received получателю в комнате', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      const content = `realtime-${Date.now()}`;
      const sent = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${alice.accessToken}`)
        .send({ type: 'text', content });

      expect(sent.status).toBe(201);

      const received = await bobSock.waitFor('message.received');
      expect(received.chatId).toBe(chatId);
      // Клиент рисует событие по объекту сообщения (sender/username/content),
      // поэтому форма важна так же, как сам факт доставки.
      expect(received.message).toBeTruthy();
      expect(received.message.content).toBe(content);
      expect(received.message.sender.username).toBe(alice.username);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });

  it('WS-отправка: отправитель получает message.sent, получатель — message.received', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      const content = `ws-send-${Date.now()}`;
      aliceSock.send({ type: 'message.send', chatId, content, messageType: 'text' });

      const ack = await aliceSock.waitFor('message.sent');
      expect(ack.messageId).toBeTruthy();

      const received = await bobSock.waitFor('message.received');
      expect(received.message.content).toBe(content);

      // Регрессия на BigInt в serializeWsMessage: сервер не должен отвечать
      // INTERNAL_ERROR на корректную отправку.
      const errors = aliceSock.events.filter((e) => e.type === 'error');
      expect(errors).toHaveLength(0);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });

  it('отправитель не получает собственное сообщение обратно', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${alice.accessToken}`)
        .send({ type: 'text', content: `dedupe-${Date.now()}` });

      await bobSock.waitFor('message.received');
      // Свой сокет исключён: у Alice будет message.sent (для WS-пути) или
      // ничего, но не message.received.
      await new Promise((r) => setTimeout(r, 300));
      const echoed = aliceSock.events.filter((e) => e.type === 'message.received');
      expect(echoed).toHaveLength(0);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });

  it('получатель вне комнаты сообщения не видит', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob); // подключён, но chat.join не слал
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');

      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${alice.accessToken}`)
        .send({ type: 'text', content: `no-room-${Date.now()}` });

      await new Promise((r) => setTimeout(r, 500));
      expect(bobSock.events.filter((e) => e.type === 'message.received')).toHaveLength(0);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });
});

// ============================================================
// Индикатор набора текста (тик. 1793873744). Имена событий сервера:
// входящие typing.start / typing.stop, исходящее typing.indicator —
// клиент web слушал typing.start, которого сервер не отправляет.
// ============================================================

describe('WebSocket: индикатор «печатает»', () => {
  /** Ждёт typing.indicator с нужным флагом isTyping. */
  function waitForTyping(sock: TestSocket, isTyping: boolean, timeout = 5_000): Promise<any> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;
      const tick = () => {
        const hit = sock.events.find(
          (e) => e.type === 'typing.indicator' && e.isTyping === isTyping,
        );
        if (hit) return resolve(hit);
        if (Date.now() > deadline) {
          return reject(
            new Error(`нет typing.indicator isTyping=${isTyping} за ${timeout} мс`),
          );
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  it('typing.start от участника долетает второму в комнате как typing.indicator', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      aliceSock.send({ type: 'typing.start', chatId });

      const indicator = await waitForTyping(bobSock, true);
      expect(indicator.chatId).toBe(chatId);
      expect(indicator.userId).toBe(alice.id);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });

  it('typing.stop гасит индикатор у получателя (isTyping=false)', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      aliceSock.send({ type: 'typing.start', chatId });
      await waitForTyping(bobSock, true);
      aliceSock.send({ type: 'typing.stop', chatId });

      await waitForTyping(bobSock, false);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });

  it('без typing.stop сервер сам гасит индикатор (автостоп 5 с)', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      // Клиент «упал» сразу после start и typing.stop не шлёт никогда.
      aliceSock.send({ type: 'typing.start', chatId });
      await waitForTyping(bobSock, true);

      // Без рассылки автостопа индикатор остался бы гореть у получателя.
      await waitForTyping(bobSock, false, 6_500);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });

  it('отправитель не получает собственный индикатор', async () => {
    const alice = await registerTestUser();
    const bob = await registerTestUser();
    const chatId = await createChatWithTwoMembers(alice, bob);

    const aliceSock = await connect(alice);
    const bobSock = await connect(bob);
    try {
      aliceSock.send({ type: 'chat.join', chatId });
      bobSock.send({ type: 'chat.join', chatId });
      await aliceSock.waitFor('chat.joined');
      await bobSock.waitFor('chat.joined');

      aliceSock.send({ type: 'typing.start', chatId });
      await waitForTyping(bobSock, true);

      await new Promise((r) => setTimeout(r, 200));
      expect(aliceSock.events.filter((e) => e.type === 'typing.indicator')).toHaveLength(0);
    } finally {
      aliceSock.close();
      bobSock.close();
    }
  });
});
