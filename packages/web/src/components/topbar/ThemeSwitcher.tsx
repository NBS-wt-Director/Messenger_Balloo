// ThemeSwitcher — переключатель тем (dark / light / russian)

import React from 'react';
import { useUIStore, type Theme } from '@/store/uiStore';

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: 'dark', label: 'Тёмная', icon: '🌙' },
  { value: 'light', label: 'Светлая', icon: '☀️' },
  { value: 'russian', label: 'Российская', icon: '🇷🇺' },
];

export function ThemeSwitcher() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div
      className="theme-switcher"
      style={{
        display: 'flex',
        gap: '4px',
        padding: '2px',
        background: 'var(--bg-secondary)',
        borderRadius: '0',
      }}
    >
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          style={{
            background: theme === t.value ? 'var(--accent)' : 'transparent',
            border: 'none',
            borderRadius: '0',
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-primary)',
            transition: 'background 0.15s',
          }}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
