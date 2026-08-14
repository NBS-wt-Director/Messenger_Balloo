// SearchResultItem — элемент результата поиска
// Отображает аватар/иконку, заголовок с подсветкой, подзаголовок

import React from 'react';

interface SearchResultItemProps {
  result: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    avatarUrl?: string;
    avatarInitials?: string;
    icon?: string;
    size?: string;
    source?: string;
    messageCount?: number;
    highlight?: string;
  };
  onClick: (id: string) => void;
}

export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  // Highlight matched text
  const renderTitle = () => {
    const highlight = result.highlight;
    if (!highlight || !highlight.trim()) {
      return result.title;
    }
    // Split title by highlight term and wrap matches
    const parts = result.title.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: 'var(--accent)',
            color: 'var(--text-primary)',
            padding: '0 2px',
            borderRadius: '0',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Avatar initials
  const renderAvatar = () => {
    if (result.avatarUrl) {
      return (
        <img
          src={result.avatarUrl}
          alt={result.title}
          style={{
            width: '36px',
            height: '36px',
            objectFit: 'cover',
            clipPath:
              'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          }}
        />
      );
    }
    if (result.avatarInitials) {
      return (
        <div
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600,
            color: 'white',
            background: 'var(--accent)',
            clipPath:
              'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          }}
        >
          {result.avatarInitials}
        </div>
      );
    }
    if (result.icon) {
      return (
        <div
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          {result.icon}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="list__item"
      onClick={() => onClick(result.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border-color)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = 'var(--bg-secondary)')
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {renderAvatar()}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {renderTitle()}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.subtitle}
        </div>
      </div>
    </div>
  );
}
