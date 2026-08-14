// ApplicationScreen.tsx — Форма отклика на вакансию
// Экран: /hiring/apply/:id

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/services/api';

interface Vacancy {
  id: string;
  title: string;
  icon: string;
  department: string;
}

const DEMO_VACANCIES: Record<string, Vacancy> = {
  v1: { id: 'v1', title: 'Senior Frontend Developer (React 19 / Next.js 15)', icon: '⚛️', department: 'Отдел разработки' },
  v2: { id: 'v2', title: 'Backend Developer (Hono / WebSocket)', icon: '🔧', department: 'Отдел разработки' },
  v3: { id: 'v3', title: 'DevOps Engineer (K8s / Docker / CI/CD)', icon: '🚀', department: 'Инфраструктура' },
  v4: { id: 'v4', title: 'UI/UX Designer', icon: '🎨', department: 'Дизайн' },
  v5: { id: 'v5', title: 'QA Engineer (Playwright / Jest)', icon: '🧪', department: 'Отдел разработки' },
  v6: { id: 'v6', title: 'Technical Writer', icon: '📝', department: 'Документация' },
};

const VACANCY_OPTIONS = [
  { id: 'v1', name: 'Senior Frontend Developer (React 19 / Next.js 15)', icon: '⚛️', meta: 'React 19 / Next.js 15 · 12 откликов' },
  { id: 'v2', name: 'Backend Developer (Hono / WebSocket)', icon: '🔧', meta: 'Next.js API / WebSocket · 8 откликов' },
  { id: 'v3', name: 'DevOps Engineer (K8s / Docker / CI/CD)', icon: '🚀', meta: 'K8s / Docker / CI/CD · 5 откликов' },
  { id: 'v4', name: 'UI/UX Designer', icon: '🎨', meta: 'Дизайн · 6 откликов' },
  { id: 'v5', name: 'QA Engineer (Playwright / Jest)', icon: '🧪', meta: 'Playwright / Jest · 4 отклика' },
  { id: 'v6', name: 'Technical Writer', icon: '📝', meta: 'Документация · 2 отклика' },
];

export default function ApplicationScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Форма
  const [form, setForm] = useState({
    vacancyId: id || '',
    vacancyName: '',
    fullName: '',
    email: '',
    phone: '',
    city: '',
    resumeUrl: '',
    portfolioUrl: '',
    experience: '',
    coverLetter: '',
    salaryExpectation: '',
    startDate: '',
    agreePersonalData: false,
  });

  // Для combobox вакансий
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [vacancyFilter, setVacancyFilter] = useState('');

  useEffect(() => {
    loadVacancy();
  }, [id]);

  const loadVacancy = async () => {
    try {
      if (id) {
        const data = await api.getVacancy(id);
        if (data) {
          setVacancy(data as Vacancy);
          setForm(prev => ({
            ...prev,
            vacancyId: data.id,
            vacancyName: data.title,
          }));
          return;
        }
      }
    } catch {
      // Fall back
    }

    // Fallback to demo if id matches
    if (id && DEMO_VACANCIES[id]) {
      const demo = DEMO_VACANCIES[id];
      setVacancy(demo);
      setForm(prev => ({
        ...prev,
        vacancyId: demo.id,
        vacancyName: demo.title,
      }));
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const filterVacancies = (query: string) => {
    setVacancyFilter(query);
    setShowSuggestions(true);
  };

  const selectVacancy = (option: typeof VACANCY_OPTIONS[0]) => {
    setForm(prev => ({
      ...prev,
      vacancyId: option.id,
      vacancyName: option.name,
    }));
    setVacancyFilter('');
    setShowSuggestions(false);
    setVacancy({ id: option.id, title: option.name, icon: option.icon, department: '' });
  };

  const clearVacancy = () => {
    setForm(prev => ({
      ...prev,
      vacancyId: '',
      vacancyName: '',
    }));
    setVacancy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (!form.vacancyId || !form.fullName || !form.email || !form.resumeUrl || !form.coverLetter) {
      alert('Пожалуйста, заполните все обязательные поля (отмечены *)');
      return;
    }
    if (!form.agreePersonalData) {
      alert('Необходимо согласие на обработку персональных данных');
      return;
    }

    setSubmitting(true);
    try {
      await api.applyVacancy(form.vacancyId, {
        coverLetter: form.coverLetter,
        resumeUrl: form.resumeUrl,
      });
      setSubmitted(true);
    } catch (error: any) {
      alert(error.message || 'Ошибка при отправке заявки. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container page-container--narrow text-center py-8 text-muted">
            Загрузка формы заявки...
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container page-container--narrow text-center py-8">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h1 className="page-title">Заявка отправлена!</h1>
            <p className="page-subtitle">Мы свяжемся с вами в течение 3 рабочих дней</p>
            <div className="card mt-6">
              <p className="text-sm text-secondary">
                {vacancy ? vacancy.title : 'Вакансия'}
              </p>
            </div>
            <button
              className="btn btn--primary btn--lg mt-6"
              onClick={() => navigate('/hiring/applications')}
            >
              📋 Мои отклики
            </button>
            <div className="mt-4">
              <button className="btn btn--tertiary" onClick={() => navigate('/hiring/vacancies')}>
                ← К другим вакансиям
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredOptions = VACANCY_OPTIONS.filter(opt =>
    !vacancyFilter || opt.name.toLowerCase().includes(vacancyFilter.toLowerCase())
  );

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container page-container--narrow">
          <button className="btn btn--tertiary btn--sm mb-4" onClick={() => navigate('/hiring/vacancies')}>
            ← К вакансиям
          </button>

          <h1 className="page-title">📝 Анкета заявки</h1>
          <p className="page-subtitle">«Стать членом нашей команды»</p>

          <form onSubmit={handleSubmit}>
            {/* Выбор вакансии */}
            <div className="card mb-4" style={{ background: 'rgba(59,158,255,0.08)', borderColor: 'var(--info)', position: 'relative' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Вакансия *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Начните вводить название вакансии..."
                  value={vacancyFilter || form.vacancyName}
                  onChange={(e) => filterVacancies(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                />
                <span className="form-hint">Выберите из списка или введите название. При выборе — автоподстановка имени вакансии.</span>

                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div
                    style={{
                      display: 'none',
                    }}
                    className="vacancy-suggestions"
                  >
                    <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)' }}>
                      Рекомендуемые
                    </div>
                    {filteredOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="suggestion-item"
                        style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)' }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = '')}
                        onClick={() => selectVacancy(opt)}
                      >
                        <span style={{ fontSize: '16px' }}>{opt.icon}</span>
                        <div>
                          <div className="text-sm font-bold">{opt.name}</div>
                          <div className="text-xs text-muted">{opt.meta}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected vacancy */}
              {vacancy && (
                <div id="vacancy-selected" className="mt-3">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '24px' }}>{vacancy.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{vacancy.title}</div>
                      <div className="text-xs text-muted">
                        Вакансия #{vacancy.id} · ID подгружен автоматически
                      </div>
                    </div>
                    <button type="button" className="btn btn--tertiary btn--sm" onClick={clearVacancy}>
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Основная форма */}
            <div className="card">
              <div className="form-group">
                <label className="form-label">Имя и фамилия *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Иван Иванов"
                  value={form.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ivan@example.com"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+7 (999) 123-45-67"
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Город / Часовой пояс</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Москва, UTC+3"
                  value={form.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ссылка на резюме *</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={form.resumeUrl}
                  onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                  required
                />
                <span className="form-hint">Или прикрепите файл (PDF, DOCX)</span>
              </div>

              <div className="form-group">
                <label className="form-label">GitHub / GitLab / Portfolio</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/username"
                  value={form.portfolioUrl}
                  onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Опыт работы (лет) *</label>
                <select
                  className="form-select"
                  value={form.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  required
                >
                  <option value="">Выберите...</option>
                  <option>Менее 1 года</option>
                  <option>1–3 года</option>
                  <option>3–5 лет</option>
                  <option>5+ лет</option>
                  <option>10+ лет</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Расскажите о себе *</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Почему вы хотите присоединиться к Balloo? Какой опыт релевантен?"
                  value={form.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ожидания по зарплате</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="250 000 ₽"
                  value={form.salaryExpectation}
                  onChange={(e) => handleInputChange('salaryExpectation', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Как скоро готовы начать?</label>
                <select
                  className="form-select"
                  value={form.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                >
                  <option value="">Выберите...</option>
                  <option>Немедленно</option>
                  <option>Через 2 недели</option>
                  <option>Через месяц</option>
                  <option>Более месяца</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.agreePersonalData}
                    onChange={(e) => handleInputChange('agreePersonalData', e.target.checked)}
                    required
                  />
                  <span>Я согласен на обработку персональных данных</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--block btn--lg"
                disabled={submitting}
              >
                {submitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
              <p className="text-xs text-muted text-center mt-4">
                Заявка отправляется в HR-модуль. Ответ — в течение 3 рабочих дней.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
