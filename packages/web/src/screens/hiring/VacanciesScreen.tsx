// VacanciesScreen.tsx — Список вакансий с фильтрами по отделам
// Экран: /hiring/vacancies

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

// Типы
interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  vacancyCount: number;
  employeeCount: number;
}

interface Vacancy {
  id: string;
  title: string;
  description: string;
  department: Department;
  departmentId: string;
  icon: string;
  status: 'active' | 'closed' | 'almost_closed' | 'new';
  location: string;
  employment: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  applicantsCount: number;
  techStack?: string[];
}

// Моковые данные для демо (заглушка до подключения бэкенда)
const DEMO_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Разработка', description: 'Создаём клиентскую и серверную часть мессенджера. React, Node.js, WebSocket, WebRTC.', icon: '⚛️', vacancyCount: 3, employeeCount: 5 },
  { id: 'd2', name: 'Дизайн', description: 'Проектируем интерфейсы, дизайн-систему, анимации. Figma, прототипы, user research.', icon: '🎨', vacancyCount: 1, employeeCount: 3 },
  { id: 'd3', name: 'Инфраструктура', description: 'Kubernetes, Docker, CI/CD, мониторинг, безопасность.', icon: '🚀', vacancyCount: 1, employeeCount: 2 },
  { id: 'd4', name: 'Документация', description: 'API docs, пользовательские гайды, внутренние инструкции.', icon: '📝', vacancyCount: 1, employeeCount: 1 },
];

const DEMO_VACANCIES: Vacancy[] = [
  {
    id: 'v1', title: 'Senior Frontend Developer (React 19 / Next.js 15)',
    description: 'Создание веб-клиента мессенджера. WebSocket, WebRTC, glassmorphism UI.',
    department: DEMO_DEPARTMENTS[0], departmentId: 'd1', icon: '⚛️',
    status: 'active', location: 'Удалённо', employment: 'Полная занятость',
    salaryMin: 200000, salaryMax: 350000, currency: '₽', applicantsCount: 12,
    techStack: ['React 19', 'Next.js 15', 'TypeScript', 'WebSocket', 'WebRTC'],
  },
  {
    id: 'v2', title: 'Backend Developer (Hono / WebSocket)',
    description: 'Серверная часть мессенджера. API, WebSocket, PostgreSQL, MinIO.',
    department: DEMO_DEPARTMENTS[0], departmentId: 'd1', icon: '🔧',
    status: 'active', location: 'Удалённо', employment: 'Полная занятость',
    salaryMin: 180000, salaryMax: 300000, currency: '₽', applicantsCount: 8,
    techStack: ['Hono', 'Node.js', 'PostgreSQL', 'MinIO', 'WebSocket'],
  },
  {
    id: 'v3', title: 'DevOps Engineer (K8s / Docker / CI/CD)',
    description: 'Инфраструктура Kubernetes, CI/CD pipelines, мониторинг.',
    department: DEMO_DEPARTMENTS[2], departmentId: 'd3', icon: '🚀',
    status: 'active', location: 'Гибрид', employment: 'Полная занятость',
    salaryMin: 220000, salaryMax: 350000, currency: '₽', applicantsCount: 5,
    techStack: ['Kubernetes', 'Docker', 'CI/CD', 'Prometheus', 'Grafana'],
  },
  {
    id: 'v4', title: 'UI/UX Designer',
    description: 'Проектирование интерфейсов мессенджера, дизайн-система.',
    department: DEMO_DEPARTMENTS[1], departmentId: 'd2', icon: '🎨',
    status: 'almost_closed', location: 'Удалённо', employment: 'Полная занятость',
    salaryMin: 150000, salaryMax: 250000, currency: '₽', applicantsCount: 6,
    techStack: ['Figma', 'Design System', 'Prototyping', 'User Research'],
  },
  {
    id: 'v5', title: 'QA Engineer (Playwright / Jest)',
    description: 'Автоматизированное и ручное тестирование. E2E, unit, integration.',
    department: DEMO_DEPARTMENTS[0], departmentId: 'd1', icon: '🧪',
    status: 'active', location: 'Удалённо', employment: 'Полная занятость',
    salaryMin: 120000, salaryMax: 200000, currency: '₽', applicantsCount: 4,
    techStack: ['Playwright', 'Jest', 'Cypress', 'Testing Library'],
  },
  {
    id: 'v6', title: 'Technical Writer',
    description: 'Документация API, пользовательские гайды, внутренние инструкции.',
    department: DEMO_DEPARTMENTS[3], departmentId: 'd4', icon: '📝',
    status: 'new', location: 'Удалённо', employment: 'Проектная работа',
    salaryMin: 100000, salaryMax: 180000, currency: '₽', applicantsCount: 2,
    techStack: ['Markdown', 'API Docs', 'Technical Writing'],
  },
];

const formatSalary = (min: number, max: number, currency: string) =>
  `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ${currency}`;

const statusChips: Record<Vacancy['status'], { label: string; className: string }> = {
  active: { label: 'Активна', className: 'chip--accent' },
  closed: { label: 'Закрыта', className: 'chip--secondary' },
  almost_closed: { label: 'Почти закрыта', className: 'chip--warning' },
  new: { label: 'Новая', className: 'chip' },
};

export default function VacanciesScreen() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>(DEMO_DEPARTMENTS);
  const [vacancies, setVacancies] = useState<Vacancy[]>(DEMO_VACANCIES);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const [deptsRes, vacRes] = await Promise.all([
        api.getDepartments().catch(() => DEMO_DEPARTMENTS),
        api.getVacancies().catch(() => DEMO_VACANCIES),
      ]);
      if (deptsRes && deptsRes.length) setDepartments(deptsRes);
      if (vacRes && vacRes.length) setVacancies(vacRes);
    } catch {
      // Fallback to demo data
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация вакансий по отделу
  const filteredVacancies = activeTab === 'all'
    ? vacancies
    : vacancies.filter(v => v.departmentId === activeTab);

  // Статистика
  const totalOpen = vacancies.filter(v => v.status === 'active').length;
  const totalApplicants = vacancies.reduce((sum, v) => sum + v.applicantsCount, 0);

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          {/* Заголовок */}
          <h1 className="page-title">💼 Вакансии</h1>
          <p className="page-subtitle">Присоединяйтесь к команде Balloo — создавайте независимый мессенджер</p>

          {/* KPI карточки */}
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: '140px' }}>
              <div className="text-xs text-muted">Открытых вакансий</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>{totalOpen}</div>
            </div>
            <div className="card flex-1" style={{ minWidth: '140px' }}>
              <div className="text-xs text-muted">Отделов</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--info)' }}>{departments.length}</div>
            </div>
            <div className="card flex-1" style={{ minWidth: '140px' }}>
              <div className="text-xs text-muted">Сотрудников</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)' }}>
                {departments.reduce((sum, d) => sum + d.employeeCount, 0)}
              </div>
            </div>
          </div>

          {/* Табы по отделам */}
          <div className="tabs mb-6" data-tab-group="department">
            <div
              className={`tab ${activeTab === 'all' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Все
            </div>
            {departments.map((dept, i) => (
              <div
                key={dept.id}
                className={`tab ${activeTab === dept.id ? 'tab--active' : ''}`}
                onClick={() => setActiveTab(dept.id)}
              >
                {dept.name}
              </div>
            ))}
          </div>

          {/* Список вакансий */}
          {loading ? (
            <div className="text-center py-8 text-muted">Загрузка вакансий...</div>
          ) : (
            filteredVacancies.map((vacancy) => {
              const status = statusChips[vacancy.status];
              return (
                <div
                  key={vacancy.id}
                  className="card mb-4 card--hover"
                  onClick={() => navigate(`/hiring/vacancy/${vacancy.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize: '36px' }}>{vacancy.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                        <span className={`chip ${status.className}`}>{status.label}</span>
                        <span className="chip">{vacancy.department.name}</span>
                        <span className="chip">{vacancy.location}</span>
                      </div>
                      <div className="card__title">{vacancy.title}</div>
                      <div className="card__body text-sm">{vacancy.description}</div>
                      {vacancy.techStack && (
                        <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
                          {vacancy.techStack.slice(0, 3).map((tech) => (
                            <span key={tech} className="chip chip--secondary" style={{ fontSize: '11px' }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted mt-2">
                        {formatSalary(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency)} · {vacancy.applicantsCount} {vacancy.applicantsCount === 1 ? 'кандидат' : vacancy.applicantsCount < 5 ? 'кандидата' : 'кандидатов'}
                      </div>
                    </div>
                    <span className="text-muted" style={{ fontSize: '20px' }}>→</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Кнопка "Почему мы" */}
          <div className="text-center mt-6">
            <button className="btn btn--secondary btn--lg" onClick={() => navigate('/hiring/why-us')}>
              ⭐ Почему именно наша команда?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
