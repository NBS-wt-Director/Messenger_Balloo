// Тикет 1793791062 — клиентская половина realtime-доставки.
// Регрессия на расхождение контракта: ChatViewScreen слушал событие
// 'message.send', которого сервер не отправляет никогда (он шлёт
// 'message.received'), поэтому входящие сообщения появлялись только после
// перезагрузки страницы. Серверная половина покрыта
// packages/server/src/__tests__/ws-realtime.test.ts.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const addMessage = vi.fn();
const setMessages = vi.fn();
const setActiveChat = vi.fn();
const setTypingUsers = vi.fn();

const mockChats: any[] = [
  { id: 'c1', name: 'Тестовый чат', type: 'private', joinedAt: 0, pinned: false, muted: false, unreadCount: 0 },
];

const mockStore = {
  chats: mockChats,
  activeChat: mockChats[0],
  // MessageListVirtual читает s.messages[chatId] — без этого поля падает при
  // размонтировании дерева (unhandled error после теста).
  messages: {},
  typingUsers: {},
  setActiveChat,
  setMessages,
  addMessage,
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
  setTypingUsers,
  addChat: vi.fn(),
  pinChat: vi.fn(),
  muteChat: vi.fn(),
};

vi.mock('@/store/chatStore', () => ({
  useChatStore: Object.assign(
    (selector?: (s: any) => any) => (selector ? selector(mockStore) : mockStore),
    { getState: () => mockStore },
  ),
}));

vi.mock('@/services/api', () => ({
  api: {
    getChatInfo: vi.fn().mockResolvedValue({ id: 'c1', name: 'Тестовый чат', type: 'private' }),
    getMessages: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue({ id: 'm1', content: 'x', senderId: 'u1' }),
    reactToMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    archiveChat: vi.fn(),
  },
}));

// --- Мок WebSocket: компонент создаёт сокет сам, поэтому подписываемся на
// --- экземпляр и прокручиваем жизненный цикл вручную (open → сообщения).
// --- Класс повторяет тот минимум API, с которым работает ChatViewScreen:
// --- onopen/onmessage/onclose, send, close, readyState.
let sockets: MockWebSocket[] = [];

class MockWebSocket {
  static OPEN = 1;

  readyState = 1;
  sent: any[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    sockets.push(this);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

/** Ждёт, что компонент создал сокет, открывает его и ждёт chat.join. */
async function openSocket(): Promise<MockWebSocket> {
  await waitFor(() => expect(sockets.length).toBeGreaterThan(0));
  const sock = sockets[sockets.length - 1];
  sock.onopen?.();
  await waitFor(() => expect(sock.sent.length).toBeGreaterThan(0));
  return sock;
}

function deliver(sock: MockWebSocket, event: Record<string, unknown>) {
  sock.onmessage?.({ data: JSON.stringify(event) });
}

beforeEach(() => {
  vi.clearAllMocks();
  sockets = [];
  vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'ws-token' }) }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

import ChatViewScreen from '../../screens/chat/ChatViewScreen';

function renderChat() {
  return render(
    <MemoryRouter initialEntries={['/chat/c1']}>
      <Routes>
        <Route path="/chat/:chatId" element={<ChatViewScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChatViewScreen — realtime-доставка (тик. 1793791062)', () => {
  it('подключившись, подписывается на комнату чата событием chat.join', async () => {
    renderChat();
    const sock = await openSocket();

    expect(sock.sent[0]).toEqual({ type: 'chat.join', chatId: 'c1' });
    expect(sock.url).toContain('/ws/?token=ws-token');
  });

  it('событие message.received от сервера добавляет сообщение в стор', async () => {
    renderChat();
    const sock = await openSocket();

    deliver(sock, {
      type: 'message.received',
      chatId: 'c1',
      message: {
        id: 'm42',
        chatId: 'c1',
        content: 'Привет по WS',
        type: 'text',
        sender: { id: 'u2', username: 'bob', displayName: 'Боб', avatarUrl: null },
      },
    });

    await waitFor(() => expect(addMessage).toHaveBeenCalledTimes(1));
    const [chatIdArg, messageArg] = addMessage.mock.calls[0];
    expect(chatIdArg).toBe('c1');
    expect(messageArg.id).toBe('m42');
    expect(messageArg.content).toBe('Привет по WS');
    expect(messageArg.sender.username).toBe('bob');
  });

  it('message.received из другого чата игнорируется', async () => {
    renderChat();
    const sock = await openSocket();

    deliver(sock, {
      type: 'message.received',
      chatId: 'other',
      message: { id: 'm99', content: 'не сюда', sender: { id: 'u2', username: 'bob' } },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(addMessage).not.toHaveBeenCalled();
  });

  it('серверного события message.send не существует: на него реакция не нужна', async () => {
    // Регрессия на прежний код, который слушал 'message.send'. Если кто-то
    // вернёт этот case обратно, предыдущий тест всё равно зелёный — поэтому
    // здесь фиксируется, что событие с таким именем НЕ попадает в стор:
    // сервер его не отправляет (packages/server/src/ws/types.ts).
    renderChat();
    const sock = await openSocket();

    deliver(sock, {
      type: 'message.send',
      chatId: 'c1',
      message: { id: 'm1', content: 'призрачное событие', sender: { id: 'u2' } },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(addMessage).not.toHaveBeenCalled();
  });
});
