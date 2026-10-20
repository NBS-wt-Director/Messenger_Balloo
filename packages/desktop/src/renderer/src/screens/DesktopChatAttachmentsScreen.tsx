// DesktopChatAttachmentsScreen.tsx — Desktop chat attachments browser
// Shows all files, images, and links shared in a chat
// Тикет 1792311350: данные берутся из GET /api/chats/:id/attachments?type=<tab>

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@balloo/web/services/api';

interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  size?: number;
  sender: string;
  date: number;
}

// Маппинг серверного type в тип карточки
const toAttachment = (a: any): Attachment => ({
  id: a.id,
  type: a.type === 'image' || a.type === 'video' ? 'image' : a.type === 'link' ? 'link' : 'file',
  name: a.name ?? 'Без имени',
  url: a.url ?? '#',
  size: Number(a.size) || undefined,
  sender: a.senderName ?? '',
  date: (Number(a.createdAt) || 0) * 1000,
});

export function DesktopChatAttachmentsScreen({ chatId }: { chatId?: string } = {}) {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'files' | 'links'>('all');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Вкладка «Все» = media (фото+видео) + файлы: отдельной вкладки на сервере нет
  // (packages/server/src/services/messageService.ts:721)
  const load = useCallback(async () => {
    if (!chatId) {
      setAttachments([]);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const tabs = activeTab === 'all' ? ['media', 'files'] : [activeTab];
      const parts = await Promise.all(tabs.map((t) => api.getChatAttachments(chatId, t)));
      setAttachments(parts.flat().map(toAttachment));
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить вложения');
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [chatId, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = attachments;

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            Загрузка…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#e74c3c' }}>
            {error}
            <div>
              <button type="button" onClick={load} style={{ marginTop: '12px', background: 'transparent', border: '1px solid var(--border-color, #2a2a40)', color: 'var(--text-primary, #fff)', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
                Повторить
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            {chatId ? 'Нет вложений' : 'Выберите чат, чтобы увидеть вложения'}
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