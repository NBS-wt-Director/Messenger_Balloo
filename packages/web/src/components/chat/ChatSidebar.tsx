// ChatSidebar — sidebar для внутреннего чата Command
// Список каналов (#разработка, #общий) и личных сообщений

import { useState } from 'react';

interface LastMessage {
  senderName: string;
  content: string;
  timestamp: number;
}

interface ChatItem {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  avatarUrl?: string | null;
  unreadCount: number;
  lastMessage?: LastMessage;
}

interface ChatSidebarProps {
  channels: ChatItem[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onSearch: (query: string) => void;
}

// Generate initials for avatar
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Format timestamp to HH:MM
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function ChatSidebar({ channels, activeChatId, onSelectChat, onSearch }: ChatSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = channels.filter((ch) => ch.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="sidebar">
      <div className="sidebar__search">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Поиск чатов..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>
      <div className="list">
        {filtered.map((chat) => (
          <div
            key={chat.id}
            className={`list__item ${chat.id === activeChatId ? 'list__item--active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
              <div className="avatar__inner">
                <span>{getInitials(chat.name.replace('#', ''))}</span>
              </div>
            </div>
            <div className="list__item-body">
              <div className="list__item-title">{chat.name}</div>
              <div className="list__item-subtitle">
                {chat.lastMessage?.senderName}: {chat.lastMessage?.content}
              </div>
            </div>
            <div className="list__item-meta">
              <span className="list__item-time">
                {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
              </span>
              {chat.unreadCount ? <span className="badge">{chat.unreadCount}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
