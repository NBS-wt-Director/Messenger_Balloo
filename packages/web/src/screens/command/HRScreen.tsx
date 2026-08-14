// HR Screen — HR-модуль портала сотрудников
// Заявки на работу, онбординг, рассылки, команда

import { useState } from 'react';

interface Application {
  id: string;
  candidate: string;
  initials: string;
  position: string;
  date: string;
  status: 'new' | 'screening' | 'interview' | 'offer';
  statusLabel: string;
  statusClass: string;
}

interface OnboardingMember {
  id: string;
  name: string;
  initials: string;
  position: string;
  day: number;
  totalDays: number;
  status: 'active' | 'start';
  statusLabel: string;
  statusClass: string;
  online: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  position: string;
  role?: string;
  online: boolean;
  busy: boolean;
  vacation: boolean;
}

const mockApplications: Application[] = [
  { id: '1', candidate: 'Алексей Морозов', initials: 'АМ', position: 'Backend Developer', date: '15 июля', status: 'screening', statusLabel: 'Скрининг', statusClass: 'chip--info' },
  { id: '2', candidate: 'Елена Волкова', initials: 'ЕВ', position: 'UI/UX Designer', date: '14 июля', status: 'interview', statusLabel: 'Собеседование', statusClass: 'chip--warning' },
  { id: '3', candidate: 'Дмитрий Соколов', initials: 'ДС', position: 'DevOps Engineer', date: '13 июля', status: 'offer', statusLabel: 'Оффер', statusClass: 'chip--accent' },
  { id: '4', candidate: 'Ольга Кузнецова', initials: 'ОК', position: 'Frontend Developer', date: '12 июля', status: 'new', statusLabel: 'Новая', statusClass: '' },
];

const mockOnboarding: OnboardingMember[] = [
  { id: '1', name: 'Мария Андреева', initials: 'МА', position: 'UI/UX Designer', day: 3, totalDays: 14, status: 'active', statusLabel: 'В процессе', statusClass: 'chip--warning', online: true },
  { id: '2', name: 'Дмитрий Петров', initials: 'ДП', position: 'Backend Developer', day: 1, totalDays: 14, status: 'start', statusLabel: 'Старт', statusClass: 'chip--info', online: true },
];

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Иван Иванов', initials: 'ИВ', position: 'Tech Lead', role: 'Lead', online: true, busy: false, vacation: false },
  { id: '2', name: 'Алексей Козлов', initials: 'АК', position: 'Backend Developer', online: true, busy: false, vacation: false },
  { id: '3', name: 'Ольга Смирнова', initials: 'ОС', position: 'DevOps Engineer', busy: false, vacation: true, online: false },
  { id: '4', name: 'Елена Волкова', initials: 'ЕВ', position: 'UI/UX Designer', online: true, busy: false, vacation: false },
  { id: '5', name: 'Дмитрий Соколов', initials: 'ДС', position: 'DevOps Engineer', online: true, busy: false, vacation: false },
];

type TabType = 'applications' | 'onboarding' | 'team';

export function HRScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('applications');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRecipients, setBroadcastRecipients] = useState('all');

  // Stats
  const stats = [
    { label: 'Сотрудников', value: '24', color: 'var(--accent)' },
    { label: 'Открытых вакансий', value: '6', color: 'var(--info)' },
    { label: 'Кандидатов', value: '18', color: 'var(--warning)' },
    { label: 'На онбординге', value: '2', color: 'var(--text-primary)' },
  ];

  const filteredApplications = filter === 'all' ? mockApplications : mockApplications.filter(a => a.status === filter);

  return (
    <div>
      <h1 className="page-title">HR-модуль</h1>
      <p className="page-subtitle">Заявки на работу • Онбординг • Рассылки</p>

      {/* Stats */}
      <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card flex-1" style={{ minWidth: '150px' }}>
            <div className="text-xs text-muted">{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs mb-4" data-tab-group="hr">
        <div
          className={`tab ${activeTab === 'applications' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Заявки ({mockApplications.length})
        </div>
        <div
          className={`tab ${activeTab === 'onboarding' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('onboarding')}
        >
          🎓 Онбординг ({mockOnboarding.length})
        </div>
        <div
          className={`tab ${activeTab === 'team' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          👥 Команда ({mockTeam.length})
        </div>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="card mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card__title" style={{ marginBottom: 0 }}>Заявки на работу</h3>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Все' },
                { key: 'new', label: 'Новые' },
                { key: 'screening', label: 'Скрининг' },
                { key: 'interview', label: 'Собеседование' },
                { key: 'offer', label: 'Оффер' },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`btn ${filter === f.key ? 'btn--primary' : 'btn--tertiary'} btn--sm`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Кандидат</th>
                  <th>Должность</th>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar--sm avatar--bordered avatar--ctx-contact">
                          <div className="avatar__inner"><span>{app.initials}</span></div>
                        </div>
                        <span>{app.candidate}</span>
                      </div>
                    </td>
                    <td>{app.position}</td>
                    <td className="text-muted">{app.date}</td>
                    <td><span className={`chip ${app.statusClass}`}>{app.statusLabel}</span></td>
                    <td>
                      <button className="btn btn--tertiary btn--sm">Открыть</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
        <div className="card mb-4">
          <h3 className="card__title mb-4">Онбординг (новые сотрудники)</h3>
          {mockOnboarding.map((member) => (
            <div key={member.id} className="list__item" style={{ border: 'none' }}>
              <div
                className={`avatar avatar--sm avatar--bordered ${member.online ? 'avatar--status-online' : ''} avatar--ctx-contact`}
              >
                <div className="avatar__inner"><span>{member.initials}</span></div>
              </div>
              <div className="flex-1">
                <div className="list__item-title">{member.name}</div>
                <div className="list__item-subtitle">
                  {member.position} • День {member.day} из {member.totalDays}
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 6, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(member.day / member.totalDays) * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
              <span className={`chip ${member.statusClass}`}>{member.statusLabel}</span>
            </div>
          ))}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="card">
          <h3 className="card__title mb-4">Команда</h3>
          {mockTeam.map((member) => (
            <div key={member.id} className="list__item" style={{ border: 'none' }}>
              <div
                className={`avatar avatar--sm avatar--bordered ${member.online ? 'avatar--status-online' : ''} ${member.vacation ? 'avatar--status-busy' : ''} avatar--ctx-contact`}
              >
                <div className="avatar__inner"><span>{member.initials}</span></div>
              </div>
              <div className="flex-1">
                <div className="list__item-title">
                  {member.name}
                  {member.role && <span className="chip chip--accent" style={{ fontSize: '9px' }}>{member.role}</span>}
                </div>
                <div className="list__item-subtitle">
                  {member.position}
                  {member.vacation && ' • В отпуске'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)} />
      )}
      {showBroadcastModal && (
        <div className="modal modal--status-info">
          <div className="modal__header">
            <span className="modal__title">Рассылка сотрудникам</span>
            <div className="modal__close" onClick={() => setShowBroadcastModal(false)}>✕</div>
          </div>
          <div className="modal__body">
            <div className="form-group">
              <label className="form-label">Тема</label>
              <input
                type="text"
                className="form-input"
                placeholder="Тема рассылки"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Сообщение</label>
              <textarea
                className="form-textarea"
                placeholder="Текст сообщения..."
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Получатели</label>
              <select
                className="form-select"
                value={broadcastRecipients}
                onChange={(e) => setBroadcastRecipients(e.target.value)}
              >
                <option value="all">Все сотрудники</option>
                <option value="dev">Отдел разработки</option>
                <option value="design">Дизайн</option>
                <option value="devops">DevOps</option>
                <option value="hr">HR</option>
              </select>
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn--tertiary" onClick={() => setShowBroadcastModal(false)}>
              Отмена
            </button>
            <button className="btn btn--primary">Отправить</button>
          </div>
        </div>
      )}

      {/* Broadcast button in topbar area */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn--secondary" onClick={() => setShowBroadcastModal(true)} title="Рассылка">
          📢 Рассылка
        </button>
      </div>
    </div>
  );
}
