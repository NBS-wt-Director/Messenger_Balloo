// FeaturesMgmtScreen — admin: manage feature requests
// Mockup: admin-balloo-su/features-mgmt.html

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface FeatureRequest {
  id: string;
  title: string;
  status: string;
  votes: number;
  authorName?: string;
  createdAt: number;
}

export function FeaturesMgmtScreen() {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.get<any>('/api/features')
      .then((res) => setFeatures(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all' ? features : features.filter((f) => f.status === statusFilter);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>Фич-реквесты</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13 }}>
          <option value="all">Все</option>
          <option value="open">Открытые</option>
          <option value="review">На рассмотрении</option>
          <option value="planned">В плане</option>
          <option value="done">Реализованы</option>
          <option value="rejected">Отклонены</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Автор</th>
              <th style={thStyle}>Голоса</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={tdStyle}>{f.title}</td>
                <td style={tdStyle}>{f.authorName || '—'}</td>
                <td style={tdStyle}>▲ {f.votes}</td>
                <td style={tdStyle}><span className="chip">{f.status}</span></td>
                <td style={tdStyle}><button className="btn btn--tertiary btn--sm">⚙️</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Нет фич-реквестов</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, color: 'var(--text-primary)' };

export default FeaturesMgmtScreen;
