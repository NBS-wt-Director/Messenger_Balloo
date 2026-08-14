// Edit Page Screen — редактирование страницы базы знаний (для авторов)
// Соответствует макету: mockups/command-balloo-su/knowledge-page.md (редактор)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { Chip } from '@/components/shared/Chip';

interface PageData {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  version: number;
}

const PAGE_MOCK: PageData = {
  id: '1',
  title: 'Регистрация и вход в Balloo',
  content: `Эта страница поможет вам создать аккаунт в Balloo и войти в систему.

## Создание аккаунта

Для регистрации вам понадобится:
- Действующий адрес электронной почты
- Придуманный пароль (минимум 8 символов)
- Желаемое имя пользователя

### Шаг 1: Переход на страницу регистрации

Откройте Balloo и нажмите кнопку "Регистрация" на экране входа.`,
  categoryId: 'getting-started',
  version: 3,
};

const CATEGORIES = [
  { id: 'getting-started', name: 'Начало работы', icon: '🚀' },
  { id: 'chats', name: 'Чаты', icon: '💬' },
  { id: 'calls', name: 'Звонки', icon: '📞' },
  { id: 'privacy', name: 'Приватность', icon: '🔒' },
  { id: 'troubleshooting', name: 'Устранение проблем', icon: '🔧' },
  { id: 'api', name: 'API', icon: '⚙️' },
];

export function EditPageScreen() {
  const navigate = useNavigate();
  const [page, setPage] = useState<PageData>(PAGE_MOCK);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'none' | 'saved' | 'error'>('none');

  const handleSave = async (draft = false) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('saved');
      if (!draft) {
        setTimeout(() => navigate('/knowledge'), 1000);
      }
    }, 500);
  };

  const handleCancel = () => {
    if (page.content !== PAGE_MOCK.content || page.title !== PAGE_MOCK.title) {
      if (window.confirm('Вы уверены? Несохранённые изменения будут потеряны.')) {
        navigate('/knowledge');
      }
    } else {
      navigate('/knowledge');
    }
  };

  const previewContent = page.content
    .replace(/### (.*)/g, '<h3 style="color:var(--text-primary);margin:24px 0 12px;font-size:18px;">$1</h3>')
    .replace(/## (.*)/g, '<h2 style="color:var(--text-primary);margin:28px 0 14px;font-size:20px;">$1</h2>')
    .replace(/> (.*)/g, '<blockquote style="border-left:3px solid var(--accent);padding:12px 16px;background:var(--bg-tertiary);margin:16px 0;color:var(--text-secondary);">$1</blockquote>')
    .replace(/- (.*)/g, '<li style="margin-bottom:6px;">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:16px;">')
    .replace(/^/, '<p style="margin-bottom:16px;">')
    .replace(/$/, '</p>');

  const selectedCategory = CATEGORIES.find(c => c.id === page.categoryId);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--bg-tertiary)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ← Назад
            </button>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📚
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              Редактирование
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              style={{ fontSize: '13px' }}
            >
              {isSaving ? '💾 Сохранение...' : '💾 Черновик'}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving || !page.title.trim() || !page.content.trim()}
              style={{ background: 'var(--accent)', color: '#fff', fontSize: '13px' }}
            >
              {isSaving ? '💾 Сохранение...' : '💾 Сохранить'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Category selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Категория
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.id}
                    variant={page.categoryId === cat.id ? 'accent' : 'default'}
                    onClick={() => setPage(prev => ({ ...prev, categoryId: cat.id }))}
                    style={{ cursor: 'pointer', fontSize: '13px' }}
                  >
                    {cat.icon} {cat.name}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={page.title}
                onChange={(e) => setPage(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Заголовок страницы"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '20px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
              />
            </div>

            {/* Meta info */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Категория: {selectedCategory?.icon} {selectedCategory?.name}</span>
              <span>Версия: v{page.version}</span>
              <span>Автор: Вы</span>
            </div>

            {/* Content editor */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Содержимое (Markdown)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setMode('write')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: mode === 'write' ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: mode === 'write' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Редактор
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: mode === 'preview' ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: mode === 'preview' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    👁 Предпросмотр
                  </button>
                </div>
              </div>

              {mode === 'write' ? (
                <textarea
                  value={page.content}
                  onChange={(e) => setPage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Напишите содержимое страницы... Используйте Markdown для форматирования."
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    boxSizing: 'border-box',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewContent || '<span style="color:var(--text-muted)">Начните писать, чтобы увидеть предпросмотр...</span>' }}
                />
              )}
            </div>

            {/* Markdown help */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                📖 Форматирование Markdown
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                <div><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>## Заголовок</code> — заголовок 2 уровня</div>
                <div><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>### Заголовок</code> — заголовок 3 уровня</div>
                <div><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>*текст*</code> — *курсив*</div>
                <div><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>**текст**</code> — **жирный**</div>
                <div><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{'> цитата'}</code> — цитата</div>
                <div><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>- элемент</code> — маркированный список</div>
              </div>
            </div>

            {/* Save status */}
            {saveStatus === 'saved' && (
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(45, 184, 77, 0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: '10px',
                  color: 'var(--accent)',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                ✅ Страница успешно сохранена!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
