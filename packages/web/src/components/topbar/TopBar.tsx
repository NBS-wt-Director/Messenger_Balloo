// TopBar — верхняя панель текущего раздела
// Переключатели тем, языков, уведомлений

import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationsBell } from './NotificationsBell';

interface TopBarProps {
  title?: string;
  onSearchClick?: () => void;
  notificationCount?: number;
}

export function TopBar({ title, onSearchClick, notificationCount = 0 }: TopBarProps) {
  return (
    <div
      className="topbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        flexShrink: 0,
        height: '48px',
      }}
    >
      {/* Left: title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {title && (
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
        )}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
            }}
          >
            🔍
          </button>
        )}
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeSwitcher />
        <LanguageSwitcher />
        <NotificationsBell count={notificationCount} />
      </div>
    </div>
  );
}
