// CallStartModal — начать звонок из экрана «Звонки» (тик. 1795683301, C4).
//
// Пустое состояние звонков предлагает позвонить, но кнопки не было. Здесь —
// выбор контакта из списка и типа звонка; по подтверждению вызывается
// `POST /api/calls` (createCallCtrl: { calleeId, type }), после чего
// пользователь переходит на экран активного звонка.

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export interface CallStartModalProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после успешного создания звонка */
  onStarted?: (call: { id?: string; chatId?: string }) => void;
}

interface ContactOption {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string | null;
}

export function CallStartModal({ open, onClose, onStarted }: CallStartModalProps) {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [type, setType] = useState<'audio' | 'video'>('audio');
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    api
      .getContacts()
      .then((data: unknown) => {
        if (cancelled) return;
        const raw = Array.isArray(data) ? data : ((data as { contacts?: unknown[] })?.contacts ?? []);
        const list: ContactOption[] = (raw as Array<Record<string, unknown>>).map((c) => {
          const user = (c.user ?? c) as Record<string, unknown>;
          const name =
            (user.displayName as string) ||
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            (user.username as string) ||
            'Без имени';
          return {
            id: String(user.id ?? c.id ?? ''),
            name,
            username: (user.username as string) ?? undefined,
            avatarUrl: (user.avatarUrl as string) ?? null,
          };
        });
        setContacts(list.filter((c) => c.id));
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить контакты. Проверьте соединение и попробуйте снова.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleCall = async () => {
    if (!selectedId) return;
    setCalling(true);
    setError(null);
    try {
      const call = await api.startCall(selectedId, type);
      onStarted?.(call ?? {});
      onClose();
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(
        message && message !== 'Failed to fetch'
          ? message
          : 'Не удалось начать звонок. Проверьте соединение и попробуйте снова.'
      );
    } finally {
      setCalling(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-start-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-strong, var(--border-color))',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
          <h2 id="call-start-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            📞 Новый звонок
          </h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        {/* Тип звонка */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px' }}>
          <button
            type="button"
            className={`btn btn--sm ${type === 'audio' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setType('audio')}
            aria-pressed={type === 'audio'}
          >
            🎧 Аудио
          </button>
          <button
            type="button"
            className={`btn btn--sm ${type === 'video' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setType('video')}
            aria-pressed={type === 'video'}
          >
            📹 Видео
          </button>
        </div>

        {/* Список контактов */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px' }}>
          {loading && <p className="muted">Загрузка контактов…</p>}

          {!loading && contacts.length === 0 && !error && (
            <p className="muted" style={{ lineHeight: 1.6 }}>
              В контактах пока никого нет. Добавьте контакт — и он появится здесь.
            </p>
          )}

          {contacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              aria-pressed={selectedId === c.id}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 8px',
                marginBottom: 4,
                textAlign: 'left',
                cursor: 'pointer',
                background: selectedId === c.id ? 'var(--bg-hover)' : 'transparent',
                border: `1px solid ${selectedId === c.id ? 'var(--accent)' : 'transparent'}`,
                color: 'var(--text-primary)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{c.name}</span>
                {c.username && (
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                    @{c.username}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p style={{ margin: '12px 20px 0', color: '#e74c3c', fontSize: 13, lineHeight: 1.5 }}>{error}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 20 }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!selectedId || calling}
            onClick={handleCall}
          >
            {calling ? 'Соединяем…' : 'Позвонить'}
          </button>
        </div>
      </div>
    </div>
  );
}
