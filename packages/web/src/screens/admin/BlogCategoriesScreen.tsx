// BlogCategoriesScreen — управление категориями блога и тегами (админка)
// Tabs: Категории / Теги
// CRUD категорий, порядок, видимость, локализация
// CRUD тегов

import { useState, useCallback, useEffect } from 'react';

// --- Types ---
interface Category {
  id: string;
  icon: string;
  name: string;
  slug: string;
  postCount: number;
  visible: boolean;
  order: number;
  translations?: Record<string, string>;
}

interface Tag {
  id: string;
  name: string;
  postCount: number;
}

type TabKey = 'categories' | 'tags';

// --- Constants ---
const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'fr', label: 'FR' },
  { code: 'be', label: 'BE' },
  { code: 'hi', label: 'HI' },
];

// --- Components ---

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="chip" style={style}>{children}</span>
  );
}

function Button({ children, variant = 'tertiary', size = 'sm', onClick, style, disabled }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'tertiary';
  size?: 'sm' | 'md';
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const variantClass = `btn btn--${variant}`;
  const sizeClass = `btn--${size}`;
  return (
    <button
      className={`${variantClass} ${sizeClass}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, footer }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal modal--status-info">
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <div className="modal__close" onClick={onClose}>✕</div>
        </div>
        <div className="modal__body">{children}</div>
        {footer && (
          <div className="modal__footer">{footer}</div>
        )}
      </div>
    </>
  );
}

function FormInput({ label, placeholder, value, onChange, type = 'text', maxLength }: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
      />
    </div>
  );
}

function FormTextarea({ label, placeholder, value, onChange, minHeight = 60 }: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  minHeight?: number;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea
        className="form-textarea"
        placeholder={placeholder}
        style={{ minHeight }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// --- Main Screen ---

export function BlogCategoriesScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  // Category modal
  const [categoryModal, setCategoryModal] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('📂');
  const [catDesc, setCatDesc] = useState('');
  const [catVisible, setCatVisible] = useState(true);

  // Tag modal
  const [tagInput, setTagInput] = useState('');

  // Localization modal
  const [localModal, setLocalModal] = useState<Category | null>(null);

  // Load mock data
  useEffect(() => {
    setLoading(true);
    setCategories([
      { id: 'c1', icon: '⚙️', name: 'Технологии', slug: 'technology', postCount: 18, visible: true, order: 1 },
      { id: 'c2', icon: '📰', name: 'Новости', slug: 'news', postCount: 24, visible: true, order: 2 },
      { id: 'c3', icon: '🏢', name: 'Компания', slug: 'company', postCount: 12, visible: true, order: 3 },
      { id: 'c4', icon: '🛡️', name: 'Безопасность', slug: 'security', postCount: 6, visible: true, order: 4 },
      { id: 'c5', icon: '👥', name: 'HR', slug: 'hr', postCount: 8, visible: false, order: 5 },
      { id: 'c6', icon: '📊', name: 'Метрики', slug: 'metrics', postCount: 3, visible: true, order: 6 },
    ]);
    setTags([
      { id: 't1', name: '#websocket', postCount: 5 },
      { id: 't2', name: '#redis', postCount: 4 },
      { id: 't3', name: '#архитектура', postCount: 3 },
      { id: 't4', name: '#react', postCount: 7 },
      { id: 't5', name: '#docker', postCount: 3 },
      { id: 't6', name: '#devops', postCount: 4 },
      { id: 't7', name: '#balloo', postCount: 10 },
      { id: 't8', name: '#релиз', postCount: 6 },
    ]);
    setLoading(false);
  }, []);

  // Category CRUD (mock — API endpoints будут добавлены в тикете backend)
  const handleCreateCategory = () => {
    if (!catName.trim()) return;
    const newCat: Category = {
      id: `c${Date.now()}`,
      icon: catIcon,
      name: catName,
      slug: catSlug || catName.toLowerCase().replace(/\s+/g, '-'),
      postCount: 0,
      visible: catVisible,
      order: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
    setCategoryModal(null);
    setCatName('');
    setCatSlug('');
    setCatIcon('📂');
    setCatDesc('');
    setCatVisible(true);
  };

  const handleUpdateCategory = () => {
    if (!categoryModal) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryModal.id
          ? { ...c, name: catName, slug: catSlug, icon: catIcon, visible: catVisible }
          : c
      )
    );
    setCategoryModal(null);
  };

  const handleDeleteCategory = (category: Category) => {
    if (!confirm(`Удалить категорию "${category.name}"? ${category.postCount} статей будут перенесены в архив.`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
  };

  const handleMoveUp = (category: Category) => {
    const idx = categories.findIndex((c) => c.id === category.id);
    if (idx > 0) {
      const updated = [...categories];
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
      setCategories(updated);
    }
  };

  const handleMoveDown = (category: Category) => {
    const idx = categories.findIndex((c) => c.id === category.id);
    if (idx < categories.length - 1) {
      const updated = [...categories];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      setCategories(updated);
    }
  };

  const handleToggleVisibility = (category: Category) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, visible: !c.visible } : c
      )
    );
  };

  // Tag CRUD
  const handleCreateTag = () => {
    if (!tagInput.trim()) return;
    const newTag: Tag = {
      id: `t${Date.now()}`,
      name: tagInput.startsWith('#') ? tagInput : `#${tagInput}`,
      postCount: 0,
    };
    setTags((prev) => [...prev, newTag]);
    setTagInput('');
  };

  const handleDeleteTag = (tag: Tag) => {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🏷️ Категории и теги</h1>
      <p className="page-subtitle">Управление категориями блога и тегами</p>

      {/* Tabs */}
      <div className="tabs mb-6" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <button
          className={`tab ${activeTab === 'categories' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'categories' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'categories' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'categories' ? 600 : 400,
            fontSize: 14,
          }}
        >
          Категории
        </button>
        <button
          className={`tab ${activeTab === 'tags' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('tags')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tags' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'tags' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'tags' ? 600 : 400,
            fontSize: 14,
          }}
        >
          Теги
        </button>
      </div>

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex gap-2 mb-4">
            <Button variant="primary" size="sm" onClick={() => {
              setCategoryModal({} as Category);
              setCatName('');
              setCatSlug('');
              setCatIcon('📂');
              setCatDesc('');
              setCatVisible(true);
            }}>
              ➕ Добавить категорию
            </Button>
          </div>

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>№</th>
                  <th>Иконка</th>
                  <th>Название</th>
                  <th>URL-слаг</th>
                  <th>Статей</th>
                  <th>Видимость</th>
                  <th style={{ width: 120 }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Нет категорий
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr key={cat.id} className="table__row">
                      <td>{cat.order}</td>
                      <td style={{ fontSize: 20 }}>{cat.icon}</td>
                      <td>
                        <strong style={{ color: cat.visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {cat.name}
                        </strong>
                      </td>
                      <td className="text-xs text-muted">/{cat.slug}</td>
                      <td>{cat.postCount}</td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={cat.visible}
                            onChange={() => handleToggleVisibility(cat)}
                          />
                          <span className="switch__slider" />
                        </label>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => {
                              setCategoryModal(cat);
                              setCatName(cat.name);
                              setCatSlug(cat.slug);
                              setCatIcon(cat.icon);
                              setCatDesc('');
                              setCatVisible(cat.visible);
                            }}
                          >
                            ✏
                          </Button>
                          {index > 0 && (
                            <Button variant="tertiary" size="sm" onClick={() => handleMoveUp(cat)}>⬆</Button>
                          )}
                          {index < categories.length - 1 && (
                            <Button variant="tertiary" size="sm" onClick={() => handleMoveDown(cat)}>⬇</Button>
                          )}
                          <Button variant="tertiary" size="sm" onClick={() => setLocalModal(cat)}>🌐</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteCategory(cat)}>🗑</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === 'tags' && (
        <div>
          <div className="card">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="form-input"
                placeholder="#тег"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                style={{ flex: 1, maxWidth: 300 }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); }}
              />
              <Button variant="primary" size="sm" onClick={handleCreateTag}>
                ➕ Добавить
              </Button>
            </div>

            <div className="flex flex-wrap gap-2" style={{ padding: 16 }}>
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-1"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Chip style={{ background: 'none', border: 'none' }}>
                    {tag.name}
                  </Chip>
                  <span className="text-xs text-muted" style={{ marginLeft: 4 }}>
                    {tag.postCount}
                  </span>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 14,
                      padding: '0 2px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== Modals ===== */}

      {/* Category create/edit modal */}
      {categoryModal && (
        <Modal
          title={categoryModal.id ? 'Редактировать категорию' : 'Новая категория'}
          onClose={() => setCategoryModal(null)}
          footer={
            <>
              <Button variant="tertiary" onClick={() => setCategoryModal(null)}>Отмена</Button>
              <Button variant="primary" onClick={categoryModal.id ? handleUpdateCategory : handleCreateCategory}>
                {categoryModal.id ? 'Сохранить' : 'Создать'}
              </Button>
            </>
          }
        >
          <FormInput label="Иконка (эмодзи)" placeholder="📂" value={catIcon} onChange={setCatIcon} maxLength={2} />
          <FormInput label="Название" placeholder="Название категории" value={catName} onChange={setCatName} />
          <FormInput label="URL-слаг" placeholder="nazvanie-kategorii" value={catSlug} onChange={setCatSlug} />
          <FormTextarea label="Описание" placeholder="Описание категории…" value={catDesc} onChange={setCatDesc} />
          <div className="form-group">
            <label className="form-label">Видимость</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={catVisible}
                onChange={(e) => setCatVisible(e.target.checked)}
              />
              <span className="switch__slider" />
            </label>
          </div>
        </Modal>
      )}

      {/* Localization modal */}
      {localModal && (
        <Modal
          title={`🌐 Локализация — ${localModal.name}`}
          onClose={() => setLocalModal(null)}
          footer={
            <>
              <Button variant="tertiary" onClick={() => setLocalModal(null)}>Отмена</Button>
              <Button variant="primary">Сохранить переводы</Button>
            </>
          }
        >
          <p className="text-sm text-secondary mb-4">Переводы категории на 6 языков</p>
          {LANGUAGES.map((lang) => (
            <div className="form-group" key={lang.code}>
              <label className="form-label">{lang.label}</label>
              <input
                type="text"
                className="form-input"
                placeholder={lang.code === 'ru' ? localModal.name : `Перевод на ${lang.label}`}
                defaultValue={localModal.translations?.[lang.code] || ''}
              />
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
