// Chat Store — Zustand
// Chats, messages, active chat, typing indicators

import { create } from 'zustand';
import type { Chat, Message, ChatType, UserRole } from '@balloo/shared';

export interface UserChat extends Chat {
  role?: UserRole;
  joinedAt: number;
  lastRead?: number;
  pinned: boolean;
  muted: boolean;
  unreadCount: number;
  lastMessage?: Message;
  description?: string;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  replyTo?: {
    id: string;
    sender?: { username: string; displayName?: string; avatarUrl?: string };
    content: string;
  };
  forwarded?: boolean;
  ai?: boolean;
  editHistory?: { old: string; new: string };
  reactions?: Array<{ emoji: string; userId: string }>;
  poll?: {
    question: string;
    options: Array<{ text: string; votes: number }>;
    votes?: number;
    anonymous?: boolean;
  };
  attachment?: {
    name?: string;
    size?: number;
    url?: string;
    thumbnail?: string;
    duration?: number;
    width?: number;
    height?: number;
  };
}

export interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface ChatState {
  // Chats
  chats: UserChat[];
  activeChatId: string | null;
  activeChat: UserChat | null;

  // Messages
  messages: Record<string, MessageWithSender[]>;
  messagesCursor: Record<string, string | null>;
  hasMoreMessages: Record<string, boolean>;

  // Typing indicators
  typingUsers: Record<string, TypingUser[]>;

  // UI state
  searchQuery: string;
  isSidebarOpen: boolean;
  isChatInfoOpen: boolean;

  // Actions — Chats
  setChats: (chats: UserChat[]) => void;
  addChat: (chat: UserChat) => void;
  updateChat: (chatId: string, updates: Partial<UserChat>) => void;
  removeChat: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;

  // Actions — Messages
  setMessages: (chatId: string, messages: MessageWithSender[]) => void;
  addMessage: (chatId: string, message: MessageWithSender) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<MessageWithSender>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setMessagesCursor: (chatId: string, cursor: string | null) => void;
  setHasMoreMessages: (chatId: string, hasMore: boolean) => void;

  // Actions — Typing
  setTypingUsers: (chatId: string, users: TypingUser[]) => void;
  addTypingUser: (chatId: string, user: TypingUser) => void;
  removeTypingUser: (chatId: string, userId: string) => void;

  // Actions — UI
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setChatInfoOpen: (isOpen: boolean) => void;

  // Utility
  getActiveChat: () => UserChat | null;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  // State
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

  // Chats
  setChats: (chats) => set({ chats }),

  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats.filter((c) => c.id !== chat.id)],
    })),

  updateChat: (chatId, updates) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, ...updates } : c
      ),
    })),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => id !== chatId)
      ),
    })),

  setActiveChat: (chatId) => {
    const chat = get().chats.find((c) => c.id === chatId) || null;
    set({ activeChatId: chatId, activeChat: chat, isChatInfoOpen: false });

    // Reset unread count
    if (chatId) {
      get().updateChat(chatId, { unreadCount: 0, lastRead: Date.now() });
    }
  },

  pinChat: (chatId) =>
    get().updateChat(chatId, { pinned: !get().chats.find((c) => c.id === chatId)?.pinned }),

  muteChat: (chatId) =>
    get().updateChat(chatId, { muted: !get().chats.find((c) => c.id === chatId)?.muted }),

  // Messages
  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter((m) => m.id !== messageId),
      },
    })),

  setMessagesCursor: (chatId, cursor) =>
    set((state) => ({
      messagesCursor: { ...state.messagesCursor, [chatId]: cursor },
    })),

  setHasMoreMessages: (chatId, hasMore) =>
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [chatId]: hasMore },
    })),

  // Typing
  setTypingUsers: (chatId, users) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [chatId]: users },
    })),

  addTypingUser: (chatId, user) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: [
          ...state.typingUsers[chatId]?.filter((u) => u.userId !== user.userId) || [],
          user,
        ],
      },
    })),

  removeTypingUser: (chatId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: state.typingUsers[chatId]?.filter((u) => u.userId !== userId) || [],
      },
    })),

  // UI
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setChatInfoOpen: (isOpen) => set({ isChatInfoOpen: isOpen }),

  // Utility
  getActiveChat: () => get().activeChat,
}));
