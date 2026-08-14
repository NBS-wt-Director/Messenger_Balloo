// VacancyScreen.tsx — Детальная страница вакансии с описанием, требованиями и кнопкой отклика
// Экран: /hiring/vacancy/:id

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/services/api';

// Типы
interface Vacancy {
  id: string;
  title: string;
  description: string;
  department: string;
  departmentId: string;
  icon: string;
  status: 'active' | 'closed' | 'almost_closed' | 'new';
  location: string;
  employment: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  applicantsCount: number;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  techStack?: string[];
  officeAddress?: string;
  officeDescription?: string;
}

const DEMO_VACANCIES: Record<string, Vacancy> = {
  v1: {
    id: 'v1', title: 'Senior Frontend Developer',
    description: 'React 19 / Next.js 15 · Отдел разработки',
    department: 'Разработка', departmentId: 'd1', icon: '⚛️',
    status: 'active', location: 'Удалённо', employment: 'Полная занятость',
    salaryMin: 200000, salaryMax: 350000, currency: '₽', applicantsCount: 12,
    responsibilities: [
      'Разработка веб-клиента мессенджера на React 19 / Next.js 15',
      'Реализация real-time общения через WebSocket',
      'Интеграция WebRTC для голосовых и видеозвонков',
      'Создание переиспользуемых компонентов дизайн-системы',
      'Оптимизация производительности (Core Web Vitals)',
      'Код-ревью и менторинг middle разработчиков',
    ],
    requirements: [
      '5+ лет коммерческого опыта с React',
      'Глубокое понимание Next.js (SSR, SSG, RSC)',
      'Опыт с WebSocket и real-time приложениями',
      'Знание TypeScript на продвинутом уровне',
      'Опыт с WebRTC — большой плюс',
      'Понимание принципов glassmorphism и дизайн-систем',
    ],
    benefits: [
      'Удалённая работа из любой точки мира',
      'Гибкий график (core hours 12:00–16:00 МСК)',
      'ДМС после испытательного срока',
      'Корпоративный мессенджер (ну, это наш продукт 😄)',
      'Возможность влиять на продукт',
      'Команда без микроменеджмента',
    ],
    techStack: ['React 19', 'Next.js 15', 'TypeScript', 'WebSocket', 'WebRTC'],
    officeAddress: 'Москва, ул. Новый Арбат, 21',
    officeDescription: 'БЦ «Новоарбатский» · 5 мин от м. Свердловская',
  },
  v2: {
    id: 'v2', title: 'Backend Developer (Hono / WebSocket)',
    description: 'Серверная часть мессенджера · Отдел разработки',
    department: 'Разработка', departmentId: 'd1', icon: '🔧',
    status: 'active', location: 'Удалённо', employment: 'Полная занятость',
    salaryMin: 180000, salaryMax: 300000, currency: '₽', applicantsCount: 8,
    responsibilities: [
      'Разработка REST API и WebSocket сервера',
      'Проектирование и оптимизация PostgreSQL запросов',
      'Интеграция с MinIO для хранения файлов',
      'Реализация системы уведомлений',
      'Написание unit и integration тестов',
    ],
    requirements: [
      '3+ лет коммерческого опыта с Node.js / TypeScript',
      'Опыт с WebSocket и real-time системами',
      'Знание PostgreSQL и оптимизации запросов',
      'Понимание принципов микросервисной архитектуры',
      'Опыт с Docker и контейнеризацией',
    ],
    benefits: [
      'Удалённая работа',
      'Современный стек технологий',
      'Возможность влиять на архитектуру',
      'Обучение за счёт компании',
    ],
    techStack: ['Hono', 'Node.js', 'TypeScript', 'PostgreSQL', 'MinIO', 'Docker'],
  },
};

// Добавляем остальные демо-вакансии по умолчанию
const DEFAULT_VACANCY: Vacancy = {
  id: '', title: '', description: '', department: '', departmentId: '', icon: '📋',
  status: 'active', location: 'Удалённо', employment: 'Полная занятость',
  salaryMin: 0, salaryMax: 0, currency: '₽', applicantsCount: 0,
  responsibilities: [], requirements: [], benefits: [],
};

const statusChips: Record<Vacancy['status'], { label: string; className: string }> = {
  active: { label: 'Активна', className: 'chip chip--accent' },
  closed: { label: 'Закрыта', className: 'chip chip--secondary' },
  almost_closed: { label: 'Почти закрыта', className: 'chip chip--warning' },
  new: { label: 'Новая', className: 'chip' },
};

export default function VacancyScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadVacancy();
  }, [id]);

  const loadVacancy = async () => {
    try {
      if (id) {
        const data = await api.getVacancy(id);
        if (data) {
          setVacancy(data as Vacancy);
          return;
        }
      }
    } catch {
      // Fall back to demo
    }

    // Fallback to demo
    if (id && DEMO_VACANCIES[id]) {
      setVacancy(DEMO_VACANCIES[id]);
    } else {
      setVacancy(DEFAULT_VACANCY);
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (!vacancy) return;
    navigate(`/hiring/apply/${vacancy.id}`);
  };

  if (loading) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container text-center py-8 text-muted">Загрузка вакансии...</div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container text-center py-8">
            <p className="text-muted mb-4">Вакансия не найдена</p>
            <button className="btn btn--tertiary" onClick={() => navigate('/hiring/vacancies')}>← Все вакансии</button>
          </div>
        </div>
      </div>
    );
  }

  const status = statusChips[vacancy.status];
  const canApply = vacancy.status === 'active';

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          {/* Кнопка назад */}
          <button className="btn btn--tertiary btn--sm mb-4" onClick={() => navigate('/hiring/vacancies')}>
            ← Все вакансии
          </button>

          {/* Заголовок вакансии */}
          <div className="card mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span style={{ fontSize: '48px' }}>{vacancy.icon}</span>
              <div className="flex-1">
                <h1 className="page-title" style={{ marginBottom: '4px' }}>{vacancy.title}</h1>
                <div className="text-sm text-secondary">{vacancy.description}</div>
              </div>
            </div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <span className={status.className}>{status.label}</span>
              <span className="chip">{vacancy.location}</span>
              <span className="chip">{vacancy.employment}</span>
              {vacancy.salaryMin > 0 && (
                <span className="chip chip--info">
                  {vacancy.salaryMin.toLocaleString('ru-RU')} – {vacancy.salaryMax.toLocaleString('ru-RU')} {vacancy.currency}
                </span>
              )}
            </div>
          </div>

          {/* О позиции */}
          {vacancy.description && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">О позиции</h3>
              <div className="card__body">{vacancy.description}</div>
            </div>
          )}

          {/* Что делать (ответственность) */}
          {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">Что делать</h3>
              <div className="card__body">
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.8' }}>
                  {vacancy.responsibilities.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Что ожидаем (требования) */}
          {vacancy.requirements && vacancy.requirements.length > 0 && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">Что ожидаем</h3>
              <div className="card__body">
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.8' }}>
                  {vacancy.requirements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Что предлагаем (преимущества) */}
          {vacancy.benefits && vacancy.benefits.length > 0 && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">Что предлагаем</h3>
              <div className="card__body">
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.8' }}>
                  {vacancy.benefits.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Стек технологий */}
          {vacancy.techStack && vacancy.techStack.length > 0 && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">Технологии</h3>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {vacancy.techStack.map((tech) => (
                  <span key={tech} className="chip chip--secondary">{tech}</span>
                ))}
              </div>
            </div>
          )}

          {/* Офис */}
          {vacancy.officeAddress && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">📍 Адрес офиса</h3>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '24px' }}>🏢</span>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{vacancy.officeAddress}</div>
                  {vacancy.officeDescription && (
                    <div className="text-xs text-secondary">{vacancy.officeDescription}</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted mt-3">
                📌 {vacancy.location === 'Удалённо' ? 'Удалённая работа из любой точки мира. Офис — по желанию, для встреч и тимбилдингов.' : vacancy.location}
              </div>
            </div>
          )}

          {/* Блок отклика */}
          <div className="card text-center">
            <h3 className="card__title mb-4">Готовы присоединиться?</h3>
            {canApply ? (
              <button
                className="btn btn--primary btn--lg"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? 'Отправка...' : '📝 Откликнуться на вакансию'}
              </button>
            ) : (
              <div className="text-muted">
                Эта вакансия {vacancy.status === 'closed' ? 'закрыта' : 'почти закрыта'}
              </div>
            )}
            <p className="text-xs text-muted mt-4">
              ID вакансии: {vacancy.id} · Откликнулись: {vacancy.applicantsCount} {vacancy.applicantsCount === 1 ? 'человек' : vacancy.applicantsCount < 5 ? 'человека' : 'человек'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
