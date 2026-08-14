// ChatHeader — шапка чата (имя, статус, действия)

import React from 'react';
import type { UserChat } from '@/store/chatStore';

interface ChatHeaderProps {
  chat: UserChat;
  onlineStatus?: string;
  onCall?: (type: 'audio' | 'video') => void;
  onAttachments?: () => void;
  onMenu?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  onlineStatus = 'в сети',
  onCall,
  onAttachments,
  onMenu,
}) => {
  const displayName = chat.name || 'Чат';
  const avatarInitials = (displayName[0] || '?').toUpperCase();

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-secondary)',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {chat.avatarUrl ? (
          <img
            src={chat.avatarUrl}
            alt={displayName}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'cover',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              border: '2px solid var(--border-color)',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'var(--bg-tertiary)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '16px',
              fontWeight: 700,
              border: '2px solid var(--border-color)',
              boxSizing: 'border-box',
            }}
          >
            {avatarInitials}
          </div>
        )}
        {/* Status dot */}
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid var(--bg-secondary)',
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: onlineStatus === 'в сети' ? 'var(--success)' : 'var(--text-muted)',
          }}
        />
      </div>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {displayName}
          {chat.type === 'channel' && (
            <span className="chip chip--info" style={{ fontSize: '9px', marginLeft: '6px' }}>КАНАЛ</span>
          )}
          {chat.type === 'group' && (
            <span className="chip chip--warning" style={{ fontSize: '9px', marginLeft: '6px' }}>ГРУППА</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {onlineStatus}
          {chat.unreadCount > 0 && (
            <span style={{ marginLeft: '8px', color: 'var(--accent)' }}>
              {chat.unreadCount} новых
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          className="topbar__actions-btn"
          title="Вложения чата"
          onClick={onAttachments}
          style={{ padding: '6px', fontSize: '18px' }}
        >
          📎
        </button>
        <button
          className="topbar__actions-btn"
          title="Аудиозвонок"
          onClick={() => onCall?.('audio')}
          style={{ padding: '6px', fontSize: '18px' }}
        >
          📞
        </button>
        <button
          className="topbar__actions-btn"
          title="Видеозвонок"
          onClick={() => onCall?.('video')}
          style={{ padding: '6px', fontSize: '18px' }}
        >
          📹
        </button>
        <button
          className="topbar__actions-btn"
          title="Меню чата"
          onClick={onMenu}
          style={{ padding: '6px', fontSize: '18px' }}
        >
          ⋮
        </button>
      </div>
    </div>
  );
};
