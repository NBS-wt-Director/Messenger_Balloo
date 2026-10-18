// DepartmentsScreen — admin: manage company departments
// Mockup: admin-balloo-su/departments.html

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface Department {
  id: string;
  name: string;
  headName?: string;
  employeeCount: number;
  createdAt: number;
}

export function DepartmentsScreen() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    api.get<any>('/api/admin/departments')
      .then((res) => setDepartments(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.post<any>('/api/admin/departments', { name: newName.trim() });
      setDepartments((prev) => [...prev, res?.data || res]);
      setNewName('');
      setShowCreate(false);
    } catch { /* ignore */ }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>Отделы</h1>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>+ Создать отдел</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Руководитель</th>
              <th style={thStyle}>Сотрудников</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={tdStyle}>{d.name}</td>
                <td style={tdStyle}>{d.headName || '—'}</td>
                <td style={tdStyle}>{d.employeeCount}</td>
                <td style={tdStyle}><button className="btn btn--tertiary btn--sm">✏️</button></td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Нет отделов</td></tr>}
          </tbody>
        </table>
      )}

      {showCreate && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreate(false)} />
          <div className="modal" style={{ width: 400 }}>
            <div className="modal__header"><span className="modal__title">Новый отдел</span><div className="modal__close" onClick={() => setShowCreate(false)}>✕</div></div>
            <div className="modal__body">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название отдела" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            <div className="modal__footer"><button className="btn btn--tertiary" onClick={() => setShowCreate(false)}>Отмена</button><button className="btn btn--primary" onClick={handleCreate}>Создать</button></div>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, color: 'var(--text-primary)' };

export default DepartmentsScreen;
