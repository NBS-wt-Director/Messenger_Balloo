// ThemeSwitcher — переключатель тем (dark / light / russian)
// Вынесено из packages/web в @balloo/ui (тик. №1) — визуал тот же (инлайн-стили).

import React from 'react';
import { useUIStore, type Theme } from '../store/uiStore';

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
          className="theme-switcher__btn"
          onClick={() => setTheme(t.value)}
          title={t.label}
          style={{
            background: theme === t.value ? 'var(--accent)' : 'transparent',
            border: 'none',
            borderRadius: '0',
            cursor: 'pointer',
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
