// ChatList — список чатов
// Фильтры: все, личные, группы, каналы
// Search + list of ChatItem

import React from 'react';
import { useChatStore, type UserChat } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { ChatItem } from './ChatItem';
import { ChatSearch } from './ChatSearch';

export type ChatFilter = 'all' | 'personal' | 'groups' | 'channels';

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
}

export function ChatList({ onChatSelect }: ChatListProps) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const [filter, setFilter] = React.useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredChats = React.useMemo(() => {
    let result = chats;

    // Filter by type
    if (filter === 'personal') {
      result = result.filter((c) => c.type === 'direct');
    } else if (filter === 'groups') {
      result = result.filter((c) => c.type === 'group');
    } else if (filter === 'channels') {
      result = result.filter((c) => c.type === 'channel');
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then by last message time
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return bTime - aTime;
    });
  }, [chats, filter, searchQuery]);

  const filters: { key: ChatFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Все' },
    { key: 'personal', label: 'Личные' },
    { key: 'groups', label: 'Группы' },
    { key: 'channels', label: 'Каналы' },
  ];

  return (
    <div
      className="chat-list"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '320px',
        minWidth: '320px',
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Title */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Чаты
        </h2>

        {/* Search */}
        <ChatSearch onSearch={setSearchQuery} />

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '12px',
          }}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: filter === f.key ? 600 : 400,
                color: filter === f.key ? 'var(--accent)' : 'var(--text-muted)',
                background: filter === f.key ? 'var(--bg-hover)' : 'transparent',
                border: '1px solid ' + (filter === f.key ? 'var(--accent)' : 'var(--border-color)'),
                borderRadius: '0',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredChats.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            {searchQuery ? 'Чаты не найдены' : 'Нет чатов'}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              onClick={() => {
                setActiveChat(chat.id);
                onChatSelect?.(chat.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
