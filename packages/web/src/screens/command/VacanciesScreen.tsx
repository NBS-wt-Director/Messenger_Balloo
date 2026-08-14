// Vacancies Screen — Вакансии портала сотрудников
// Публичная и внутренняя страница вакансий с фильтрацией по отделам

import { useState } from 'react';

interface Vacancy {
  id: string;
  icon: string;
  title: string;
  description: string;
  department: string;
  departmentColor: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  candidates: number;
  status: 'active' | 'closing' | 'new';
  statusLabel: string;
  statusClass: string;
  level?: string;
}

const mockVacancies: Vacancy[] = [
  {
    id: '1', icon: '⚛️', title: 'Senior Frontend Developer (React 19 / Next.js 15)',
    description: 'Создание веб-клиента мессенджера. WebSocket, WebRTC, glassmorphism UI.',
    department: 'Разработка', departmentColor: 'var(--accent)', location: 'Удалённо',
    salaryMin: 200000, salaryMax: 350000, candidates: 12,
    status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent', level: 'Senior',
  },
  {
    id: '2', icon: '🔧', title: 'Backend Developer (Hono / WebSocket)',
    description: 'Серверная часть мессенджера. API, WebSocket, PostgreSQL, MinIO.',
    department: 'Разработка', departmentColor: 'var(--accent)', location: 'Удалённо',
    salaryMin: 180000, salaryMax: 300000, candidates: 8,
    status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent', level: 'Middle+',
  },
  {
    id: '3', icon: '🚀', title: 'DevOps Engineer (K8s / Docker / CI/CD)',
    description: 'Инфраструктура Kubernetes, CI/CD pipelines, мониторинг.',
    department: 'Инфраструктура', departmentColor: 'var(--info)', location: 'Гибрид',
    salaryMin: 220000, salaryMax: 350000, candidates: 5,
    status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent', level: 'Middle+',
  },
  {
    id: '4', icon: '🎨', title: 'UI/UX Designer',
    description: 'Проектирование интерфейсов мессенджера, дизайн-система.',
    department: 'Дизайн', departmentColor: '#a855f7', location: 'Удалённо',
    salaryMin: 150000, salaryMax: 250000, candidates: 6,
    status: 'closing', statusLabel: 'Почти закрыта', statusClass: 'chip--warning', level: 'UI/UX',
  },
  {
    id: '5', icon: '🧪', title: 'QA Engineer (Playwright / Jest)',
    description: 'Автоматизированное и ручное тестирование. E2E, unit, integration.',
    department: 'Разработка', departmentColor: 'var(--accent)', location: 'Удалённо',
    salaryMin: 120000, salaryMax: 200000, candidates: 4,
    status: 'active', statusLabel: 'Активна', statusClass: 'chip--accent', level: 'Middle',
  },
  {
    id: '6', icon: '📝', title: 'Technical Writer',
    description: 'Документация API, пользовательские гайды, внутренние инструкции.',
    department: 'Документация', departmentColor: 'var(--text-muted)', location: 'Удалённо',
    salaryMin: 100000, salaryMax: 180000, candidates: 2,
    status: 'new', statusLabel: 'Новая', statusClass: '', level: 'Docs',
  },
];

const departments = ['Все', 'Разработка', 'Дизайн', 'Инфраструктура', 'Документация'];

const departmentInfo: Record<string, { icon: string; desc: string; departmentColor: string }> = {
  'Разработка': { icon: '⚛️', desc: 'Создаём клиентскую и серверную часть мессенджера. React, Node.js, WebSocket, WebRTC. 5 сотрудников, 3 открытые вакансии.', departmentColor: 'var(--accent)' },
  'Дизайн': { icon: '🎨', desc: 'Проектируем интерфейсы, дизайн-систему, анимации. Figma, прототипы, user research. 3 сотрудника, 1 открытая вакансия.', departmentColor: '#a855f7' },
  'Инфраструктура': { icon: '🚀', desc: 'Kubernetes, Docker, CI/CD, мониторинг, безопасность. 2 сотрудника, 1 открытая вакансия.', departmentColor: 'var(--info)' },
  'Документация': { icon: '📝', desc: 'API docs, пользовательские гайды, внутренние инструкции. 1 сотрудник, 1 открытая вакансия.', departmentColor: 'var(--text-muted)' },
};

function formatSalary(min: number, max: number): string {
  const fmt = (n: number) => n.toLocaleString('ru-RU');
  return `${fmt(min)} – ${fmt(max)} ₽`;
}

export function VacanciesScreen() {
  const [activeDept, setActiveDept] = useState('Все');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredVacancies = activeDept === 'Все'
    ? mockVacancies
    : mockVacancies.filter(v => v.department === activeDept);

  const stats = [
    { label: 'Открытых вакансий', value: mockVacancies.filter(v => v.status === 'active').length.toString(), color: 'var(--accent)' },
    { label: 'Отделов', value: '4', color: 'var(--info)' },
    { label: 'Сотрудников', value: '18', color: 'var(--warning)' },
  ];

  return (
    <div>
      {/* Topbar title only — публичная страница */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="page-title">💼 Вакансии</h1>
          <p className="page-subtitle">Присоединяйтесь к команде Balloo — создавайте независимый мессенджер</p>
        </div>
        {/* Create vacancy button (admin/command users only) */}
        <button
          className="btn btn--primary"
          onClick={() => setShowCreateModal(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          ✏️ Новая вакансия
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card flex-1" style={{ minWidth: '140px' }}>
            <div className="text-xs text-muted">{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Department tabs */}
      <div className="tabs mb-6" data-tab-group="vacancies">
        {departments.map((dept, i) => (
          <div
            key={dept}
            className={`tab ${activeDept === dept ? 'tab--active' : ''}`}
            onClick={() => setActiveDept(dept)}
          >
            {dept}
          </div>
        ))}
      </div>

      {/* Department info card */}
      {activeDept !== 'Все' && departmentInfo[activeDept] && (
        <div
          className="card mb-4"
          style={{ borderLeft: `3px solid ${departmentInfo[activeDept].departmentColor || 'var(--accent)'}` }}
        >
          <h3 className="card__title mb-2">
            {departmentInfo[activeDept].icon} Отдел {activeDept}
          </h3>
          <p className="text-sm text-secondary">{departmentInfo[activeDept].desc}</p>
        </div>
      )}

      {/* Vacancy cards */}
      {filteredVacancies.map((vacancy) => (
        <div
          key={vacancy.id}
          className="card mb-4 card--hover"
          style={{ cursor: 'pointer' }}
          onClick={() => {}}
        >
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '36px' }}>{vacancy.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`chip ${vacancy.statusClass}`}>{vacancy.statusLabel}</span>
                {vacancy.level && <span className="chip">{vacancy.level}</span>}
                <span className="chip">{vacancy.department}</span>
                <span className="chip">{vacancy.location}</span>
              </div>
              <div className="card__title">{vacancy.title}</div>
              <div className="card__body text-sm">{vacancy.description}</div>
              <div className="text-xs text-muted mt-2">
                {formatSalary(vacancy.salaryMin, vacancy.salaryMax)} · {vacancy.candidates} {vacancy.candidates === 1 ? 'кандидат' : vacancy.candidates < 5 ? 'кандидата' : 'кандидатов'}
              </div>
            </div>
            <span className="text-muted" style={{ fontSize: '20px' }}>→</span>
          </div>
        </div>
      ))}

      {/* Why us link */}
      <div className="text-center mt-6">
        <button className="btn btn--secondary btn--lg">
          ⭐ Почему именно наша команда?
        </button>
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
              <div className="form-group">
                <label className="form-label">Формат работы</label>
                <select className="form-select">
                  <option value="remote">Удалённо</option>
                  <option value="hybrid">Гибрид</option>
                  <option value="office">Офис</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--tertiary" onClick={() => setShowCreateModal(false)}>
                Отмена
              </button>
              <button className="btn btn--primary">Опубликовать</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
