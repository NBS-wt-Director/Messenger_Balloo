// ActivityFeed — лента последних действий для админ-дашборда

import React from 'react';
import type { ActivityItem } from '@/store/adminStore';

interface ActivityFeedProps {
  items: ActivityItem[];
  style?: React.CSSProperties;
}

export function ActivityFeed({ items, style }: ActivityFeedProps) {
  if (items.length === 0) {
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
          Последние действия
        </h3>
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: 20,
            fontSize: 13,
          }}
        >
          Нет последних действий
        </div>
      </div>
    );
  }

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
        Последние действия
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.slice(0, 8).map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 0',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <strong>{item.admin}</strong> {item.action}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                {item.target} — {item.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}