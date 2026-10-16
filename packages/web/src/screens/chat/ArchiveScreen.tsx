// Archive Screen — архив чатов
// Макет: mockups/balloo-su/archive.html (принят владельцем 16.10.2026, 1.1.11 → 6.35)
// Условие приёмки: список показывается если архивированные чаты есть,
// empty state — если их нет; два блока одновременно не отображаются.

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';

interface ArchivedChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: number;
  avatarUrl?: string;
  unreadCount: number;
}

// «Архивирован 10.07.2026» — unix-секунды → ДД.ММ.ГГГГ (как в макете)
function formatArchiveDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString('ru-RU');
}

// Русская плюрализация: 1 чат / 2 чата / 5 чатов
function pluralChats(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'чат';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'чата';
  return 'чатов';
}

export default function ArchiveScreen() {
  const [chats, setChats] = useState<ArchivedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getArchived();
      setChats(res?.chats ?? []);
    } catch {
      setError('Не удалось загрузить архив');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = async (chatId: string) => {
    try {
      await api.restoreArchivedChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } catch {
      // error toast
    }
  };

  const handleDelete = async (chatId: string) => {
    if (!confirm('Удалить этот чат навсегда? Это действие необратимо.')) {
      return;
    }
    try {
      await api.deleteArchivedChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } catch {
      // error toast
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Архив чатов</h1>
        <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>
          {chats.length} {pluralChats(chats.length)} в архиве
        </p>

        {loading && (
          <div className="text-sm text-secondary" style={{ padding: 24, textAlign: 'center' }}>
            Загрузка…
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-danger" style={{ padding: 24, textAlign: 'center' }}>
            {error}{' '}
            <button className="btn btn--tertiary btn--sm" onClick={load}>
              Повторить
            </button>
          </div>
        )}

        {/* Верхний блок: список — только если чаты есть (условие приёмки 1.1.11) */}
        {!loading && !error && chats.length > 0 && (
          <div className="list">
            {chats.map((chat) => (
              <div key={chat.id} className="list__item">
                <div className="avatar avatar--md avatar--bordered avatar--status-offline avatar--ctx-contact">
                  <div className="avatar__inner">
                    <span>{chat.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                </div>
                <div className="list__item-body">
                  <div className="list__item-title">{chat.name}</div>
                  <div className="list__item-subtitle">
                    {`Архивирован ${formatArchiveDate(chat.lastMessageTime)}`}
                  </div>
                </div>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleRestore(chat.id)}
                >
                  ↩ Восстановить
                </button>
                <button
                  className="btn btn--tertiary btn--sm text-danger"
                  aria-label={`Удалить чат ${chat.name}`}
                  onClick={() => handleDelete(chat.id)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Нижний блок: empty state — только если чатов нет (условие приёмки 1.1.11) */}
        {!loading && !error && chats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Нет архивированных чатов
            </div>
            <div className="text-sm text-secondary">
              Архивируйте чат через меню ⋮ → «В архив»
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
