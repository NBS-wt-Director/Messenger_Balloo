// Тесты пустого чата (empty state) — тикет 1792137289
// Макет: mockups/balloo-su/empty-chat.html (принят 1.1.16 → 6.40).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getContacts = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: unknown[]) => {
      const endpoint = args[0] as string;
      if (endpoint.includes('/contacts')) return getContacts();
      return Promise.resolve([]);
    },
    getContacts: () => getContacts(),
    getChatInfo: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    reactToMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    archiveChat: vi.fn(),
  },
}));

const mockChats: any[] = [];

const mockStore = {
  chats: mockChats,
  activeChat: null,
  setActiveChat: vi.fn(),
  setMessages: vi.fn(),
  addMessage: vi.fn(),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
  setTypingUsers: vi.fn(),
  addChat: vi.fn(),
  pinChat: vi.fn(),
  muteChat: vi.fn(),
};

vi.mock('@/store/chatStore', () => ({
  useChatStore: Object.assign(
    (selector?: (s: any) => any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    },
    {
      getState: () => mockStore,
    }
  ),
}));

import ChatViewScreen from '../../screens/chat/ChatViewScreen';

const CONTACTS = [
  { id: 'u1', username: 'elena', displayName: 'Елена Волкова', avatarUrl: null, status: 'online' },
  { id: 'u2', username: 'igor', displayName: 'Игорь Попов', avatarUrl: null, status: 'online' },
];

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/chat']}>
      <ChatViewScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getContacts.mockResolvedValue(CONTACTS);
});

describe('ChatViewScreen — пустой чат (empty state)', () => {
  it('при отсутствии chatId показывает маскот 🐻', async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByTitle(/Балунишка/)).toBeInTheDocument(),
    );
  });

  it('показывает заголовок "Balloo Messenger"', async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('Balloo Messenger')).toBeInTheDocument(),
    );
  });

  it('показывает кнопки быстрых действий', async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('✏️ Новый чат')).toBeInTheDocument(),
    );
    expect(screen.getByText('👥 Создать группу')).toBeInTheDocument();
    expect(screen.getByText('📢 Создать канал')).toBeInTheDocument();
  });

  it('показывает секцию "Балунишка предлагает пообщаться"', async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText(/🐻 Балунишка предлагает пообщаться/)).toBeInTheDocument(),
    );
  });

  it('загружает контакты и показывает их', async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('Елена Волкова')).toBeInTheDocument(),
    );
    expect(screen.getByText('Игорь Попов')).toBeInTheDocument();
  });

  it('поиск фильтрует контакты', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Елена Волкова')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('🔍 Поиск человека...');
    fireEvent.change(searchInput, { target: { value: 'Игорь' } });

    await waitFor(() => expect(screen.getByText('Игорь Попов')).toBeInTheDocument());
    expect(screen.queryByText('Елена Волкова')).not.toBeInTheDocument();
  });

  it('контакты с существующими чатами скрыты', async () => {
    // Add a chat that has elena's contact
    mockChats.push({
      id: 'chat1',
      type: 'direct',
      name: 'Елена Волкова',
      memberIds: ['u1'],
      joinedAt: 0,
      pinned: false,
      muted: false,
      unreadCount: 0,
      createdAt: 0,
      updatedAt: 0,
    });

    renderScreen();

    await waitFor(() => expect(screen.getByText('Игорь Попов')).toBeInTheDocument());
    expect(screen.queryByText('Елена Волкова')).not.toBeInTheDocument();

    // Cleanup
    mockChats.length = 0;
  });
});
