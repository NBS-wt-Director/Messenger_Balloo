// SearchTabs — табы фильтрации результатов поиска

import React from 'react';
import type { SearchTab } from '@/store/searchStore';

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}

const tabs: { value: SearchTab; label: string; emoji: string }[] = [
  { value: 'all', label: 'Все', emoji: '' },
  { value: 'chats', label: 'Чаты', emoji: '💬' },
  { value: 'people', label: 'Люди', emoji: '👤' },
  { value: 'files', label: 'Файлы', emoji: '📎' },
  { value: 'media', label: 'Медиа', emoji: '🎬' },
  { value: 'links', label: 'Ссылки', emoji: '🔗' },
];

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive
                ? `2px solid var(--accent)`
                : '2px solid transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s, border-color 0.2s',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
