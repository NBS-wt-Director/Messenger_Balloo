// ChatSearch — поиск по чатам
// Input с фильтрацией

import React, { useState } from 'react';

interface ChatSearchProps {
  onSearch: (query: string) => void;
}

export function ChatSearch({ onSearch }: ChatSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>🔍</span>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Поиск по чатам..."
        style={{
          flex: 1,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0',
          padding: '8px 12px',
          color: 'var(--text-primary)',
          fontSize: '13px',
          outline: 'none',
        }}
      />
      {query && (
        <button
          onClick={handleClear}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
