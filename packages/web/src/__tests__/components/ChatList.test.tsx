import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatList } from '../../components/chat/ChatList';
import { useChatStore, type UserChat } from '../../store/chatStore';

const mockChats: UserChat[] = [
  {
    id: 'chat1',
    type: 'direct',
    name: 'Alice',
    createdAt: 1700000000,
    updatedAt: 1700000000,
    role: 'member',
    joinedAt: 1700000000,
    pinned: false,
    muted: false,
    unreadCount: 2,
  },
  {
    id: 'chat2',
    type: 'group',
    name: 'Group Chat',
    createdAt: 1700000001,
    updatedAt: 1700000001,
    role: 'member',
    joinedAt: 1700000001,
    pinned: true,
    muted: false,
    unreadCount: 0,
  },
  {
    id: 'chat3',
    type: 'channel',
    name: 'News Channel',
    createdAt: 1700000002,
    updatedAt: 1700000002,
    role: 'member',
    joinedAt: 1700000002,
    pinned: false,
    muted: true,
    unreadCount: 5,
  },
];

// P34: ChatList использует useNavigate — обёртка MemoryRouter
function renderChatList() {
  return render(
    <MemoryRouter>
      <ChatList />
    </MemoryRouter>
  );
}

describe('ChatList (P34: редизайн по mockups/balloo-su/chats.html)', () => {
  beforeEach(() => {
    useChatStore.setState({
      chats: mockChats,
      activeChatId: null,
      activeChat: null,
      currentUserId: null,
      messages: {},
      messagesCursor: {},
      hasMoreMessages: {},
      typingUsers: {},
      searchQuery: '',
      isSidebarOpen: true,
      isChatInfoOpen: false,
    });
  });

  it('renders search input by mockup placeholder', () => {
    renderChatList();
    expect(
      screen.getByPlaceholderText('🔍 Поиск чатов и людей...')
    ).toBeInTheDocument();
  });

  it('renders "Новая группа" quick-action button', () => {
    renderChatList();
    expect(screen.getByText('👥 Новая группа')).toBeInTheDocument();
  });

  it('renders "Звонки" link with missed-calls badge', () => {
    renderChatList();
    expect(screen.getByText('Звонки')).toBeInTheDocument();
  });

  it('renders all chats by default', () => {
    renderChatList();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Group Chat')).toBeInTheDocument();
    expect(screen.getByText('News Channel')).toBeInTheDocument();
  });

  it('renders group chip КОРП and channel chip СМИ (mockup chips)', () => {
    renderChatList();
    expect(screen.getByText('КОРП')).toBeInTheDocument();
    expect(screen.getByText('СМИ')).toBeInTheDocument();
  });

  it('renders unread badge counts', () => {
    renderChatList();
    // «2» — и badge звонков, и badge чата Alice (обе — валидные badge)
    const badgesWith2 = screen.getAllByText('2');
    expect(badgesWith2.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('marks active chat with list__item--active', () => {
    useChatStore.setState({ activeChatId: 'chat1' });
    const { container } = renderChatList();
    const active = container.querySelector('.list__item--active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('Alice');
  });

  it('renders chat items with octagon avatar markup (avatar--md + double border)', () => {
    const { container } = renderChatList();
    const avatar = container.querySelector(
      '.avatar.avatar--md.avatar--bordered.avatar--ctx-contact'
    );
    expect(avatar).not.toBeNull();
  });

  it('shows empty state when no chats', () => {
    useChatStore.setState({ chats: [] });
    renderChatList();
    expect(screen.getByText('Нет чатов')).toBeInTheDocument();
  });

  it('filters chats by search query', () => {
    renderChatList();
    const searchInput = screen.getByPlaceholderText(/поиск/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Group Chat')).not.toBeInTheDocument();
  });

  it('shows "Чаты не найдены" for no search results', () => {
    renderChatList();
    const searchInput = screen.getByPlaceholderText(/поиск/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('Чаты не найдены')).toBeInTheDocument();
  });
});
