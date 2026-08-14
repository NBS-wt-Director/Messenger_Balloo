import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number | string;
  status?: 'online' | 'offline' | 'away' | 'dnd';
  initials?: string;
  username?: string;
  ctx?: string;
  style?: React.CSSProperties;
}

const OCTAGON_CLIP = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

function resolveSize(size?: number | string): number {
  if (typeof size === 'string') return SIZE_MAP[size] || 40;
  return size || 40;
}

export function Avatar({
  src,
  alt = '',
  size,
  status,
  initials,
  username,
  ctx,
  style,
}: AvatarProps) {
  const resolvedSize = resolveSize(size);
  const displayInitials = initials || (username ? username.slice(0, 2).toUpperCase() : '??');

  const colors = [
    '#2db84d', '#3498db', '#9b59b6', '#f39c12', '#e74c3c',
    '#1abc9c', '#2ecc71', '#e67e22', '#2980b9', '#8e44ad',
  ];

  const colorIndex = username
    ? username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  return (
    <div
      style={{
        width: resolvedSize,
        height: resolvedSize,
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          clipPath: OCTAGON_CLIP,
          background: src ? `url(${src}) center/cover no-repeat` : colors[colorIndex],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: resolvedSize * 0.35,
          fontFamily: 'var(--font-primary)',
          border: '2px solid var(--border-color)',
        }}
      >
        {!src && initials}
      </div>

      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: resolvedSize * 0.25,
            height: resolvedSize * 0.25,
            borderRadius: '50%',
            border: '2px solid var(--bg-primary)',
            background:
              status === 'online' ? '#2db84d' :
              status === 'away' ? '#f39c12' :
              status === 'dnd' ? '#e74c3c' :
              status === 'offline' ? '#8a8aa0' :
              'transparent',
          }}
        />
      )}
    </div>
  );
}