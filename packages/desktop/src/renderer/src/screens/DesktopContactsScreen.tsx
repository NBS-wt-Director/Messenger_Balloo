// DesktopContactsScreen — contacts list with search
// Mockup: mockups/desktop/contacts.html (1_09_15)

import React, { useState, useEffect } from 'react';
import { api } from '@balloo/web/services/api';

interface Contact {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  online: boolean;
  lastSeen?: number;
}

export function DesktopContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getContacts();
        setContacts(Array.isArray(res) ? res : []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary, #fff)' }}>Контакты</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted, #666)' }}>
          {contacts.filter((c) => !c.username.startsWith('group:')).length} контактов • {contacts.filter((c) => c.username.startsWith('group:')).length} групп
        </span>
      </div>
      <input
        type="text"
        placeholder="🔍 Поиск контактов..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '10px 14px', marginBottom: 16, background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none' }}
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary, #8a8aa0)' }}>Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary, #8a8aa0)' }}>
          {search ? 'Ничего не найдено' : 'Список контактов пуст'}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderBottom: '1px solid var(--border-color, #222)', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-tertiary, #2a2a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name.slice(0, 2).toUpperCase()}</span>}
                {c.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent, #2db84d)', border: '2px solid var(--bg-secondary, #1e1e2e)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary, #fff)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: c.online ? 'var(--accent, #2db84d)' : 'var(--text-muted, #666)' }}>{c.online ? 'в сети' : `@${c.username}`}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
