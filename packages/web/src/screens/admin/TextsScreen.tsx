// TextsScreen — admin: manage text pages (legal, about, etc.)
// Mockup: admin-balloo-su/texts.html

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface TextPage {
  id: string;
  slug: string;
  title: string;
  language: string;
  updatedAt: number;
}

export function TextsScreen() {
  const [pages, setPages] = useState<TextPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get<any>('/api/admin/texts')
      .then((res) => setPages(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = pages.filter((p) => p.title.toLowerCase().includes(filter.toLowerCase()) || p.slug.includes(filter.toLowerCase()));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>Текстовые страницы</h1>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="🔍 Поиск..." style={{ padding: '8px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13, width: 240 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Заголовок</th>
              <th style={thStyle}>Slug</th>
              <th style={thStyle}>Язык</th>
              <th style={thStyle}>Обновлено</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={tdStyle}>{p.title}</td>
                <td style={tdStyle}><code style={{ fontSize: 12 }}>/p/{p.slug}</code></td>
                <td style={tdStyle}>{p.language.toUpperCase()}</td>
                <td style={tdStyle}>{new Date(p.updatedAt * 1000).toLocaleDateString('ru')}</td>
                <td style={tdStyle}><button className="btn btn--tertiary btn--sm">✏️ Редактировать</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Нет текстовых страниц</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, color: 'var(--text-primary)' };

export default TextsScreen;
