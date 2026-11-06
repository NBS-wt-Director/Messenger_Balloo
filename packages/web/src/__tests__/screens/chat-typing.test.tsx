// Тикет 1793873744 — индикатор «печатает» на клиенте.
// Прежний код web: (1) не отправлял typing.start вообще (состояние typingTimeout
// объявлено и не использовано), (2) слушал typing.start/typing.stop — имена,
// которых сервер не отправляет (он шлёт typing.indicator). Серверная половина
// покрыта packages/server/src/__tests__/ws-realtime.test.ts.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChatViewScreen from '../../screens/chat/ChatViewScreen';

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

async function openSocket(): Promise<MockWebSocket> {
  await waitFor(() => expect(sockets.length).toBeGreaterThan(0));
  const sock = sockets[sockets.length - 1];
  sock.onopen?.();
  await waitFor(() => expect(sock.sent.some((m) => m.type === 'chat.join')).toBe(true));
  return sock;
}

function deliver(sock: MockWebSocket, event: Record<string, unknown>) {
  sock.onmessage?.({ data: JSON.stringify(event) });
}

/** Все отправленные в сокет типы событий. */
function sentTypes(sock: MockWebSocket): string[] {
  return sock.sent.map((m) => m.type);
}

function renderChat() {
  return render(
    <MemoryRouter initialEntries={['/chat/c1']}>
      <Routes>
        <Route path="/chat/:chatId" element={<ChatViewScreen />} />
      </Routes>
    </MemoryRouter>,
  );
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

describe('ChatViewScreen — индикатор набора текста (тик. 1793873744)', () => {
  it('ввод текста отправляет typing.start в комнату', async () => {
    renderChat();
    const sock = await openSocket();

    const textarea = await waitFor(() => {
      const el = document.querySelector('textarea');
      expect(el).toBeTruthy();
      return el as HTMLTextAreaElement;
    });

    fireEvent.change(textarea, { target: { value: 'П' } });

    await waitFor(() =>
      expect(sock.sent).toContainEqual({ type: 'typing.start', chatId: 'c1' }),
    );
  });

  it('после простоя отправляется typing.stop (иначе индикатор висит у собеседника)', async () => {
    renderChat();
    const sock = await openSocket();

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Привет' } });
    await waitFor(() => expect(sentTypes(sock)).toContain('typing.start'));

    // Пауза дольше клиентского стоп-таймера.
    await new Promise((r) => setTimeout(r, 4_000));
    expect(sentTypes(sock)).toContain('typing.stop');
  });

  it('typing.indicator с isTyping=true показывает индикатор, isTyping=false убирает', async () => {
    renderChat();
    const sock = await openSocket();

    deliver(sock, {
      type: 'typing.indicator',
      chatId: 'c1',
      userId: 'u2',
      userName: 'bob',
      isTyping: true,
    });
    await waitFor(() => expect(setTypingUsers).toHaveBeenCalled());
    const [, users] = setTypingUsers.mock.calls.at(-1)!;
    expect(users).toEqual([{ userId: 'u2', username: 'bob' }]);

    setTypingUsers.mockClear();
    deliver(sock, {
      type: 'typing.indicator',
      chatId: 'c1',
      userId: 'u2',
      userName: 'bob',
      isTyping: false,
    });
    await waitFor(() => expect(setTypingUsers).toHaveBeenCalled());
    const [, cleared] = setTypingUsers.mock.calls.at(-1)!;
    expect(cleared).toEqual([]);
  });

  it('indicator другого чата игнорируется', async () => {
    renderChat();
    const sock = await openSocket();

    deliver(sock, {
      type: 'typing.indicator',
      chatId: 'other',
      userId: 'u2',
      userName: 'bob',
      isTyping: true,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(setTypingUsers).not.toHaveBeenCalled();
  });

  it('повторный ввод не плодит дубли typing.start (один start на сессию набора)', async () => {
    renderChat();
    const sock = await openSocket();

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'П' } });
    fireEvent.change(textarea, { target: { value: 'Пр' } });
    fireEvent.change(textarea, { target: { value: 'При' } });

    await waitFor(() => expect(sentTypes(sock)).toContain('typing.start'));
    expect(sentTypes(sock).filter((t) => t === 'typing.start')).toHaveLength(1);
  });
});
