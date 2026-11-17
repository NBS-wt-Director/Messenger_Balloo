// AdminServiceStatusScreen — мониторинг узлов Balloo
// Макет: mockups/admin-balloo-su/service-status.html

import { useState, useEffect } from 'react';

interface NodeStatus {
  id: string;
  name: string;
  icon: string;
  status: 'online' | 'busy' | 'offline';
  latency: number;
  uptime: string;
  note?: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'minor' | 'major' | 'critical';
  nodes: string;
  started: string;
  ended: string;
  status: 'investigating' | 'resolved';
  creator: string;
}

const MOCK_NODES: NodeStatus[] = [
  { id: '1', name: 'balloo.su', icon: '💬', status: 'online', latency: 42, uptime: '99.98%' },
  { id: '2', name: 'admin.balloo.su', icon: '🛡️', status: 'online', latency: 38, uptime: '99.99%' },
  { id: '3', name: 'command.balloo.su', icon: '🏢', status: 'online', latency: 51, uptime: '99.95%' },
  { id: '4', name: 'features.balloo.su', icon: '💡', status: 'online', latency: 47, uptime: '99.97%' },
  { id: '5', name: 'history.balloo.su', icon: '📜', status: 'busy', latency: 320, uptime: '', note: 'Деградация' },
  { id: '6', name: 'download.balloo.su', icon: '⬇️', status: 'online', latency: 40, uptime: '100%' },
  { id: '7', name: 'docs.balloo.su', icon: '📚', status: 'online', latency: 44, uptime: '100%' },
  { id: '8', name: 'blog.balloo.su', icon: '📝', status: 'online', latency: 49, uptime: '99.96%' },
];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1', title: 'history.balloo.su — повышенная задержка',
    severity: 'minor', nodes: 'history', started: '18.07 14:00', ended: '',
    status: 'investigating', creator: 'АД',
  },
  {
    id: '2', title: 'Сбой WebRTC',
    severity: 'critical', nodes: 'balloo', started: '10.07 09:00', ended: '10.07 10:30',
    status: 'resolved', creator: 'АД',
  },
  {
    id: '3', title: 'Медленная загрузка файлов',
    severity: 'minor', nodes: 'balloo, admin', started: '05.07 14:00', ended: '05.07 15:00',
    status: 'resolved', creator: 'АД',
  },
];

export function AdminServiceStatusScreen() {
  const [nodes] = useState(MOCK_NODES);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('minor');
  const [affectedNodes, setAffectedNodes] = useState('');

  const statusDot = (status: string) =>
    status === 'online' ? 'status-dot status-dot--online'
    : status === 'busy' ? 'status-dot status-dot--busy'
    : 'status-dot status--offline';

  const sevChip = (sev: string) =>
    sev === 'critical' ? 'chip--danger' : sev === 'major' ? 'chip--warning' : 'chip--warning';

  const incidentStatusChip = (status: string) =>
    status === 'investigating' ? 'chip--warning' : 'chip--accent';

  const handleSubmit = () => {
    // В реальности: POST /api/incidents
    console.log('Создан инцидент:', { title, description, severity, affectedNodes });
    setShowForm(false);
    setTitle('');
    setDescription('');
    setSeverity('minor');
    setAffectedNodes('');
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>🚦 Статус сервиса</h1>
        <span className="chip chip--accent" style={{ fontSize: 14, padding: '8px 14px' }}>● Все системы работают</span>
      </div>
      <p className="page-subtitle">Мониторинг узлов Balloo в реальном времени. Обновление каждые 30 секунд.</p>

      {/* Node status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {nodes.map((n) => (
          <div className="card" key={n.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className={statusDot(n.status)} />
              {n.icon} {n.name}
            </div>
            <div className="text-xs text-muted">Задержка: {n.latency} мс</div>
            {n.note ? (
              <div className="text-xs" style={{ color: 'var(--warning)' }}>{n.note}</div>
            ) : (
              <div className="text-xs text-muted">Аптайм: {n.uptime}</div>
            )}
          </div>
        ))}
      </div>

      {/* Active incidents */}
      <h2 className="section-title">Активные инциденты</h2>
      {MOCK_INCIDENTS.filter(i => i.status === 'investigating').map((inc) => (
        <div className="card mb-6" key={inc.id} style={{ borderColor: 'var(--warning)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {inc.nodes.includes('history') ? '📜' : ''} {inc.title}
            </span>
            <span className={`chip ${incidentStatusChip(inc.status)}`}>{inc.status}</span>
          </div>
          <div className="text-sm text-secondary mb-2">
            Заметили повышенную задержку на {inc.nodes}. {inc.status === 'investigating' ? 'Investigating.' : 'Решено.'}
          </div>
          <div className="text-xs text-muted">
            Затронутые узлы: {inc.nodes} · Начало: {inc.started} · Создал: {inc.creator}
          </div>
        </div>
      ))}
      {MOCK_INCIDENTS.filter(i => i.status === 'investigating').length === 0 && (
        <p className="text-secondary text-center py-4">Нет активных инцидентов</p>
      )}

      {/* Create incident */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title" style={{ margin: 0 }}>Создать инцидент</h2>
        {!showForm && (
          <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>+ Создать</button>
        )}
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="form-group">
            <label className="form-label">Заголовок</label>
            <input type="text" className="form-input" placeholder="Краткое описание" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="form-textarea" placeholder="Детали инцидента..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Серьёзность</label>
            <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="minor">minor — минорный</option>
              <option value="major">major — серьёзный</option>
              <option value="critical">critical — критический</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Затронутые узлы</label>
            <input type="text" className="form-input" placeholder="balloo, history, blog..." value={affectedNodes} onChange={(e) => setAffectedNodes(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button className="btn btn--secondary" onClick={() => setShowForm(false)}>Отмена</button>
            <button className="btn btn--primary" onClick={handleSubmit}>Создать инцидент</button>
          </div>
        </div>
      )}

      {/* Incident history */}
      <h2 className="section-title">История инцидентов</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Инцидент</th>
              <th>Серьёзность</th>
              <th>Узлы</th>
              <th>Начало</th>
              <th>Конец</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_INCIDENTS.filter(i => i.status === 'resolved').map((inc) => (
              <tr key={inc.id}>
                <td>{inc.title}</td>
                <td><span className={`chip ${sevChip(inc.severity)}`}>{inc.severity}</span></td>
                <td>{inc.nodes}</td>
                <td>{inc.started}</td>
                <td>{inc.ended || '—'}</td>
                <td><span className={`chip chip--accent`}>resolved</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
