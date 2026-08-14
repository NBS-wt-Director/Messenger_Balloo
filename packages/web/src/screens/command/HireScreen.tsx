// Hire Screen — Воронка найма
// Визуализация этапов найма: отклики → скрининг → собеседование → оффер → приняты

import { useState } from 'react';

interface FunnelStage {
  label: string;
  count: number;
  color: string;
  icon: string;
}

interface Vacancy {
  id: string;
  title: string;
  department: string;
  candidates: number;
  status: 'active' | 'closing' | 'new';
  statusLabel: string;
  statusClass: string;
}

interface Candidate {
  id: string;
  name: string;
  initials: string;
  position: string;
  stage: string;
  statusLabel: string;
  statusClass: string;
}

const mockFunnel: FunnelStage[] = [
  { label: 'Откликов', count: 45, color: 'var(--info)', icon: '📨' },
  { label: 'Скрининг', count: 18, color: 'var(--warning)', icon: '🔍' },
  { label: 'Собеседование', count: 8, color: 'var(--accent)', icon: '💬' },
  { label: 'Оффер', count: 3, color: 'var(--text-primary)', icon: '📄' },
  { label: 'Приняты', count: 2, color: 'var(--accent)', icon: '🎉' },
];

const mockVacancies: Vacancy[] = [
  { id: '1', title: 'Senior Frontend Developer', department: 'Разработка', candidates: 12, status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent' },
  { id: '2', title: 'Backend Developer', department: 'Разработка', candidates: 8, status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent' },
  { id: '3', title: 'DevOps Engineer', department: 'Инфраструктура', candidates: 5, status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent' },
  { id: '4', title: 'UI/UX Designer', department: 'Дизайн', candidates: 6, status: 'closing', statusLabel: 'Почти закрыта', statusClass: 'chip--warning' },
  { id: '5', title: 'QA Engineer', department: 'Разработка', candidates: 4, status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent' },
  { id: '6', title: 'Technical Writer', department: 'Документация', candidates: 2, status: 'new', statusLabel: 'Новая', statusClass: '' },
];

const mockCandidates: Candidate[] = [
  { id: '1', name: 'Алексей Морозов', initials: 'АМ', position: 'Backend Developer', stage: 'Техническое собеседование', statusLabel: 'Назначено', statusClass: 'chip--warning' },
  { id: '2', name: 'Елена Волкова', initials: 'ЕВ', position: 'UI/UX Designer', stage: 'Тестовое задание', statusLabel: 'В работе', statusClass: 'chip--info' },
  { id: '3', name: 'Дмитрий Соколов', initials: 'ДС', position: 'DevOps Engineer', stage: 'Оффер', statusLabel: 'Оффер', statusClass: 'chip--accent' },
];

export function HireScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="page-title">Найм</h1>
          <p className="page-subtitle">Вакансии • Кандидаты • Этапы собеседований</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
          ✏️ Новая вакансия
        </button>
      </div>

      {/* Hiring Funnel */}
      <div className="card mb-6">
        <h3 className="card__title mb-4">Воронка найма</h3>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          {mockFunnel.map((stage, i) => (
            <div
              key={stage.label}
              className="card flex-1"
              style={{
                minWidth: '120px',
                textAlign: 'center',
                borderLeft: `3px solid ${stage.color}`,
                position: 'relative',
              }}
            >
              {/* Arrow between stages */}
              {i < mockFunnel.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    right: -14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontSize: 16,
                    zIndex: 1,
                  }}
                >
                  →
                </div>
              )}
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stage.icon}</div>
              <div className="text-xs text-muted">{stage.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: stage.color }}>{stage.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Vacancies */}
      <div className="card mb-6">
        <h3 className="card__title mb-4">Открытые вакансии</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Должность</th>
                <th>Отдел</th>
                <th>Кандидатов</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {mockVacancies.map((vacancy) => (
                <tr key={vacancy.id}>
                  <td style={{ fontWeight: 600 }}>{vacancy.title}</td>
                  <td><span className="chip">{vacancy.department}</span></td>
                  <td>{vacancy.candidates}</td>
                  <td><span className={`chip ${vacancy.statusClass}`}>{vacancy.statusLabel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidates on Interview */}
      <div className="card">
        <h3 className="card__title mb-4">Кандидаты на собеседовании</h3>
        {mockCandidates.map((candidate) => (
          <div key={candidate.id} className="list__item" style={{ border: 'none' }}>
            <div className="avatar avatar--sm avatar--bordered avatar--ctx-contact">
              <div className="avatar__inner"><span>{candidate.initials}</span></div>
            </div>
            <div className="flex-1">
              <div className="list__item-title">{candidate.name}</div>
              <div className="list__item-subtitle">
                {candidate.position} · {candidate.stage}
              </div>
            </div>
            <span className={`chip ${candidate.statusClass}`}>{candidate.statusLabel}</span>
          </div>
        ))}
      </div>

      {/* Create Vacancy Modal */}
      {showCreateModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal">
            <div className="modal__header">
              <span className="modal__title">Новая вакансия</span>
              <div className="modal__close" onClick={() => setShowCreateModal(false)}>✕</div>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Должность</label>
                <input type="text" className="form-input" placeholder="Например: Frontend Developer" />
              </div>
              <div className="form-group">
                <label className="form-label">Отдел</label>
                <select className="form-select">
                  <option value="">Выберите отдел</option>
                  <option value="dev">Разработка</option>
                  <option value="design">Дизайн</option>
                  <option value="infra">Инфраструктура</option>
                  <option value="docs">Документация</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea className="form-textarea" placeholder="Опишите обязанности и требования..." rows={4} />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Зарплата от (₽)</label>
                  <input type="number" className="form-input" placeholder="150000" />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Зарплата до (₽)</label>
                  <input type="number" className="form-input" placeholder="250000" />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--tertiary" onClick={() => setShowCreateModal(false)}>Отмена</button>
              <button className="btn btn--primary">Опубликовать</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
