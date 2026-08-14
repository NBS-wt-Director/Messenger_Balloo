// Interviews Screen — Расписание интервью
// Управление интервью с кандидатами: календарь, статусы, типы

import { useState } from 'react';

interface Interview {
  id: string;
  candidate: string;
  initials: string;
  position: string;
  type: 'screening' | 'technical' | 'culture' | 'offer';
  typeLabel: string;
  typeIcon: string;
  date: string;
  time: string;
  interviewer: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  statusLabel: string;
  statusClass: string;
  notes?: string;
}

const mockInterviews: Interview[] = [
  {
    id: '1', candidate: 'Алексей Морозов', initials: 'АМ', position: 'Backend Developer',
    type: 'technical', typeLabel: 'Техническое', typeIcon: '💻',
    date: '16 июля 2026', time: '14:00', interviewer: 'Иван Иванов',
    status: 'scheduled', statusLabel: 'Назначено', statusClass: 'chip--warning',
  },
  {
    id: '2', candidate: 'Елена Волкова', initials: 'ЕВ', position: 'UI/UX Designer',
    type: 'culture', typeLabel: 'Культурный фит', typeIcon: '🤝',
    date: '17 июля 2026', time: '11:00', interviewer: 'Мария Андреева',
    status: 'scheduled', statusLabel: 'Назначено', statusClass: 'chip--warning',
  },
  {
    id: '3', candidate: 'Дмитрий Соколов', initials: 'ДС', position: 'DevOps Engineer',
    type: 'offer', typeLabel: 'Оффер', typeIcon: '📄',
    date: '15 июля 2026', time: '16:00', interviewer: 'Иван Иванов',
    status: 'completed', statusLabel: 'Завершено', statusClass: 'chip--accent',
    notes: 'Кандидат принял оффер!',
  },
  {
    id: '4', candidate: 'Ольга Кузнецова', initials: 'ОК', position: 'Frontend Developer',
    type: 'screening', typeLabel: 'Скрининг', typeIcon: '📞',
    date: '18 июля 2026', time: '10:00', interviewer: 'HR',
    status: 'scheduled', statusLabel: 'Назначено', statusClass: 'chip--warning',
  },
  {
    id: '5', candidate: 'Игорь Попов', initials: 'ИП', position: 'QA Engineer',
    type: 'technical', typeLabel: 'Техническое', typeIcon: '💻',
    date: '14 июля 2026', time: '15:00', interviewer: 'Алексей Козлов',
    status: 'completed', statusLabel: 'Завершено', statusClass: 'chip--accent',
    notes: 'Требуется доработка по алгоритмам',
  },
];

type FilterStatus = 'all' | 'scheduled' | 'completed' | 'cancelled';

const statusLabels: Record<FilterStatus, string> = {
  all: 'Все', scheduled: 'Назначенные', completed: 'Завершённые', cancelled: 'Отменённые',
};

export function InterviewsScreen() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredInterviews = filter === 'all'
    ? mockInterviews
    : mockInterviews.filter(i => i.status === filter);

  const stats = [
    { label: 'Назначено', count: mockInterviews.filter(i => i.status === 'scheduled').length, color: 'var(--warning)' },
    { label: 'Завершено', count: mockInterviews.filter(i => i.status === 'completed').length, color: 'var(--accent)' },
    { label: 'На этой неделе', count: 3, color: 'var(--info)' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="page-title">Интервью</h1>
          <p className="page-subtitle">Расписание собеседований с кандидатами</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
          📅 Назначить интервью
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card flex-1" style={{ minWidth: '140px' }}>
            <div className="text-xs text-muted">{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="tabs mb-4" data-tab-group="interview-filter">
        {(Object.keys(statusLabels) as FilterStatus[]).map((s) => (
          <div
            key={s}
            className={`tab ${filter === s ? 'tab--active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {statusLabels[s]}
          </div>
        ))}
      </div>

      {/* Interviews list */}
      <div className="card">
        {filteredInterviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            Интервью не найдено
          </div>
        ) : (
          filteredInterviews.map((interview) => (
            <div
              key={interview.id}
              className="list__item"
              style={{ border: 'none', cursor: 'pointer', padding: '12px 16px' }}
              onClick={() => { setSelectedInterview(interview); setShowDetail(true); }}
            >
              <div className="avatar avatar--sm avatar--bordered avatar--ctx-contact">
                <div className="avatar__inner"><span>{interview.initials}</span></div>
              </div>
              <div className="flex-1">
                <div className="list__item-title">
                  {interview.candidate}
                  <span className="chip chip--info" style={{ marginLeft: 8, fontSize: '9px' }}>
                    {interview.typeIcon} {interview.typeLabel}
                  </span>
                </div>
                <div className="list__item-subtitle">
                  {interview.position} · {interview.date} в {interview.time}
                </div>
                <div className="text-xs text-muted">
                  Интервьюер: {interview.interviewer}
                </div>
              </div>
              <span className={`chip ${interview.statusClass}`}>{interview.statusLabel}</span>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {showDetail && selectedInterview && (
        <>
          <div className="modal-overlay" onClick={() => setShowDetail(false)} />
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal__header">
              <span className="modal__title">Интервью</span>
              <div className="modal__close" onClick={() => setShowDetail(false)}>✕</div>
            </div>
            <div className="modal__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="avatar avatar--md avatar--bordered avatar--ctx-contact">
                  <div className="avatar__inner"><span>{selectedInterview.initials}</span></div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedInterview.candidate}</div>
                  <div className="text-muted">{selectedInterview.position}</div>
                </div>
              </div>

              <div className="flex gap-4" style={{ marginBottom: 16 }}>
                <div className="card flex-1">
                  <div className="text-xs text-muted">Дата и время</div>
                  <div style={{ fontWeight: 600 }}>{selectedInterview.date}</div>
                  <div>{selectedInterview.time}</div>
                </div>
                <div className="card flex-1">
                  <div className="text-xs text-muted">Тип</div>
                  <div style={{ fontWeight: 600 }}>{selectedInterview.typeIcon} {selectedInterview.typeLabel}</div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="text-xs text-muted">Интервьюер</div>
                <div style={{ fontWeight: 600 }}>{selectedInterview.interviewer}</div>
              </div>

              <div className="card mb-4">
                <div className="text-xs text-muted">Статус</div>
                <span className={`chip ${selectedInterview.statusClass}`}>{selectedInterview.statusLabel}</span>
              </div>

              {selectedInterview.notes && (
                <div className="card mb-4">
                  <div className="text-xs text-muted">Заметки</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedInterview.notes}</div>
                </div>
              )}

              <div className="flex gap-2">
                {selectedInterview.status === 'scheduled' && (
                  <>
                    <button className="btn btn--primary btn--sm">▶ Начать</button>
                    <button className="btn btn--error btn--sm">Отменить</button>
                  </>
                )}
                {selectedInterview.status === 'completed' && (
                  <button className="btn btn--primary btn--sm">✏️ Добавить результат</button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal">
            <div className="modal__header">
              <span className="modal__title">Новое интервью</span>
              <div className="modal__close" onClick={() => setShowCreateModal(false)}>✕</div>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Кандидат</label>
                <select className="form-select">
                  <option value="">Выберите кандидата</option>
                  <option>Алексей Морозов — Backend Developer</option>
                  <option>Елена Волкова — UI/UX Designer</option>
                  <option>Ольга Кузнецова — Frontend Developer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Тип интервью</label>
                <select className="form-select">
                  <option value="screening">📞 Скрининг</option>
                  <option value="technical">💻 Техническое</option>
                  <option value="culture">🤝 Культурный фит</option>
                  <option value="offer">📄 Оффер</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Дата</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Время</label>
                  <input type="time" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Интервьюер</label>
                <select className="form-select">
                  <option>Иван Иванов</option>
                  <option>Мария Андреева</option>
                  <option>Алексей Козлов</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Заметки</label>
                <textarea className="form-textarea" placeholder="Дополнительная информация..." rows={3} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--tertiary" onClick={() => setShowCreateModal(false)}>Отмена</button>
              <button className="btn btn--primary">Назначить</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
