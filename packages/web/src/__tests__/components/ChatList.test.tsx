import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatList } from '../../components/chat/ChatList';
import { useChatStore, type UserChat } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';

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

describe('ChatList', () => {
  beforeEach(() => {
    useChatStore.setState({
      chats: mockChats,
      activeChatId: null,
      activeChat: null,
      messages: {},
      messagesCursor: {},
      hasMoreMessages: {},
      typingUsers: {},
      searchQuery: '',
      isSidebarOpen: true,
      isChatInfoOpen: false,
    });
    useUIStore.setState({
      theme: 'dark',
      language: 'ru',
      isSidebarOpen: true,
      isRightPanelOpen: false,
      isSettingsOpen: false,
      isSearchOpen: false,
    });
  });

  it('renders title "Чаты"', () => {
    render(<ChatList />);
    expect(screen.getByText('Чаты')).toBeInTheDocument();
  });

  it('renders all filter tabs', () => {
    render(<ChatList />);
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('Личные')).toBeInTheDocument();
    expect(screen.getByText('Группы')).toBeInTheDocument();
    expect(screen.getByText('Каналы')).toBeInTheDocument();
  });

  it('renders all chats by default', () => {
    render(<ChatList />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Group Chat')).toBeInTheDocument();
    expect(screen.getByText('News Channel')).toBeInTheDocument();
  });

  it('filters to personal chats only', () => {
    render(<ChatList />);
    fireEvent.click(screen.getByText('Личные'));
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Group Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('News Channel')).not.toBeInTheDocument();
  });

  it('filters to groups only', () => {
    render(<ChatList />);
    fireEvent.click(screen.getByText('Группы'));
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Group Chat')).toBeInTheDocument();
    expect(screen.queryByText('News Channel')).not.toBeInTheDocument();
  });

  it('filters to channels only', () => {
    render(<ChatList />);
    fireEvent.click(screen.getByText('Каналы'));
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Group Chat')).not.toBeInTheDocument();
    expect(screen.getByText('News Channel')).toBeInTheDocument();
  });

  it('shows empty state when no chats', () => {
    useChatStore.setState({ chats: [] });
    render(<ChatList />);
    expect(screen.getByText('Нет чатов')).toBeInTheDocument();
  });

  it('filters chats by search query', () => {
    render(<ChatList />);
    const searchInput = screen.getByPlaceholderText(/поиск/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Group Chat')).not.toBeInTheDocument();
  });

  it('shows "Чаты не найдены" for no search results', () => {
    render(<ChatList />);
    const searchInput = screen.getByPlaceholderText(/поиск/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('Чаты не найдены')).toBeInTheDocument();
  });
});
