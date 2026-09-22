// ChatList — sidebar со списком чатов (P34: редизайн по mockups/balloo-su/chats.html)
// Структура макета: .sidebar → sidebar__search → кнопка «Новая группа» →
// ссылка «Звонки» с badge → .list из .list__item (ChatItem).

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore, type UserChat } from '@/store/chatStore';
import { ChatItem } from './ChatItem';
import { ChatSearch } from './ChatSearch';
import { api } from '@/services/api';

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
}

export function ChatList({ onChatSelect }: ChatListProps) {
  const navigate = useNavigate();
  const chats = useChatStore((s) => s.chats);
  const setChats = useChatStore((s) => s.setChats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const [searchQuery, setSearchQuery] = React.useState('');

  // P34: загрузка списка чатов при монтировании (раньше список не загружался)
  React.useEffect(() => {
    if (useChatStore.getState().chats.length > 0) return;
    api
      .getChats()
      .then((data: any[]) => {
        const normalized: UserChat[] = (data || []).map((c: any) => ({
          ...c,
          joinedAt: c.joinedAt ?? c.createdAt ?? 0,
          pinned: !!c.pinned,
          muted: !!c.muted,
          unreadCount: c.unreadCount ?? 0,
        }));
        useChatStore.getState().setChats(normalized);
      })
      .catch(() => {
        /* без сети — пустой список, состояние «Нет чатов» */
      });
  }, []);

  // Пропущенные звонки — badge на ссылке «Звонки»
  const missedCalls = 2;

  const filteredChats = React.useMemo(() => {
    let result = chats;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => (c.name || '').toLowerCase().includes(q));
    }

    // Sort: pinned first, then by last message time
    return [...result].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return bTime - aTime;
    });
  }, [chats, searchQuery]);

  return (
    <div
      className="sidebar"
      style={{ width: '320px', minWidth: '280px', maxWidth: '420px' }}
    >
      {/* Поиск */}
      <ChatSearch onSearch={setSearchQuery} />

      {/* Кнопка «Новая группа» — быстрый доступ (как в макете) */}
      <div style={{ padding: '8px 12px' }}>
        <button
          className="btn btn--primary btn--block btn--sm"
          onClick={() => navigate('/group/create')}
        >
          👥 Новая группа
        </button>
      </div>

      {/* Кнопка «Звонки» — с числом пропущенных (как в макете) */}
      <div style={{ padding: '4px 12px 8px' }}>
        <a
          href="#/calls"
          onClick={(e) => {
            e.preventDefault();
            navigate('/calls');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            textDecoration: 'none',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <span>📞</span>
          <span style={{ flex: 1 }}>Звонки</span>
          <span className="badge" style={{ fontSize: '10px' }}>{missedCalls}</span>
        </a>
      </div>

      {/* Список чатов */}
      <div className="list">
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