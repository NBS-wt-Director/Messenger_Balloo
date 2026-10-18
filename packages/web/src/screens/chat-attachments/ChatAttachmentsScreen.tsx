// ChatAttachments Screen — все вложения чата
// Макет: mockups/balloo-su/chat-attachments.html

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

type TabType = 'media' | 'audio' | 'files' | 'links' | 'polls';

interface Attachment {
  id: string;
  type: string;
  url: string;
  name?: string;
  size?: number;
  duration?: number;
  senderName?: string;
  createdAt: number;
}

export default function ChatAttachmentsScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAttachments = useCallback(async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      const data = await api.getChatAttachments(chatId, activeTab, searchQuery || undefined);
      setAttachments(data || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [chatId, activeTab, searchQuery]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const formatSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (sec: number | undefined) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('ru-RU');
  };

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'media', label: '📷 Медиа' },
    { id: 'audio', label: '🎵 Аудио' },
    { id: 'files', label: '📄 Файлы' },
    { id: 'links', label: '🔗 Ссылки' },
    { id: 'polls', label: '📊 Опросы' },
  ];

  return (
    <div className="chat-attachments-panel">
      {/* Заголовок */}
      <div className="chat-attachments-header">
        <button className="btn btn--tertiary btn--sm" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <span className="chat-attachments-title">Вложения чата</span>
        <button className="btn btn--tertiary btn--sm" onClick={() => navigate(-1)}>
          ✕ Закрыть
        </button>
      </div>

      {/* Вкладки */}
      <div className="attachments-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Поиск */}
      <div className="attachments-search">
        <input
          type="text"
          className="form-input"
          placeholder="Поиск по вложениям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Контент */}
      <div className="attachments-content">
        {loading ? (
          <p>Загрузка...</p>
        ) : attachments.length === 0 ? (
          <p className="empty-state">Нет вложений</p>
        ) : activeTab === 'media' ? (
          <div className="media-grid">
            {attachments.map((att) => (
              <div key={att.id} className="media-item">
                <img src={att.url} alt={att.name || ''} className="media-item__preview" />
                {att.duration && <span className="media-item__duration">{formatDuration(att.duration)}</span>}
              </div>
            ))}
          </div>
        ) : activeTab === 'audio' ? (
          <div className="file-list">
            {attachments.map((att) => (
              <div key={att.id} className="file-item">
                <span className="file-item__icon">🎵</span>
                <div className="file-item__info">
                  <span className="file-item__name">{att.name || 'Аудио'}</span>
                  <span className="file-item__meta">{formatDuration(att.duration)} · {att.senderName}</span>
                </div>
                <button className="btn btn--tertiary btn--sm">▶</button>
                <a href={att.url} download className="btn btn--tertiary btn--sm">⬇</a>
              </div>
            ))}
          </div>
        ) : activeTab === 'files' ? (
          <div className="file-list">
            {attachments.map((att) => (
              <div key={att.id} className="file-item">
                <span className="file-item__icon">📄</span>
                <div className="file-item__info">
                  <span className="file-item__name">{att.name || 'Файл'}</span>
                  <span className="file-item__meta">{formatSize(att.size)} · {att.senderName} · {formatDate(att.createdAt)}</span>
                </div>
                <a href={att.url} download className="btn btn--tertiary btn--sm">⬇</a>
              </div>
            ))}
          </div>
        ) : activeTab === 'links' ? (
          <div className="link-list">
            {attachments.map((att) => (
              <div key={att.id} className="link-card">
                <a href={att.url} target="_blank" rel="noopener noreferrer" className="link-card__url">{att.url}</a>
                <span className="link-card__meta">{att.senderName} · {formatDate(att.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="poll-list">
            {attachments.map((att) => (
              <div key={att.id} className="poll-card">
                <span className="poll-card__name">{att.name || 'Опрос'}</span>
                <span className="poll-card__meta">{att.senderName} · {formatDate(att.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
