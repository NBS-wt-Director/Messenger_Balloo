// FeatureCreateScreen — форма создания фич-реквеста
// Тикет №55 — Features: фич-реквесты (узел 04)
// Макет: mockups/features-balloo-su/submit.html

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

const CATEGORIES = [
  { value: 'messenger', label: 'Мессенджер (чаты, сообщения)' },
  { value: 'calls', label: 'Звонки (аудио/видео)' },
  { value: 'groups', label: 'Группы (создание, управление)' },
  { value: 'uiux', label: 'UI/UX (интерфейс)' },
  { value: 'bots', label: 'Боты и API' },
  { value: 'files', label: 'Файлы и медиа' },
  { value: 'privacy', label: 'Приватность и безопасность' },
  { value: 'integrations', label: 'Интеграции' },
  { value: 'other', label: 'Другое' },
];

const PRIORITIES = [
  { value: '', label: '— Не указан —' },
  { value: 'low', label: 'Низкий (было бы неплохо)' },
  { value: 'medium', label: 'Средний (полезно)' },
  { value: 'high', label: 'Высокий (очень нужно)' },
  { value: 'critical', label: 'Критичный (без этого не работаю)' },
];

export function FeatureCreateScreen() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [motivation, setMotivation] = useState('');
  const [checkedSimilar, setCheckedSimilar] = useState(false);
  const [subscribeComments, setSubscribeComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const titleLength = title.length;
  const titleValid = titleLength > 0 && titleLength <= 80;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleValid || !category || !description) {
      setError('Заполните обязательные поля: название, категория, описание');
      return;
    }

    if (!checkedSimilar) {
      setError('Подтвердите, что похожая фича ещё не предложена');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/api/features', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority: priority || null,
        motivation: motivation.trim() || null,
      });

      setSuccess(true);
      setTimeout(() => navigate('/features'), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  }, [title, titleValid, category, priority, description, motivation, checkedSimilar, navigate]);

  if (success) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container page-container--narrow">
            <div className="card text-center py-8">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ marginBottom: 8 }}>Фича отправлена!</h2>
              <p className="text-muted">
                Ваша идея добавлена в список. Сообщество проголосует, а команда рассмотрит.
              </p>
              <button
                className="btn btn--primary btn--lg mt-4"
                onClick={() => navigate('/features')}
              >
                Перейти к списку
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container page-container--narrow">
          <a href="#/features" className="text-sm text-secondary mb-4" style={{ display: 'inline-block' }}>
            ← Назад к списку
          </a>

          <h1 className="page-title">💡 Предложить новую фичу</h1>
          <p className="page-subtitle">
            Опишите вашу идею. Сообщество проголосует, а команда рассмотрит.
          </p>

          {error && (
            <div className="card mb-4" style={{ backgroundColor: 'rgba(220,38,38,0.1)', borderColor: 'var(--danger)' }}>
              <p className="text-danger" style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card">
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Название фичи *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Краткое и понятное название"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                />
                <div className="form-hint">
                  Не более 80 символов ({titleLength}/80)
                </div>
                <div className="form-hint" style={{ color: 'var(--info)' }}>
                  💡 {titleValid ? 'Отличное название! Помогает разработчикам быстро понять суть фичи.' : 'Избегайте аббревиатур.'}
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Категория *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">— Выберите категорию —</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <div className="form-hint" style={{ color: 'var(--info)' }}>
                  💡 Категория определяет, какой команде будет направлена ваша фича.
                </div>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Приоритет</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Описание *</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Подробно опишите, что вы хотите, как это должно работать и почему это важно"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="form-hint" style={{ color: 'var(--info)' }}>
                  💡 Разработчики читают описание, чтобы понять, как фича должна работать.
                </div>
              </div>

              {/* Motivation */}
              <div className="form-group">
                <label className="form-label">Мотивация</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Какую проблему решает эта фича? Как вы справляетесь сейчас без неё?"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                />
                <div className="form-hint" style={{ color: 'var(--info)' }}>
                  💡 Мотивация помогает разработчикам понять реальную проблему пользователя.
                </div>
              </div>

              {/* Attachments placeholder */}
              <div className="form-group">
                <label className="form-label">Скриншоты / макеты (необязательно)</label>
                <div
                  className="card"
                  style={{
                    border: '2px dashed var(--border-strong)',
                    textAlign: 'center',
                    padding: '32px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 32 }}>📎</div>
                  <div className="text-sm text-secondary mt-2">Перетащите файлы сюда или нажмите для выбора</div>
                  <div className="text-xs text-muted mt-1">PNG, JPG, GIF — до 5 МБ</div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={checkedSimilar}
                    onChange={(e) => setCheckedSimilar(e.target.checked)}
                  />
                  <span className="text-sm">Я проверил, что похожая фича ещё не предложена</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={subscribeComments}
                    onChange={(e) => setSubscribeComments(e.target.checked)}
                  />
                  <span className="text-sm">Подписаться на комментарии</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="btn btn--primary btn--lg btn--block"
                  disabled={loading}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Отправка...' : 'Отправить фичу'}
                </button>
                <button
                  type="button"
                  className="btn btn--tertiary btn--lg"
                  onClick={() => navigate('/features')}
                >
                  Отмена
                </button>
              </div>

              {/* Donate banner */}
              <div
                className="card mt-4"
                style={{
                  background: 'rgba(45,184,77,0.08)',
                  borderColor: 'var(--accent)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>💚</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  Хотите ускорить реализацию?
                </div>
                <div className="text-xs text-secondary mt-1">
                  Отправьте донат на развитие фичи — это поможет команде быстрее справиться!
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
