// EmployeesScreen — admin: manage employees
// Mockup: admin-balloo-su/employees.html

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  status: string;
}

export function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<any>('/api/admin/employees')
      .then((res) => setEmployees(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>Сотрудники</h1>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Поиск..." style={{ padding: '8px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13, width: 240 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Имя</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Отдел</th>
              <th style={thStyle}>Роль</th>
              <th style={thStyle}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={tdStyle}>{e.name}</td>
                <td style={tdStyle}>{e.email}</td>
                <td style={tdStyle}>{e.department || '—'}</td>
                <td style={tdStyle}>{e.role}</td>
                <td style={tdStyle}><span style={{ color: e.status === 'active' ? 'var(--accent)' : 'var(--danger)' }}>{e.status === 'active' ? 'Активен' : e.status}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Нет сотрудников</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, color: 'var(--text-primary)' };

export default EmployeesScreen;
