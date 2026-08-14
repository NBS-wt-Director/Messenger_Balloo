// EmptyState — пустое состояние для табов поиска

import React from 'react';

interface EmptyStateProps {
  tab: string;
  emoji: string;
}

export function EmptyState({ tab, emoji }: EmptyStateProps) {
  const descriptions: Record<string, string> = {
    all: 'Попробуйте изменить запрос',
    chats: 'Чаты не найдены. Попробуйте изменить запрос',
    people: 'Люди не найдены. Попробуйте изменить запрос',
    files: 'Файлы не найдены. Попробуйте изменить запрос',
    media: 'Медиа не найдены. Попробуйте изменить запрос',
    links: 'Ссылки не найдены. Попробуйте изменить запрос',
  };

  return (
    <div
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        className="empty-state__animation"
        style={{
          fontSize: '48px',
          marginBottom: '16px',
          animation: 'bounce 2s infinite',
        }}
      >
        {emoji}
      </div>
      <div
        className="empty-state__title"
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}
      >
        Нет результатов
      </div>
      <div
        className="empty-state__subtitle"
        style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}
      >
        {descriptions[tab] || descriptions.all}
      </div>
    </div>
  );
}
