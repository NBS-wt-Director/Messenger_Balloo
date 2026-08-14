import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, type UserChat, type MessageWithSender } from '../../store/chatStore';

const mockChat: UserChat = {
  id: 'chat1',
  type: 'direct',
  name: 'Test Chat',
  createdAt: 1700000000,
  updatedAt: 1700000000,
  role: 'member',
  joinedAt: 1700000000,
  pinned: false,
  muted: false,
  unreadCount: 0,
};

const mockMessage: MessageWithSender = {
  id: 'msg1',
  chatId: 'chat1',
  senderId: 'user1',
  type: 'text',
  content: 'Hello',
  editCount: 0,
  deleted: false,
  status: 'sent',
  createdAt: 1700000000,
  updatedAt: 1700000000,
};

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      chats: [],
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
  });

  it('starts with empty chats', () => {
    expect(useChatStore.getState().chats).toHaveLength(0);
  });

  it('setChats replaces chat list', () => {
    useChatStore.getState().setChats([mockChat]);
    expect(useChatStore.getState().chats).toHaveLength(1);
  });

  it('addChat adds a chat to the front', () => {
    useChatStore.getState().setChats([mockChat]);
    const newChat = { ...mockChat, id: 'chat2', name: 'Chat 2' };
    useChatStore.getState().addChat(newChat);
    expect(useChatStore.getState().chats).toHaveLength(2);
    expect(useChatStore.getState().chats[0].id).toBe('chat2');
  });

  it('addChat replaces existing chat with same id', () => {
    useChatStore.getState().setChats([mockChat]);
    const updatedChat = { ...mockChat, name: 'Updated' };
    useChatStore.getState().addChat(updatedChat);
    expect(useChatStore.getState().chats).toHaveLength(1);
    expect(useChatStore.getState().chats[0].name).toBe('Updated');
  });

  it('updateChat updates specific chat', () => {
    useChatStore.getState().setChats([mockChat]);
    useChatStore.getState().updateChat('chat1', { name: 'New Name' });
    expect(useChatStore.getState().chats[0].name).toBe('New Name');
  });

  it('removeChat removes chat and its messages', () => {
    useChatStore.getState().setChats([mockChat]);
    useChatStore.getState().setMessages('chat1', [mockMessage]);
    useChatStore.getState().removeChat('chat1');
    expect(useChatStore.getState().chats).toHaveLength(0);
    expect(useChatStore.getState().messages['chat1']).toBeUndefined();
  });

  it('setActiveChat sets active chat and resets unread', () => {
    const chat = { ...mockChat, unreadCount: 5 };
    useChatStore.getState().setChats([chat]);
    useChatStore.getState().setActiveChat('chat1');
    expect(useChatStore.getState().activeChatId).toBe('chat1');
    expect(useChatStore.getState().chats[0].unreadCount).toBe(0);
  });

  it('setActiveChat with null clears active chat', () => {
    useChatStore.getState().setChats([mockChat]);
    useChatStore.getState().setActiveChat('chat1');
    useChatStore.getState().setActiveChat(null);
    expect(useChatStore.getState().activeChatId).toBeNull();
  });

  it('pinChat toggles pinned state', () => {
    useChatStore.getState().setChats([mockChat]);
    useChatStore.getState().pinChat('chat1');
    expect(useChatStore.getState().chats[0].pinned).toBe(true);
    useChatStore.getState().pinChat('chat1');
    expect(useChatStore.getState().chats[0].pinned).toBe(false);
  });

  it('muteChat toggles muted state', () => {
    useChatStore.getState().setChats([mockChat]);
    useChatStore.getState().muteChat('chat1');
    expect(useChatStore.getState().chats[0].muted).toBe(true);
  });

  it('setMessages sets messages for a chat', () => {
    useChatStore.getState().setMessages('chat1', [mockMessage]);
    expect(useChatStore.getState().messages['chat1']).toHaveLength(1);
  });

  it('addMessage appends message to chat', () => {
    useChatStore.getState().setMessages('chat1', [mockMessage]);
    const newMsg = { ...mockMessage, id: 'msg2', content: 'World' };
    useChatStore.getState().addMessage('chat1', newMsg);
    expect(useChatStore.getState().messages['chat1']).toHaveLength(2);
  });

  it('updateMessage updates specific message', () => {
    useChatStore.getState().setMessages('chat1', [mockMessage]);
    useChatStore.getState().updateMessage('chat1', 'msg1', { content: 'Updated' });
    expect(useChatStore.getState().messages['chat1'][0].content).toBe('Updated');
  });

  it('deleteMessage removes message from chat', () => {
    useChatStore.getState().setMessages('chat1', [mockMessage]);
    useChatStore.getState().deleteMessage('chat1', 'msg1');
    expect(useChatStore.getState().messages['chat1']).toHaveLength(0);
  });

  it('setSearchQuery sets search query', () => {
    useChatStore.getState().setSearchQuery('test query');
    expect(useChatStore.getState().searchQuery).toBe('test query');
  });

  it('setChatInfoOpen sets chat info panel state', () => {
    useChatStore.getState().setChatInfoOpen(true);
    expect(useChatStore.getState().isChatInfoOpen).toBe(true);
  });

  it('addTypingUser adds typing user to chat', () => {
    useChatStore.getState().addTypingUser('chat1', { userId: 'user2', username: 'user2' });
    expect(useChatStore.getState().typingUsers['chat1']).toHaveLength(1);
  });

  it('removeTypingUser removes typing user from chat', () => {
    useChatStore.getState().addTypingUser('chat1', { userId: 'user2', username: 'user2' });
    useChatStore.getState().removeTypingUser('chat1', 'user2');
    expect(useChatStore.getState().typingUsers['chat1']).toHaveLength(0);
  });

  it('getActiveChat returns active chat', () => {
    useChatStore.getState().setChats([mockChat]);
    useChatStore.getState().setActiveChat('chat1');
    expect(useChatStore.getState().getActiveChat()?.id).toBe('chat1');
  });
});
