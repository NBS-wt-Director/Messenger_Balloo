// EmptyChatState — empty state при отсутствии выбранного чата
// Макет: mockups/balloo-su/empty-chat.html
// Функция: 1_01_36, приёмка 1.1.16
// Тикет: 1792137289

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useChatStore } from '@/store/chatStore';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status?: string;
}

interface EmptyChatStateProps {
  onNewChat?: () => void;
}

export function EmptyChatState({ onNewChat }: EmptyChatStateProps) {
  const navigate = useNavigate();
  const chats = useChatStore((s) => s.chats);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load contacts and filter out those with existing chats
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<any[]>('/api/users/contacts');
        if (!cancelled) {
          // Filter: contacts whose userId is NOT in existing chat participants
          const chatUserIds = new Set(
            chats
              .filter((c) => c.type === 'direct')
              .flatMap((c) => (c as any).memberIds || [])
          );
          const filtered = (data || []).filter(
            (c: Contact) => !chatUserIds.has(c.id)
          );
          setContacts(filtered);
        }
      } catch {
        // silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [chats]);

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 500, width: '100%' }}>
        {/* Mascot */}
        <div
          style={{
            width: 120,
            height: 120,
            clipPath: 'var(--octagon-clip)',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 56 }} title="Балунишка — медведь Борис, маскот Balloo">
            🐻
          </span>
        </div>

        {/* Title */}
        <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>Balloo Messenger</h2>
        <p
          style={{
            margin: '0 0 32px',
            color: 'var(--text-secondary)',
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Выберите чат из списка слева или начните новый разговор. Общайтесь,
          делитесь файлами и создавайте группы.
          <br />
          <br />
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
            🐻 Балунишка здесь — поможет найти кого-то, с кем можно пообщаться!
          </span>
        </p>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
          <button className="btn btn--primary" onClick={onNewChat}>
            ✏️ Новый чат
          </button>
          <button className="btn btn--secondary" onClick={() => navigate('/group/create')}>
            👥 Создать группу
          </button>
          <button className="btn btn--secondary" onClick={() => navigate('/channel/create')}>
            📢 Создать канал
          </button>
        </div>

        {/* Contacts without chats */}
        <div style={{ textAlign: 'left' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
            🐻 Балунишка предлагает пообщаться
          </div>

          {/* Search */}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Поиск человека..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 16 }}>
              Загрузка контактов...
            </div>
          ) : (
            <>
              <div className="text-xs text-muted" style={{ marginBottom: 8 }}>
                Контакты, с которыми ещё нет чатов:
              </div>
              {filteredContacts.length === 0 ? (
                <div className="text-muted" style={{ textAlign: 'center', padding: 16 }}>
                  {contacts.length === 0
                    ? 'Все контакты уже в чатах'
                    : 'Никого не найдено'}
                </div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="list__item"
                      style={{ border: 'none', padding: '8px 0', cursor: 'pointer' }}
                      onClick={onNewChat}
                    >
                      <div
                        className="avatar avatar--sm avatar--bordered"
                        style={{ clipPath: 'var(--octagon-clip)', flexShrink: 0 }}
                      >
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={contact.displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="avatar__inner">
                            <span>
                              {contact.displayName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="list__item-body">
                        <div className="list__item-title">{contact.displayName}</div>
                        <div className="list__item-subtitle">
                          {contact.status === 'online' ? 'в сети' : 'был(а) недавно'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
