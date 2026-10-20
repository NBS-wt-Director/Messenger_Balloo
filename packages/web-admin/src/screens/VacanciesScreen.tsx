// VacanciesScreen — admin: manage job vacancies
// Mockup: admin-balloo-su/vacancies.html

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface Vacancy {
  id: string;
  title: string;
  department?: string;
  status: string;
  applicationsCount: number;
  createdAt: number;
}

export function VacanciesScreen() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/api/knowledge/vacancies')
      .then((res) => setVacancies(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>Вакансии</h1>
        <button className="btn btn--primary">+ Создать вакансию</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Должность</th>
              <th style={thStyle}>Отдел</th>
              <th style={thStyle}>Отклики</th>
              <th style={thStyle}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {vacancies.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={tdStyle}>{v.title}</td>
                <td style={tdStyle}>{v.department || '—'}</td>
                <td style={tdStyle}>{v.applicationsCount}</td>
                <td style={tdStyle}><span style={{ color: v.status === 'open' ? 'var(--accent)' : 'var(--text-muted)' }}>{v.status === 'open' ? 'Открыта' : v.status}</span></td>
              </tr>
            ))}
            {vacancies.length === 0 && <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Нет вакансий</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, color: 'var(--text-primary)' };

export default VacanciesScreen;
