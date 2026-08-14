// Create Page Screen — Создание новой статьи базы знаний
// Rich text editor с Markdown поддержкой

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'design', label: 'Дизайн' },
  { value: 'auth', label: 'Авторизация' },
  { value: 'database', label: 'База данных' },
  { value: 'devops', label: 'DevOps' },
  { value: 'testing', label: 'Тестирование' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'security', label: 'Безопасность' },
  { value: 'ui', label: 'UI/UX' },
  { value: 'css', label: 'CSS' },
  { value: 'setup', label: 'Настройка' },
  { value: 'docker', label: 'Docker' },
  { value: 'k8s', label: 'Kubernetes' },
  { value: 'jest', label: 'Jest' },
  { value: 'playwright', label: 'Playwright' },
];

const tagSuggestions = [
  'onboarding', 'design', 'auth', 'database', 'devops', 'testing',
  'realtime', 'websocket', 'docker', 'k8s', 'security', 'ui', 'css',
  'setup', 'jest', 'playwright', 'api', 'frontend', 'backend',
];

type EditorMode = 'write' | 'preview';

export function CreatePageScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<EditorMode>('write');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const filteredSuggestions = tagSuggestions.filter(
    s => s.includes(newTag.toLowerCase()) && !tags.includes(s)
  );

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Заполните название и содержание статьи');
      return;
    }
    setIsSubmitting(true);
    // TODO: API call to create article
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => navigate('/command/knowledge'), 1500);
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>Статья создана!</h2>
        <p className="text-muted">Перенаправление...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          className="btn btn--tertiary btn--sm"
          onClick={() => navigate('/command/knowledge')}
          style={{ padding: '6px 12px' }}
        >
          ← Назад
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Создание статьи</h1>
          <p className="page-subtitle mb-0">База знаний — новая статья</p>
        </div>
        <select
          className="form-select form-select--sm"
          style={{ width: 'auto' }}
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
        >
          <option value="draft">Черновик</option>
          <option value="published">Опубликовать</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Main content */}
        <div>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Заголовок статьи *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Например: Быстрый старт для разработчика"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 18, padding: '12px 16px' }}
            />
          </div>

          {/* Editor mode toggle */}
          <div className="flex gap-2 mb-2">
            <button
              className={`btn btn--sm ${mode === 'write' ? 'btn--primary' : 'btn--tertiary'}`}
              onClick={() => setMode('write')}
            >
              ✏️ Редактор
            </button>
            <button
              className={`btn btn--sm ${mode === 'preview' ? 'btn--primary' : 'btn--tertiary'}`}
              onClick={() => setMode('preview')}
            >
              👁️ Предпросмотр
            </button>
          </div>

          {/* Content */}
          {mode === 'write' ? (
            <div className="card" style={{ padding: 0 }}>
              {/* Toolbar */}
              <div
                className="flex gap-1"
                style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}
              >
                <button className="btn btn--tertiary btn--xs" title="Жирный" style={{ fontWeight: 700, minWidth: 32 }}>B</button>
                <button className="btn btn--tertiary btn--xs" title="Курсив" style={{ fontStyle: 'italic', minWidth: 32 }}>I</button>
                <button className="btn btn--tertiary btn--xs" title="Зачёркнутый" style={{ textDecoration: 'line-through', minWidth: 32 }}>S</button>
                <span style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
                <button className="btn btn--tertiary btn--xs" title="Заголовок 1" style={{ fontWeight: 700, minWidth: 32 }}>H1</button>
                <button className="btn btn--tertiary btn--xs" title="Заголовок 2" style={{ fontWeight: 600, minWidth: 32 }}>H2</button>
                <button className="btn btn--tertiary btn--xs" title="Заголовок 3" style={{ fontWeight: 500, minWidth: 32 }}>H3</button>
                <span style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
                <button className="btn btn--tertiary btn--xs" title="Список" style={{ minWidth: 32 }}>☰</button>
                <button className="btn btn--tertiary btn--xs" title="Код" style={{ fontFamily: 'monospace', minWidth: 32 }}>&lt;/&gt;</button>
                <button className="btn btn--tertiary btn--xs" title="Ссылка" style={{ minWidth: 32 }}>🔗</button>
                <button className="btn btn--tertiary btn--xs" title="Изображение" style={{ minWidth: 32 }}>🖼️</button>
              </div>
              <textarea
                className="form-input"
                placeholder="Напишите содержание статьи... (поддерживается Markdown)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                style={{
                  width: '100%',
                  border: 'none',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  lineHeight: 1.7,
                  padding: '16px',
                  borderRadius: 0,
                }}
              />
            </div>
          ) : (
            <div className="card" style={{ padding: '16px' }}>
              <h2 style={{ margin: '0 0 12px 0' }}>{title || 'Заголовок статьи'}</h2>
              <div
                className="card__body"
                style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}
              >
                {content || <span className="text-muted" style={{ fontStyle: 'italic' }}>Предпросмотр появится здесь...</span>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              className="btn btn--primary"
              onClick={handleSave}
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? '⏳ Сохранение...' : status === 'published' ? '📤 Опубликовать' : '💾 Сохранить черновик'}
            </button>
            <button className="btn btn--tertiary" onClick={() => navigate('/command/knowledge')}>
              Отмена
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Category */}
          <div className="card mb-4" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Категория</h3>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="card mb-4" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Теги</h3>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="chip"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {tag}
                  <span
                    onClick={() => removeTag(tag)}
                    style={{ cursor: 'pointer', fontSize: 10, opacity: 0.7 }}
                  >✕</span>
                </span>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input form-input--sm"
                placeholder="Добавить тег..."
                value={newTag}
                onChange={(e) => { setNewTag(e.target.value); setShowTagSuggestions(true); }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                style={{ width: '100%' }}
              />
              {showTagSuggestions && filteredSuggestions.length > 0 && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    maxHeight: 160,
                    overflow: 'auto',
                    marginTop: 4,
                  }}
                >
                  {filteredSuggestions.map(s => (
                    <div
                      key={s}
                      className="tab"
                      onClick={() => addTag(s)}
                      style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="card mb-4" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>💡 Советы</h3>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, lineHeight: 1.8 }}>
              <li>Используйте заголовки H1-H3 для структуры</li>
              <li>Добавляйте скриншоты для наглядности</li>
              <li>Код оформляйте блоками ```</li>
              <li>Списки делайте маркированными</li>
              <li>Добавляйте теги для поиска</li>
            </ul>
          </div>

          {/* Word count */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div className="text-xs text-muted">
              Символов: {content.length} | Слов: {content.split(/\s+/).filter(Boolean).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
