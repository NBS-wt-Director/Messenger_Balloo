// NavItem — элемент навигации сайдбара
// Иконка + текст + badge (опционально)

import React from 'react';

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number | string;
  onClick?: () => void;
  to?: string;
}

export function NavItem({ icon, label, active = false, badge, onClick, to }: NavItemProps) {
  return (
    <div
      className="sidebar-nav-item"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        margin: '2px 8px',
        borderRadius: '0',
        background: active ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        transition: 'background 0.15s',
        userSelect: 'none',
        textDecoration: 'none',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontSize: '18px',
          width: '24px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {badge !== undefined && badge !== 0 && (
        <span
          style={{
            background: active ? 'var(--accent)' : '#e53e3e',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '0',
            minWidth: '20px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
