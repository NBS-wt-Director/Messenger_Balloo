// InterviewScreen.tsx — Детали интервью
// Экран: /hiring/application/:id

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/services/api';

// Типы
type InterviewType = 'phone' | 'video' | 'onsite' | 'take_home';

interface Application {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  vacancyIcon: string;
  department: string;
  status: string;
  submittedAt: number;
  coverLetter: string;
  resumeUrl: string;
  interview?: Interview;
}

interface Interview {
  id: string;
  date: number;
  type: InterviewType;
  status: 'scheduled' | 'completed' | 'cancelled';
  interviewer: string;
  notes: string;
  duration?: number; // minutes
  meetingLink?: string;
  result?: string;
  feedback?: string;
}

const interviewTypeLabels: Record<InterviewType, string> = {
  phone: '📞 Телефонное интервью',
  video: '📹 Видеозвонок',
  onsite: '🏢 Встреча в офисе',
  take_home: '💻 Take-home задание',
};

const interviewTypeDescriptions: Record<InterviewType, string> = {
  phone: 'Короткое интервью по телефону (20-30 минут) для знакомства и обсуждения общего опыта',
  video: 'Видеоинтервью с техническим специалистом (45-60 минут)',
  onsite: 'Личная встреча в офисе с командой (60-90 минут)',
  take_home: 'Домашнее задание с последующим обсуждением (3-5 дней)',
};

// Моковые данные
const DEMO_APPLICATION: Application = {
  id: 'a1', vacancyId: 'v1', vacancyTitle: 'Senior Frontend Developer',
  vacancyIcon: '⚛️', department: 'Отдел разработки',
  status: 'interview', submittedAt: Date.now() - 7 * 86400000,
  coverLetter: 'Имею 6 лет опыта с React...',
  resumeUrl: 'https://resume.example.com',
};

const DEMO_INTERVIEW: Interview = {
  id: 'i1', date: Date.now() + 2 * 86400000,
  type: 'video', status: 'scheduled',
  interviewer: 'Алексей Петров, Tech Lead',
  notes: 'Первое интервью, 60 минут, Google Meet',
  duration: 60,
  meetingLink: 'https://meet.google.com/abc-defg-hij',
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед. назад`;
  return `${Math.floor(days / 30)} мес. назад`;
};

export default function InterviewScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      if (id) {
        const data = await api.getMyApplications();
        const app = data?.find((a: any) => a.id === id) as Application | undefined;
        if (app) {
          setApplication(app);
          if (app.interview) setInterview(app.interview);
          return;
        }
      }
    } catch {
      // Fall back
    }

    setApplication(DEMO_APPLICATION);
    setInterview(DEMO_INTERVIEW);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container page-container--narrow text-center py-8 text-muted">
            Загрузка...
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container page-container--narrow text-center py-8">
            <p className="text-muted mb-4">Отклик не найден</p>
            <button className="btn btn--tertiary" onClick={() => navigate('/hiring/applications')}>
              ← Мои отклики
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel = interview ? interviewTypeLabels[interview.type] : 'Интервью';
  const typeDesc = interview ? interviewTypeDescriptions[interview.type] : '';

  // Статус интервью
  const interviewStatusLabels: Record<Interview['status'], { label: string; className: string; icon: string }> = {
    scheduled: { label: 'Запланировано', className: 'chip--warning', icon: '📅' },
    completed: { label: 'Завершено', className: 'chip--accent', icon: '✅' },
    cancelled: { label: 'Отменено', className: 'chip--secondary', icon: '❌' },
  };

  const statusInfo = interview ? interviewStatusLabels[interview.status] : null;

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container page-container--narrow">
          <button className="btn btn--tertiary btn--sm mb-4" onClick={() => navigate('/hiring/applications')}>
            ← Мои отклики
          </button>

          <h1 className="page-title">🎯 {typeLabel}</h1>
          <p className="page-subtitle">{application.vacancyTitle}</p>

          {/* Информация о вакансии */}
          <div className="card mb-4">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '32px' }}>{application.vacancyIcon}</span>
              <div className="flex-1">
                <div className="font-semibold">{application.vacancyTitle}</div>
                <div className="text-xs text-muted">{application.department}</div>
                <div className="text-xs text-muted">
                  Откликнут: {formatRelativeTime(application.submittedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Интервью */}
          {interview && (
            <>
              {/* Статус */}
              {statusInfo && (
                <div className={`card mb-4`} style={{
                  background: interview.status === 'scheduled' ? 'rgba(255,183,77,0.08)' :
                              interview.status === 'completed' ? 'rgba(45,184,77,0.08)' :
                              'rgba(158,158,158,0.08)',
                  borderColor: interview.status === 'scheduled' ? 'var(--warning)' :
                               interview.status === 'completed' ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`chip ${statusInfo.className}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  {/* Тип интервью */}
                  <div className="mb-3">
                    <div className="text-sm font-bold mb-1">Тип: {typeLabel}</div>
                    <div className="text-xs text-secondary">{typeDesc}</div>
                  </div>

                  {/* Детали */}
                  {interview.status === 'scheduled' && (
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <div>
                        <div className="text-xs text-muted">Дата и время</div>
                        <div className="text-sm font-bold">
                          {new Date(interview.date).toLocaleDateString('ru-RU', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                          })}
                          <br />
                          {new Date(interview.date).toLocaleTimeString('ru-RU', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Интервьюер</div>
                        <div className="text-sm font-bold">{interview.interviewer}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Длительность</div>
                        <div className="text-sm font-bold">{interview.duration} минут</div>
                      </div>
                    </div>
                  )}

                  {/* Ссылка на встречу */}
                  {interview.meetingLink && interview.status === 'scheduled' && (
                    <div className="mt-4">
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--primary btn--block"
                      >
                        🔗 Перейти к встрече
                      </a>
                    </div>
                  )}

                  {/* Заметки */}
                  {interview.notes && (
                    <div className="mt-3 text-xs text-secondary">
                      📌 {interview.notes}
                    </div>
                  )}

                  {/* Результат */}
                  {interview.result && (
                    <div className="mt-3 p-3" style={{
                      background: 'rgba(45,184,77,0.1)',
                      borderRadius: '8px',
                      border: '1px solid var(--accent)',
                    }}>
                      <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                        ✅ Результат
                      </div>
                      <div className="text-sm mt-1">{interview.result}</div>
                    </div>
                  )}

                  {/* Фидбек */}
                  {interview.feedback && (
                    <div className="mt-3 p-3" style={{
                      background: 'rgba(158,158,158,0.05)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}>
                      <div className="text-sm font-bold">💬 Фидбек от интервьюера</div>
                      <div className="text-sm mt-1 text-secondary">{interview.feedback}</div>
                    </div>
                  )}
                </div>
              )}

              {/* История интервью */}
              <div className="card mb-4">
                <h3 className="card__title mb-4">📋 История интервью</h3>
                <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '16px' }}>
                  {/* Текущее/будущее */}
                  {interview.status === 'scheduled' && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: 'var(--accent)' }}>●</span>
                        <span className="text-sm font-bold">Запланировано</span>
                      </div>
                      <div className="text-xs text-secondary">
                        {new Date(interview.date).toLocaleDateString('ru-RU')}
                        {' · '}
                        {interview.interviewer}
                      </div>
                    </div>
                  )}

                  {/* Прошедшее */}
                  {interview.status === 'completed' && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: 'var(--accent)' }}>●</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Завершено</span>
                      </div>
                      <div className="text-xs text-secondary">
                        {new Date(interview.date).toLocaleDateString('ru-RU')}
                        {' · '}
                        {interview.interviewer}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Подготовка */}
              {interview.status === 'scheduled' && (
                <div className="card mb-4">
                  <h3 className="card__title mb-4">💡 Советы по подготовке</h3>
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px' }}>
                    <li>Повторите основы React и TypeScript</li>
                    <li>Подготовьте примеры из опыта работы</li>
                    <li>Изучите архитектуру Balloo (docs.balloo.su)</li>
                    <li>Подготовьте вопросы о команде и процессе</li>
                    <li>
                      {interview.type === 'video' && 'Проверьте камеру и микрофон заранее'}
                      {interview.type === 'phone' && 'Найдите тихое место для разговора'}
                      {interview.type === 'onsite' && 'Постройте маршрут до офиса заранее'}
                      {interview.type === 'take_home' && 'Внимательно прочитайте ТЗ задания'}
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Без интервью */}
          {!interview && (
            <div className="text-center py-6">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p className="text-muted">Интервью ещё не запланировано</p>
              <p className="text-xs text-secondary mt-2">
                Мы свяжемся с вами, когда HR рассмотрит вашу заявку
              </p>
            </div>
          )}

          {/* Кнопки действий */}
          {interview && interview.status === 'scheduled' && (
            <div className="flex gap-3 mt-4">
              <button className="btn btn--primary flex-1" onClick={() => navigate(`/hiring/vacancy/${application.vacancyId}`)}>
                📄 Описание вакансии
              </button>
              <button className="btn btn--secondary flex-1">
                📅 Перенести
              </button>
            </div>
          )}

          <div className="text-center mt-4">
            <button className="btn btn--tertiary" onClick={() => navigate('/hiring/applications')}>
              ← Вернуться к откликам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
