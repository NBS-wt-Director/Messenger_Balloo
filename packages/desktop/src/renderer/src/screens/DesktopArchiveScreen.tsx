// DesktopArchiveScreen.tsx — Desktop archived chats screen
// Shows archived conversations with restore/delete options

import React, { useState } from 'react';

interface ArchivedChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: number;
  avatarUrl?: string;
  unreadCount: number;
}

export function DesktopArchiveScreen() {
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

  // Placeholder data
  const archivedChats: ArchivedChat[] = [
    { id: '1', name: 'Старый проект', lastMessage: 'Всё готово, можно сдавать', lastMessageTime: Date.now() - 86400000 * 7, unreadCount: 0 },
    { id: '2', name: 'Чат поддержки', lastMessage: 'Спасибо за обращение!', lastMessageTime: Date.now() - 86400000 * 14, unreadCount: 2 },
    { id: '3', name: 'Группа выпускников', lastMessage: 'Фото с встречи', lastMessageTime: Date.now() - 86400000 * 30, unreadCount: 0 },
  ];

  const toggleSelect = (id: string) => {
    const next = new Set(selectedChats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChats(next);
  };

  const handleRestore = () => {
    // TODO: API call to restore selected chats
    setSelectedChats(new Set());
  };

  const handleDelete = () => {
    // TODO: API call to delete selected chats
    setSelectedChats(new Set());
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diff < 86400000 * 7) return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()];
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const chatItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-color, #2a2a40)',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
          Архив чатов
        </h2>
        {selectedChats.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRestore}
              style={{
                background: 'var(--accent, #2db84d)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Восстановить ({selectedChats.size})
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Удалить ({selectedChats.size})
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {archivedChats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            <p style={{ fontSize: '16px' }}>Нет archived чатов</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Архивированные чаты появятся здесь</p>
          </div>
        ) : (
          archivedChats.map(chat => (
            <div
              key={chat.id}
              style={chatItemStyle}
              onClick={() => toggleSelect(chat.id)}
            >
              <input
                type="checkbox"
                checked={selectedChats.has(chat.id)}
                onChange={() => toggleSelect(chat.id)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent, #2db84d)' }}
              />
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--bg-surface, #2a2a40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'var(--text-secondary, #8a8aa0)',
                flexShrink: 0,
              }}>
                {chat.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)', fontSize: '14px' }}>
                  {chat.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary, #8a8aa0)',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {chat.lastMessage}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', flexShrink: 0 }}>
                {formatTime(chat.lastMessageTime)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}