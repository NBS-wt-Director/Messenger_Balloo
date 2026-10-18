// DesktopGroupCreateScreen — create group form
// Mockup: mockups/desktop/group-create.html (1_09_16)

import React, { useState, useEffect } from 'react';
import { api } from '@balloo/web/services/api';

interface Contact {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function DesktopGroupCreateScreen({ onSuccess }: { onSuccess?: (chatId: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getContacts().then((res) => setContacts(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  const toggleContact = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Введите название группы'); return; }
    setCreating(true);
    setError(null);
    try {
      const res = await api.createGroup({ name: name.trim(), description: description.trim() || undefined, type: 'group', memberIds: Array.from(selected) });
      onSuccess?.(res?.chat?.id || res?.id);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания группы');
    } finally {
      setCreating(false);
    }
  };

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>Создать группу</h2>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Название группы</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите название" style={inputStyle} maxLength={100} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Описание (необязательно)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="О чём эта группа?" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} maxLength={500} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Участники ({selected.size})</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Поиск контактов..." style={{ ...inputStyle, marginBottom: 8 }} />
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color, #333)' }}>
          {filtered.map((c) => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: selected.has(c.id) ? 'rgba(45,184,77,0.08)' : 'transparent' }}>
              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleContact(c.id)} />
              <span style={{ fontSize: 14, color: 'var(--text-primary, #fff)' }}>{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <button onClick={handleCreate} disabled={creating} style={btnStyle}>
        {creating ? 'Создание…' : '➤ Создать группу'}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary, #8a8aa0)', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '10px 20px', background: 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
