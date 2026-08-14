// Knowledge Screen — База знаний портала сотрудников
// 4 таба: Инструкции, Гайды, Changelog, Документы
// Поиск, фильтры, прогресс изучения

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface KbArticle {
  id: string;
  title: string;
  description: string;
  tags: string[];
  readProgress?: string; // "✅ Прочитано" | "50% · 2/4" | "⬜ Не начато"
  isNew?: boolean;
  isUpdated?: boolean;
  readTime?: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  body: string;
  type: 'feature' | 'improvement' | 'fix';
  hasNav?: boolean;
}

interface DocItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

const instructions: KbArticle[] = [
  {
    id: '1',
    title: '🚀 Быстрый старт для разработчика',
    description: 'Как развернуть проект локально: pnpm install, docker compose up, настройка переменных окружения.',
    tags: ['onboarding', 'setup'],
    readProgress: '✅ Прочитано',
    isNew: true,
    readTime: '15 мин',
  },
  {
    id: '2',
    title: '🎨 Дизайн-система Balloo',
    description: 'Восьмигранные аватарки, пузыри без скруглений, темы оформления, Glassmorphism.',
    tags: ['design', 'ui', 'css'],
    readProgress: '50% · 2/4',
    isUpdated: true,
  },
  {
    id: '3',
    title: '🔐 Авторизация и NextAuth.js',
    description: 'Настройка OAuth (Яндекс, Mail.ru, Rambler), JWT refresh tokens, сессии.',
    tags: ['auth', 'security'],
    readProgress: '⬜ Не начато',
  },
  {
    id: '4',
    title: '🗄️ База данных и Prisma',
    description: 'Схема БД, миграции (Flyway), сидирование, PostgREST.',
    tags: ['database', 'prisma'],
    readProgress: '⬜ Не начато',
  },
];

const guides: KbArticle[] = [
  {
    id: '5',
    title: '🐳 Docker и Kubernetes',
    description: 'Сборка образов, деплой в K8s, настройка ingress.',
    tags: ['devops', 'docker', 'k8s'],
    isNew: true,
  },
  {
    id: '6',
    title: '⚡ WebSocket (Hono + uWebSockets.js)',
    description: 'Realtime сообщения, звонки, статусы. Масштабирование.',
    tags: ['realtime', 'websocket'],
    isUpdated: true,
  },
  {
    id: '7',
    title: '🧪 Тестирование',
    description: 'Jest + RTL, Playwright (e2e), Supertest (API). Turborepo параллелизм.',
    tags: ['testing', 'jest', 'playwright'],
  },
];

const changelog: ChangelogEntry[] = [
  {
    id: '1',
    version: 'v1.0.0-beta',
    date: '16 июля 2026',
    title: 'Фичи',
    body: 'Новые функции:\n• 38 интерактивных макетов экранов\n• 7 узлов монорепо\n• 3 темы оформления\n• Базовые чаты, группы, звонки\n• Интерактивы (опросы, квизы, списки, персонали)',
    type: 'feature',
    hasNav: true,
  },
  {
    id: '2',
    version: 'v0.9.0',
    date: '10 июля 2026',
    title: 'Улучшения',
    body: '• Настройка CI/CD pipeline\n• Миграция на Kubernetes\n• Docker-образы для всех сервисов',
    type: 'improvement',
    hasNav: true,
  },
  {
    id: '3',
    version: 'v0.8.0',
    date: '1 июля 2026',
    title: 'Исправления',
    body: '• Архитектурные решения зафиксированы\n• Дизайн-система спроектирована\n• Схема БД утверждена',
    type: 'fix',
    hasNav: true,
  },
];

const documents: DocItem[] = [
  {
    id: '1',
    title: '📋 Регламент работы',
    description: 'GitHub Flow, код-ревью, время реакции на инциденты.',
    category: 'регламент',
    tags: ['шаблон'],
  },
  {
    id: '2',
    title: '🔒 Политика безопасности',
    description: 'CORS, CSP, JWT, 2FA (v2), ограничение запросов.',
    category: 'регламент',
    tags: ['регламент'],
  },
  {
    id: '3',
    title: '📞 Контакты и эскалация',
    description: 'Telegram-бот алерты, email всем админам, каналы связи.',
    category: 'контакты',
    tags: ['контакты'],
  },
];

const allTags = Array.from(new Set([
  ...instructions.flatMap(a => a.tags),
  ...guides.flatMap(g => g.tags),
]));

const docCategories = ['Все категории', 'Шаблоны', 'Регламенты', 'Контакты'];

const kbTags = ['onboarding', 'design', 'auth', 'database', 'devops', 'testing', 'realtime', 'docker', 'k8s', 'security', 'ui', 'css', 'setup', 'jest', 'playwright'];

type KbTab = 'instructions' | 'guides' | 'changelog' | 'documents';
type SortBy = 'date' | 'popularity';

export function KnowledgeScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<KbTab>('instructions');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [docCategory, setDocCategory] = useState('Все категории');
  const [docSearch, setDocSearch] = useState('');

  const tabs: { key: KbTab; label: string; icon: string }[] = [
    { key: 'instructions', label: 'Инструкции', icon: '📖' },
    { key: 'guides', label: 'Гайды', icon: '🔧' },
    { key: 'changelog', label: 'Changelog', icon: '📜' },
    { key: 'documents', label: 'Документы', icon: '📄' },
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredInstructions = instructions.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = guides.filter(g =>
    !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocs = documents.filter(d =>
    (!docCategory || docCategory === 'Все категории' || d.category === docCategory.toLowerCase()) &&
    (!docSearch || d.title.toLowerCase().includes(docSearch.toLowerCase()) || d.description.toLowerCase().includes(docSearch.toLowerCase()))
  );

  const typeChips: Record<string, string> = {
    feature: 'chip--accent',
    improvement: 'chip--info',
    fix: '',
  };

  const typeLabels: Record<string, string> = {
    feature: 'Фичи',
    improvement: 'Улучшения',
    fix: 'Исправления',
  };

  return (
    <div>
      {/* Header */}
      <h1 className="page-title">База знаний</h1>
      <p className="page-subtitle">Инструкции • Гайды • Changelog • Внутренние документы</p>

      {/* Search */}
      <div className="form-group">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Поиск по базе знаний..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontSize: '16px', padding: '14px' }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-4">
        <button
          className="btn btn--tertiary btn--sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔧 Фильтры
        </button>
        <select
          className="form-select form-select--sm"
          style={{ width: 'auto' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          <option value="date">Сортировка: по дате</option>
          <option value="popularity">Сортировка: по популярности</option>
        </select>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card mb-4" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Фильтры поиска</h3>
            <button className="btn btn--tertiary btn--xs" onClick={() => setSelectedTags([])}>Сбросить теги</button>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 12 }}>Категория</label>
            <select className="form-select form-select--sm" style={{ width: 'auto' }}>
              <option>Все категории</option>
              <option>onboarding</option>
              <option>design</option>
              <option>auth</option>
              <option>database</option>
              <option>devops</option>
              <option>testing</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 12 }}>Теги</label>
            <div className="flex gap-2 flex-wrap">
              {kbTags.map(tag => (
                <label
                  key={tag}
                  className="form-checkbox"
                  style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: selectedTags.includes(tag) ? 'var(--accent)' : 'transparent', color: selectedTags.includes(tag) ? 'white' : 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    style={{ margin: '0 4px 0 0' }}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <label className="form-label" style={{ fontSize: 12, minWidth: 60 }}>Дата:</label>
            <input type="date" className="form-input form-input--sm" style={{ width: 'auto' }} />
            <span className="text-muted">—</span>
            <input type="date" className="form-input form-input--sm" style={{ width: 'auto' }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div data-tab-group="kb" className="mb-4">
        <div className="tabs">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </div>
          ))}
        </div>

        {/* Panel: Инструкции */}
        {activeTab === 'instructions' && (
          <div className="tab-panel">
            {filteredInstructions.map((article) => (
              <div
                key={article.id}
                className="card card--hover kb-card mb-2"
                onClick={() => navigate(`/command/knowledge/${article.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="card__title mb-0">{article.title}</h3>
                  <div className="flex gap-1">
                    {article.isNew && <span className="chip chip--danger">Новое</span>}
                    {article.isUpdated && <span className="chip chip--info">Обновлено</span>}
                  </div>
                </div>
                <p className="card__body">{article.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    {article.tags.map(tag => <span key={tag} className="chip">{tag}</span>)}
                    {article.readTime && <span className="chip chip--accent">{article.readTime}</span>}
                  </div>
                  <span className="text-xs text-muted">{article.readProgress}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Panel: Гайды */}
        {activeTab === 'guides' && (
          <div className="tab-panel">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="card card--hover kb-card mb-2"
                onClick={() => navigate(`/command/knowledge/${guide.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="card__title mb-0">{guide.title}</h3>
                  <div className="flex gap-1">
                    {guide.isNew && <span className="chip chip--danger">Новое</span>}
                    {guide.isUpdated && <span className="chip chip--info">Обновлено</span>}
                  </div>
                </div>
                <p className="card__body">{guide.description}</p>
                <div className="flex gap-2 mt-2">
                  {guide.tags.map(tag => <span key={tag} className="chip">{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Panel: Changelog */}
        {activeTab === 'changelog' && (
          <div className="tab-panel">
            {changelog.map((entry, idx) => (
              <div key={entry.id} className="card kb-card mb-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="card__title">{entry.version} — {entry.date}</h3>
                  <span className={`chip ${typeChips[entry.type]}`}>{typeLabels[entry.type]}</span>
                </div>
                <div className="card__body" style={{ whiteSpace: 'pre-line' }}>{entry.body}</div>
                {entry.hasNav && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn--tertiary btn--xs">← Предыдущая</button>
                    <button className="btn btn--tertiary btn--xs">Полный релиз-нот →</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Panel: Документы */}
        {activeTab === 'documents' && (
          <div className="tab-panel">
            <div className="flex gap-2 mb-4">
              <select
                className="form-select form-select--sm"
                style={{ width: 'auto' }}
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
              >
                {docCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Поиск по документам..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                style={{ width: '200px' }}
              />
            </div>
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="card card--hover kb-card mb-2"
                style={{ cursor: 'pointer' }}
              >
                <h3 className="card__title">{doc.title}</h3>
                <p className="card__body">{doc.description}</p>
                <div className="flex gap-2 mt-2">
                  {doc.tags.map(tag => <span key={tag} className="chip">{tag}</span>)}
                  <button className="btn btn--tertiary btn--xs">📥 Скачать</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
