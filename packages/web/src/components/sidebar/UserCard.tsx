// UserCard — карточка пользователя в сайдбаре
// Аватар + имя + статус

import React from 'react';
import type { AuthUser } from '@/store/authStore';

interface UserCardProps {
  user: AuthUser;
  collapsed?: boolean;
}

export function UserCard({ user, collapsed = false }: UserCardProps) {
  const displayName = user.displayName || user.username || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="sidebar-user-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          position: 'relative',
          width: collapsed ? '36px' : '40px',
          height: collapsed ? '36px' : '40px',
          flexShrink: 0,
        }}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              border: '2px solid var(--accent)',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--accent)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: collapsed ? '14px' : '16px',
              border: '2px solid var(--accent)',
              boxSizing: 'border-box',
            }}
          >
            {initials}
          </div>
        )}
        {/* Online indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: '12px',
            height: '12px',
            background: 'var(--status-online)',
            border: '2px solid var(--bg-primary)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Name */}
      {!collapsed && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
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
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            @{user.username}
          </div>
        </div>
      )}
    </div>
  );
}
