// ChatInfoPanel — панель информации о чате (справа)

import React from 'react';
import type { UserChat } from '@/store/chatStore';

interface ChatInfoPanelProps {
  chat: UserChat;
  isOpen: boolean;
  onClose?: () => void;
  members?: Array<{ id: string; username: string; displayName?: string; avatarUrl?: string; role?: string; status?: string }>;
  onMemberClick?: (userId: string) => void;
}

export const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  chat,
  isOpen,
  onClose,
  members = [],
  onMemberClick,
}) => {
  if (!isOpen) return null;

  const displayName = chat.name || 'Чат';

  return (
    <div
      style={{
        width: '320px',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>Информация о чате</span>
        <button
          onClick={onClose}
          style={{ fontSize: '18px', padding: '4px 8px', color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Chat avatar & name */}
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          {chat.avatarUrl ? (
            <img
              src={chat.avatarUrl}
              alt={displayName}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                border: '3px solid var(--border-color)',
                boxSizing: 'border-box',
                marginBottom: '12px',
              }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 12px',
                background: 'var(--bg-tertiary)',
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '28px',
                fontWeight: 700,
                border: '3px solid var(--border-color)',
                boxSizing: 'border-box',
              }}
            >
              {(displayName[0] || '?').toUpperCase()}
            </div>
          )}
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {chat.type === 'direct' ? 'Личный чат' : chat.type === 'group' ? 'Группа' : 'Канал'}
            {members.length > 0 && ` • ${members.length} участников`}
          </div>
        </div>

        <div className="divider" />

        {/* Description / Bio */}
        {chat.description && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Описание
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {chat.description}
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Invite link */}
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ссылка для приглашения
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              balloo.su/invite/{chat.inviteCode || 'xxxxx'}
            </span>
            <button
              style={{ fontSize: '12px', color: 'var(--accent)', whiteSpace: 'nowrap' }}
              onClick={() => navigator.clipboard.writeText(`balloo.su/invite/${chat.inviteCode}`)}
            >
              Копировать
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* Members list */}
        {members.length > 0 && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Участники ({members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    cursor: onMemberClick ? 'pointer' : 'default',
                    borderRadius: '4px',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => onMemberClick?.(member.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Member avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName || member.username}
                        style={{
                          width: '36px',
                          height: '36px',
                          objectFit: 'cover',
                          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                          border: '2px solid var(--border-color)',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'var(--bg-tertiary)',
                          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '14px',
                          fontWeight: 700,
                          border: '2px solid var(--border-color)',
                          boxSizing: 'border-box',
                        }}
                      >
                        {(member.displayName || member.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    {/* Online status */}
                    {member.status === 'online' && (
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          border: '2px solid var(--bg-secondary)',
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          background: 'var(--success)',
                        }}
                      />
                    )}
                  </div>

                  {/* Member info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {member.displayName || member.username}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {member.role === 'owner' && '👑 Владелец'}
                      {member.role === 'admin' && '🛡 Админ'}
                      {member.role === 'moderator' && '📋 Модератор'}
                      {member.role === 'member' && '👤 Участник'}
                      {member.status === 'online' && 'в сети'}
                      {member.status === 'offline' && 'не в сети'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Quick actions */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="btn btn--secondary btn--block"
            style={{ fontSize: '13px' }}
          >
            📌 Закрепить чат
          </button>
          <button
            className="btn btn--secondary btn--block"
            style={{ fontSize: '13px' }}
          >
            🔇 Заглушить
          </button>
          <button
            className="btn btn--secondary btn--block"
            style={{ fontSize: '13px' }}
          >
            📦 В архив
          </button>
          <button
            className="btn btn--secondary btn--block"
            style={{ fontSize: '13px', color: 'var(--danger)' }}
          >
            🚫 Заблокировать
          </button>
        </div>
      </div>
    </div>
  );
};
