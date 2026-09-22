// ChatSearch — поиск по чатам (P34: по макету chats.html)
// Класс .sidebar__search + .search-input из common.css

import React from 'react';

interface ChatSearchProps {
  onSearch: (query: string) => void;
}

export function ChatSearch({ onSearch }: ChatSearchProps) {
  const [query, setQuery] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="sidebar__search">
      <input
        type="text"
        className="search-input"
        placeholder="🔍 Поиск чатов и людей..."
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}
