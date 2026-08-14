import React from 'react';

interface ChipProps {
  label?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Chip({
  label,
  children,
  variant = 'default',
  size = 'sm',
  removable = false,
  onRemove,
  onClick,
  style,
}: ChipProps) {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    accent: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)' },
    warning: { background: 'rgba(255, 193, 7, 0.15)', color: '#ffc107' },
    danger: { background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '2px 8px', fontSize: 11, borderRadius: 4 },
    md: { padding: '4px 12px', fontSize: 13, borderRadius: 4 },
  };

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: 500,
        lineHeight: 1.4,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
    >
      {label}
      {removable && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            padding: 0,
            fontSize: 14,
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}