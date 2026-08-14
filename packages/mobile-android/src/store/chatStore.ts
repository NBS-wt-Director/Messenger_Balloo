// Chat Store — Zustand (Mobile)
// Chats, messages, active chat state

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  online?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'poll' | 'system';
  content: string;
  replyToId?: string;
  createdAt: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  reactions?: string[];
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail?: string;
    size?: number;
    name?: string;
  }>;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  isTyping: Record<string, string[]>; // chatId -> usernames

  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  setTyping: (chatId: string, usernames: string[]) => void;
  clearChat: (chatId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: {},
      activeChatId: null,
      isTyping: {},

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
        })),

      setActiveChat: (chatId) => set({ activeChatId: chatId }),

      setMessages: (chatId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [chatId]: messages },
        })),

      addMessage: (chatId, message) =>
        set((state) => {
          const existing = state.messages[chatId] || [];
          // Avoid duplicates
          if (existing.some((m) => m.id === message.id)) {
            return state;
          }
          return {
            messages: {
              ...state.messages,
              [chatId]: [...existing, message],
            },
          };
        }),

      updateMessage: (chatId, messageId, updates) =>
        set((state) => {
          const messages = state.messages[chatId];
          if (!messages) return state;
          return {
            messages: {
              ...state.messages,
              [chatId]: messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
            },
          };
        }),

      setTyping: (chatId, usernames) =>
        set((state) => ({
          isTyping: { ...state.isTyping, [chatId]: usernames },
        })),

      clearChat: (chatId) =>
        set((state) => {
          const { [chatId]: _, ...rest } = state.messages;
          return { messages: rest };
        }),
    }),
    {
      name: 'balloo-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
      }),
    }
  )
);