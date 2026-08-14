// Utilities — вынесены перед компонентом для доступа из React.memo
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

// ChatItem — один чат в списке
// Аватар, имя, последнее сообщение, время, badge
// Оптимизация: React.memo для предотвращения лишних ре-рендеров (тикет №64)

import React, { useMemo } from 'react';
import type { UserChat } from '@/store/chatStore';

interface ChatItemProps {
  chat: UserChat;
  active?: boolean;
  onClick: () => void;
}

// Memoized — не перерисовывать при изменениях в других чатах
export const ChatItem = React.memo<ChatItemProps>(({ chat, active = false, onClick }) => {
  const lastMsg = chat.lastMessage;
  
  // Кэшируем вычисления
  const lastText = useMemo(() => lastMsg?.content || 'Нет сообщений', [lastMsg?.content]);
  const lastTime = useMemo(() => lastMsg?.createdAt ? formatTime(lastMsg.createdAt) : '', [lastMsg?.createdAt]);
  const displayName = useMemo(() => chat.name || 'Чат', [chat.name]);

  return (
    <div
      className="chat-item"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        cursor: 'pointer',
        background: active ? 'var(--bg-hover)' : 'transparent',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {chat.avatarUrl ? (
          <img
            src={chat.avatarUrl}
            alt={displayName}
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'cover',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              border: '2px solid var(--border-color)',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--bg-tertiary)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '18px',
              fontWeight: 700,
              border: '2px solid var(--border-color)',
              boxSizing: 'border-box',
            }}
          >
            {(displayName[0] || '?').toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
          {lastTime && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
              {lastTime}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {truncate(lastText, 40)}
          </span>
          {chat.unreadCount > 0 && (
            <span
              style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                marginLeft: '8px',
                flexShrink: 0,
              }}
            >
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}); // React.memo
