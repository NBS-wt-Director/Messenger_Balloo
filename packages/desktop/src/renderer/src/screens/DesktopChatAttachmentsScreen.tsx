// DesktopChatAttachmentsScreen.tsx — Desktop chat attachments browser
// Shows all files, images, and links shared in a chat

import React, { useState } from 'react';

interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  size?: number;
  sender: string;
  date: number;
}

export function DesktopChatAttachmentsScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'files' | 'links'>('all');

  const attachments: Attachment[] = [
    { id: '1', type: 'image', name: 'photo_2026.jpg', url: '#', size: 2048576, sender: 'Иван', date: Date.now() - 3600000 },
    { id: '2', type: 'file', name: 'document.pdf', url: '#', size: 5242880, sender: 'Мария', date: Date.now() - 7200000 },
    { id: '3', type: 'link', name: 'https://balloo.su', url: '#', sender: 'Алексей', date: Date.now() - 10800000 },
    { id: '4', type: 'image', name: 'screenshot.png', url: '#', size: 1048576, sender: 'Елена', date: Date.now() - 14400000 },
  ];

  const filtered = activeTab === 'all'
    ? attachments
    : attachments.filter(a => {
        const tabMap: Record<string, string> = { images: 'image', files: 'file', links: 'link' };
        return a.type === tabMap[activeTab];
      });

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? 'var(--accent, #2db84d)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary, #8a8aa0)',
    border: `1px solid ${isActive ? 'var(--accent, #2db84d)' : 'var(--border-color, #2a2a40)'}`,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '13px',
  });

  const itemStyle: React.CSSProperties = {
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
          Вложения
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {(['all', 'images', 'files', 'links'] as const).map(tab => (
          <button
            key={tab}
            style={tabStyle(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'Все' : tab === 'images' ? 'Изображения' : tab === 'files' ? 'Файлы' : 'Ссылки'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            Нет вложений
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} style={itemStyle}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--bg-surface, #2a2a40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                {item.type === 'image' ? '🖼' : item.type === 'file' ? '📄' : '🔗'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', marginTop: '2px' }}>
                  {item.sender} · {formatDate(item.date)}
                  {item.size ? ` · ${formatSize(item.size)}` : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}