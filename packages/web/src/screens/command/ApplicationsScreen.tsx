// Applications Screen — Заявки на работу (HR-модуль)
// Pipeline заявок с фильтрами по статусу, статусам и поиском

import { useState } from 'react';

interface Application {
  id: string;
  candidate: string;
  initials: string;
  email: string;
  position: string;
  department: string;
  date: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'accepted' | 'rejected';
  statusLabel: string;
  statusClass: string;
  experience: string;
  salary: string;
  github?: string;
  resume?: string;
}

const mockApplications: Application[] = [
  {
    id: '1', candidate: 'Алексей Морозов', initials: 'АМ', email: 'a.morozov@email.ru',
    position: 'Backend Developer', department: 'Разработка', date: '15 июля 2026',
    status: 'screening', statusLabel: 'Скрининг', statusClass: 'chip--info',
    experience: '3 года', salary: '250 000 ₽', github: 'github.com/morozov',
  },
  {
    id: '2', candidate: 'Елена Волкова', initials: 'ЕВ', email: 'e.volkova@email.ru',
    position: 'UI/UX Designer', department: 'Дизайн', date: '14 июля 2026',
    status: 'interview', statusLabel: 'Собеседование', statusClass: 'chip--warning',
    experience: '5 лет', salary: '200 000 ₽', github: 'github.com/volkova',
    resume: 'resume.pdf',
  },
  {
    id: '3', candidate: 'Дмитрий Соколов', initials: 'ДС', email: 'd.sokolov@email.ru',
    position: 'DevOps Engineer', department: 'Инфраструктура', date: '13 июля 2026',
    status: 'offer', statusLabel: 'Оффер', statusClass: 'chip--accent',
    experience: '4 года', salary: '300 000 ₽',
  },
  {
    id: '4', candidate: 'Ольга Кузнецова', initials: 'ОК', email: 'o.kuznetsova@email.ru',
    position: 'Frontend Developer', department: 'Разработка', date: '12 июля 2026',
    status: 'new', statusLabel: 'Новая', statusClass: '',
    experience: '2 года', salary: '180 000 ₽', github: 'github.com/kuznetsova',
  },
  {
    id: '5', candidate: 'Игорь Попов', initials: 'ИП', email: 'i.popov@email.ru',
    position: 'QA Engineer', department: 'Разработка', date: '11 июля 2026',
    status: 'rejected', statusLabel: 'Отклонена', statusClass: 'chip--error',
    experience: '1 год', salary: '120 000 ₽',
  },
  {
    id: '6', candidate: 'Анна Новикова', initials: 'АН', email: 'a.novikova@email.ru',
    position: 'Technical Writer', department: 'Документация', date: '10 июля 2026',
    status: 'accepted', statusLabel: 'Принята', statusClass: 'chip--accent',
    experience: '3 года', salary: '150 000 ₽',
  },
];

type FilterStatus = 'all' | 'new' | 'screening' | 'interview' | 'offer' | 'accepted' | 'rejected';

const statusOrder: FilterStatus[] = ['new', 'screening', 'interview', 'offer', 'accepted', 'rejected'];

const statusLabels: Record<FilterStatus, string> = {
  all: 'Все', new: 'Новые', screening: 'Скрининг', interview: 'Собеседование',
  offer: 'Оффер', accepted: 'Принятые', rejected: 'Отклонённые',
};

export function ApplicationsScreen() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredApplications = mockApplications
    .filter(app => filter === 'all' || app.status === filter)
    .filter(app => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return app.candidate.toLowerCase().includes(q) || app.position.toLowerCase().includes(q) || app.email.toLowerCase().includes(q);
    });

  const stats = [
    { label: 'Новые', count: mockApplications.filter(a => a.status === 'new').length, color: 'var(--text-muted)' },
    { label: 'Скрининг', count: mockApplications.filter(a => a.status === 'screening').length, color: 'var(--info)' },
    { label: 'Собеседование', count: mockApplications.filter(a => a.status === 'interview').length, color: 'var(--warning)' },
    { label: 'Оффер', count: mockApplications.filter(a => a.status === 'offer').length, color: 'var(--accent)' },
    { label: 'Приняты', count: mockApplications.filter(a => a.status === 'accepted').length, color: 'var(--accent)' },
    { label: 'Отклонены', count: mockApplications.filter(a => a.status === 'rejected').length, color: 'var(--error)' },
  ];

  const handleOpenDetail = (app: Application) => {
    setSelectedApp(app);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedApp(null);
  };

  return (
    <div>
      <h1 className="page-title">Заявки на работу</h1>
      <p className="page-subtitle">Управление кандидатами и статусами заявок</p>

      {/* Pipeline stats */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            className="card flex-1"
            style={{ minWidth: '100px', textAlign: 'center', cursor: 'pointer', opacity: filter === 'all' || s.label === statusLabels[filter as FilterStatus] ? 1 : 0.6 }}
            onClick={() => {
              const mapped: Record<string, FilterStatus> = {
                'Новые': 'new', 'Скрининг': 'screening', 'Собеседование': 'interview',
                'Оффер': 'offer', 'Приняты': 'accepted', 'Отклонены': 'rejected',
              };
              setFilter(mapped[s.label] || 'all');
            }}
          >
            <div className="text-xs text-muted">{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Поиск по имени, должности, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 12 }}
          />
        </div>
        <div className="tabs" data-tab-group="app-filter" style={{ display: 'flex', gap: 0 }}>
          {statusOrder.map((s) => (
            <div
              key={s}
              className={`tab ${filter === s ? 'tab--active' : ''}`}
              onClick={() => setFilter(s)}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              {statusLabels[s]}
            </div>
          ))}
        </div>
      </div>

      {/* Applications list */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Кандидат</th>
                <th>Должность</th>
                <th>Отдел</th>
                <th>Дата</th>
                <th>Опыт</th>
                <th>Зарплата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    Заявок не найдено
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar--sm avatar--bordered avatar--ctx-contact">
                          <div className="avatar__inner"><span>{app.initials}</span></div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.candidate}</div>
                          <div className="text-xs text-muted">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{app.position}</td>
                    <td><span className="chip">{app.department}</span></td>
                    <td className="text-muted">{app.date}</td>
                    <td>{app.experience}</td>
                    <td>{app.salary}</td>
                    <td><span className={`chip ${app.statusClass}`}>{app.statusLabel}</span></td>
                    <td>
                      <button className="btn btn--tertiary btn--sm" onClick={() => handleOpenDetail(app)}>
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {showDetail && selectedApp && (
        <>
          <div className="modal-overlay" onClick={handleCloseDetail} />
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal__header">
              <span className="modal__title">Заявка: {selectedApp.candidate}</span>
              <div className="modal__close" onClick={handleCloseDetail}>✕</div>
            </div>
            <div className="modal__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="avatar avatar--md avatar--bordered avatar--ctx-contact">
                  <div className="avatar__inner"><span>{selectedApp.initials}</span></div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedApp.candidate}</div>
                  <div className="text-muted">{selectedApp.email}</div>
                </div>
                <span className={`chip ${selectedApp.statusClass}`} style={{ marginLeft: 'auto' }}>
                  {selectedApp.statusLabel}
                </span>
              </div>

              <div className="flex gap-4" style={{ marginBottom: 16 }}>
                <div className="card flex-1">
                  <div className="text-xs text-muted">Должность</div>
                  <div style={{ fontWeight: 600 }}>{selectedApp.position}</div>
                </div>
                <div className="card flex-1">
                  <div className="text-xs text-muted">Отдел</div>
                  <div style={{ fontWeight: 600 }}>{selectedApp.department}</div>
                </div>
              </div>

              <div className="flex gap-4" style={{ marginBottom: 16 }}>
                <div className="card flex-1">
                  <div className="text-xs text-muted">Опыт</div>
                  <div style={{ fontWeight: 600 }}>{selectedApp.experience}</div>
                </div>
                <div className="card flex-1">
                  <div className="text-xs text-muted">Зарплата</div>
                  <div style={{ fontWeight: 600 }}>{selectedApp.salary}</div>
                </div>
              </div>

              {selectedApp.github && (
                <div className="card mb-4">
                  <div className="text-xs text-muted">GitHub</div>
                  <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{selectedApp.github}</a>
                </div>
              )}

              {selectedApp.resume && (
                <div className="card mb-4">
                  <div className="text-xs text-muted">Резюме</div>
                  <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{selectedApp.resume}</a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {selectedApp.status !== 'accepted' && (
                  <button className="btn btn--primary btn--sm">✓ Принять</button>
                )}
                {selectedApp.status !== 'rejected' && (
                  <button className="btn btn--error btn--sm">✕ Отклонить</button>
                )}
                {selectedApp.status === 'new' && (
                  <button className="btn btn--info btn--sm">Переместить → Скрининг</button>
                )}
                {selectedApp.status === 'screening' && (
                  <button className="btn btn--warning btn--sm">Переместить → Собеседование</button>
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--tertiary" onClick={handleCloseDetail}>Закрыть</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
