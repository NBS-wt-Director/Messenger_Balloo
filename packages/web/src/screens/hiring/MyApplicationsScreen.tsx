// MyApplicationsScreen.tsx — Мои отклики и их статусы
// Экран: /hiring/applications

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

// Типы
type ApplicationStatus = 'submitted' | 'under_review' | 'interview' | 'offer' | 'rejected' | 'hired';

interface Application {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  vacancyIcon: string;
  department: string;
  status: ApplicationStatus;
  submittedAt: number; // timestamp
  coverLetter: string;
  resumeUrl: string;
  interview?: {
    id: string;
    date: number;
    type: 'phone' | 'video' | 'onsite' | 'take_home';
    status: 'scheduled' | 'completed' | 'cancelled';
    interviewer?: string;
    notes?: string;
  };
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string; icon: string; description: string }> = {
  submitted: { label: 'Отправлена', className: 'chip', icon: '📤', description: 'Заявка получена, ожидает просмотра' },
  under_review: { label: 'На рассмотрении', className: 'chip--info', icon: '🔍', description: 'HR просматривает вашу заявку' },
  interview: { label: 'Интервью', className: 'chip--warning', icon: '📞', description: 'Приглашение на интервью' },
  offer: { label: 'Оффер', className: 'chip--accent', icon: '🎉', description: 'Вам сделано предложение' },
  rejected: { label: 'Отказ', className: 'chip--secondary', icon: '✕', description: 'К сожалению, на этот раз не подошли' },
  hired: { label: 'Нанят!', className: 'chip chip--accent', icon: '🏆', description: 'Добро пожаловать в команду!' },
};

// Моковые данные
const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'a1', vacancyId: 'v1', vacancyTitle: 'Senior Frontend Developer',
    vacancyIcon: '⚛️', department: 'Отдел разработки',
    status: 'interview', submittedAt: Date.now() - 7 * 86400000,
    coverLetter: 'Имею 6 лет опыта с React...',
    resumeUrl: 'https://resume.example.com',
    interview: {
      id: 'i1', date: Date.now() + 2 * 86400000,
      type: 'video', status: 'scheduled',
      interviewer: 'Алексей, Tech Lead',
      notes: 'Первое интервью, 60 минут, Google Meet',
    },
  },
  {
    id: 'a2', vacancyId: 'v4', vacancyTitle: 'UI/UX Designer',
    vacancyIcon: '🎨', department: 'Дизайн',
    status: 'under_review', submittedAt: Date.now() - 3 * 86400000,
    coverLetter: '5 лет опыта в UI/UX...',
    resumeUrl: 'https://portfolio.example.com',
  },
  {
    id: 'a3', vacancyId: 'v5', vacancyTitle: 'QA Engineer',
    vacancyIcon: '🧪', department: 'Отдел разработки',
    status: 'rejected', submittedAt: Date.now() - 30 * 86400000,
    coverLetter: 'Опыт в тестировании 2 года...',
    resumeUrl: 'https://resume.example.com',
  },
];

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед. назад`;
  const months = Math.floor(days / 30);
  return `${months} мес. назад`;
};

export default function MyApplicationsScreen() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await api.getMyApplications();
      if (data && data.length) {
        setApplications(data);
      }
    } catch {
      // Fallback to demo
    }
    setApplications(DEMO_APPLICATIONS);
    setLoading(false);
  };

  // Статистика
  const activeCount = applications.filter(a =>
    ['submitted', 'under_review', 'interview', 'offer'].includes(a.status)
  ).length;

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  // Сортировка: сначала активные, потом по дате
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const activeOrder = ['submitted', 'under_review', 'interview', 'offer', 'rejected', 'hired'];
    const orderDiff = activeOrder.indexOf(a.status) - activeOrder.indexOf(b.status);
    if (orderDiff !== 0) return orderDiff;
    return b.submittedAt - a.submittedAt;
  });

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title">📋 Мои отклики</h1>
              <p className="page-subtitle">Отслеживайте статус ваших заявок</p>
            </div>
            <button className="btn btn--primary" onClick={() => navigate('/hiring/vacancies')}>
              + Новая заявка
            </button>
          </div>

          {/* KPI карточки */}
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: '120px' }}>
              <div className="text-xs text-muted">Всего откликов</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {applications.length}
              </div>
            </div>
            <div className="card flex-1" style={{ minWidth: '120px' }}>
              <div className="text-xs text-muted">Активных</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>
                {activeCount}
              </div>
            </div>
            <div className="card flex-1" style={{ minWidth: '120px' }}>
              <div className="text-xs text-muted">Интервью</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)' }}>
                {applications.filter(a => a.status === 'interview' && a.interview?.status === 'scheduled').length}
              </div>
            </div>
          </div>

          {/* Фильтры */}
          <div className="tabs mb-6" data-tab-group="application-status">
            <div
              className={`tab ${filter === 'all' ? 'tab--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все ({applications.length})
            </div>
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = applications.filter(a => a.status === key).length;
              if (count === 0) return null;
              return (
                <div
                  key={key}
                  className={`tab ${filter === key ? 'tab--active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {config.icon} {config.label} ({count})
                </div>
              );
            })}
          </div>

          {/* Список откликов */}
          {loading ? (
            <div className="text-center py-8 text-muted">Загрузка откликов...</div>
          ) : sortedApplications.length === 0 ? (
            <div className="text-center py-8">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p className="text-muted mb-4">У вас пока нет откликов</p>
              <button className="btn btn--primary" onClick={() => navigate('/hiring/vacancies')}>
                Смотреть вакансии
              </button>
            </div>
          ) : (
            sortedApplications.map((app) => {
              const config = statusConfig[app.status];
              return (
                <div
                  key={app.id}
                  className={`card mb-4 ${app.status !== 'rejected' ? 'card--hover' : ''}`}
                  onClick={() => app.status !== 'rejected' && navigate(`/hiring/application/${app.id}`)}
                  style={{ cursor: app.status !== 'rejected' ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize: '36px' }}>{app.vacancyIcon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                        <span className={`chip ${config.className}`}>
                          {config.icon} {config.label}
                        </span>
                        <span className="chip">{app.department}</span>
                      </div>
                      <div className="card__title">{app.vacancyTitle}</div>
                      <div className="text-xs text-muted mt-1">
                        Откликнут{app.submittedAt === Date.now() ? '' : 'сь'}: {formatRelativeTime(app.submittedAt)}
                      </div>

                      {/* Описание статуса */}
                      <div className="text-xs text-secondary mt-2">{config.description}</div>

                      {/* Информация об интервью */}
                      {app.interview && app.interview.status === 'scheduled' && (
                        <div className="card mt-3" style={{ background: 'rgba(255,183,77,0.08)', borderColor: 'var(--warning)' }}>
                          <div className="flex items-center gap-3">
                            <span style={{ fontSize: '20px' }}>📅</span>
                            <div>
                              <div className="text-sm font-bold">
                                {app.interview.type === 'video' ? 'Видеозвонок' :
                                 app.interview.type === 'phone' ? 'Телефонный звонок' :
                                 app.interview.type === 'onsite' ? 'Встреча в офисе' :
                                 'Take-home задание'}
                              </div>
                              <div className="text-xs text-secondary">
                                {app.interview.interviewer} · {app.interview.notes}
                              </div>
                              <div className="text-xs text-accent mt-1">
                                🗓 {new Date(app.interview.date).toLocaleDateString('ru-RU', {
                                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-muted" style={{ fontSize: '20px' }}>→</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
