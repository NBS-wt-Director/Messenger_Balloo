// StatCard — карточка метрики для админ-дашборда

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
  style?: React.CSSProperties;
}

export function StatCard({ label, value, trend, color, style }: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        flex: 1,
        minWidth: 200,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: color || 'var(--accent)',
          lineHeight: 1.2,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {trend && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          {trend}
        </div>
      )}
    </div>
  );
}