// QuickActions — быстрые действия для админ-дашборда

import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'info';
}

interface QuickActionsProps {
  actions: QuickAction[];
  style?: React.CSSProperties;
}

export function QuickActions({ actions, style }: QuickActionsProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'rgba(45, 184, 77, 0.1)',
      border: '1px solid rgba(45, 184, 77, 0.2)',
      color: 'var(--accent)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      color: 'var(--danger)',
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.1)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      color: 'var(--warning)',
    },
    info: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      color: 'var(--info)',
    },
  };

  return (
    <div
      className="card"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        Быстрые действия
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-primary)',
              transition: 'all 0.2s ease',
              ...variantStyles[action.variant || 'primary'],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <span style={{ fontSize: 16 }}>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}