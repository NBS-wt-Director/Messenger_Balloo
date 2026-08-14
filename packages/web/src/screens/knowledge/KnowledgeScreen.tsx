// Knowledge Screen — категории, список страниц базы знаний
// Соответствует макету: mockups/command-balloo-su/knowledge-base.html

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip } from '@/components/shared/Chip';
import { Button } from '@/components/shared/Button';

interface KnowledgeCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  pageCount: number;
}

interface KnowledgePage {
  id: string;
  title: string;
  excerpt: string;
  categoryId: string;
  updatedAt: string;
  author: string;
  version: number;
  isOfficial?: boolean;
}

const CATEGORIES: KnowledgeCategory[] = [
  { id: 'getting-started', name: 'Начало работы', icon: '🚀', description: 'Первые шаги с Balloo', pageCount: 8 },
  { id: 'chats', name: 'Чаты', icon: '💬', description: 'Личные, групповые, каналы', pageCount: 12 },
  { id: 'calls', name: 'Звонки', icon: '📞', description: 'Голосовые и видеозвонки', pageCount: 6 },
  { id: 'privacy', name: 'Приватность', icon: '🔒', description: 'Настройки безопасности', pageCount: 5 },
  { id: 'troubleshooting', name: 'Устранение проблем', icon: '🔧', description: 'Частые проблемы и решения', pageCount: 10 },
  { id: 'api', name: 'API', icon: '⚙️', description: 'Документация для разработчиков', pageCount: 15 },
];

const PAGES_MOCK: KnowledgePage[] = [
  {
    id: '1',
    title: 'Регистрация и вход в Balloo',
    excerpt: 'Пошаговая инструкция по созданию аккаунта и входу в систему через email и OAuth.',
    categoryId: 'getting-started',
    updatedAt: '15 июля 2026',
    author: 'Администрация',
    version: 3,
    isOfficial: true,
  },
  {
    id: '2',
    title: 'Настройка профиля и аватарки',
    excerpt: 'Как установить аватарку, заполнить био, настроить приватность профиля.',
    categoryId: 'getting-started',
    updatedAt: '14 июля 2026',
    author: 'Мария А.',
    version: 2,
  },
  {
    id: '3',
    title: 'Создание группы и управление участниками',
    excerpt: 'Как создать группу, добавить участников, назначить администраторов.',
    categoryId: 'chats',
    updatedAt: '13 июля 2026',
    author: 'Иван В.',
    version: 4,
    isOfficial: true,
  },
  {
    id: '4',
    title: 'Настройка 2FA для безопасности',
    excerpt: 'Как включить двухфакторную аутентификацию для защиты аккаунта.',
    categoryId: 'privacy',
    updatedAt: '12 июля 2026',
    author: 'Команда безопасности',
    version: 2,
    isOfficial: true,
  },
  {
    id: '5',
    title: 'Отправка вложений и файлов',
    excerpt: 'Поддерживаемые форматы, лимиты размеров, загрузка и скачивание.',
    categoryId: 'chats',
    updatedAt: '11 июля 2026',
    author: 'Администрация',
    version: 1,
  },
  {
    id: '6',
    title: 'Начало работы с WebSocket API',
    excerpt: 'Подключение к WebSocket, аутентификация, основные события.',
    categoryId: 'api',
    updatedAt: '10 июля 2026',
    author: 'Техническая команда',
    version: 5,
    isOfficial: true,
  },
];

export function KnowledgeScreen() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories] = useState<KnowledgeCategory[]>(CATEGORIES);
  const [pages, setPages] = useState<KnowledgePage[]>(PAGES_MOCK);

  const handleCategoryFilter = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      setPages(PAGES_MOCK);
    } else {
      setPages(PAGES_MOCK.filter(p => p.categoryId === categoryId));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setPages(activeCategory === 'all' ? PAGES_MOCK : PAGES_MOCK.filter(p => p.categoryId === activeCategory));
      return;
    }
    const filtered = PAGES_MOCK.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(query.toLowerCase())
    );
    setPages(filtered);
  };

  const handlePageClick = (pageId: string) => {
    navigate(`/knowledge/page/${pageId}`);
  };

  const handleCreatePage = () => {
    navigate('/knowledge/create');
  };

  const getCategoryIcon = (categoryId: string): string => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '📄';
  };

  const getCategoryName = (categoryId: string): string => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || '';
  };

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
              База знаний
            </span>
          </div>
          <Button onClick={handleCreatePage} style={{ background: 'var(--accent)', color: '#fff', fontSize: '13px' }}>
            ✏️ Создать страницу
          </Button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              📚 База знаний
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Документация, инструкции и руководства по использованию Balloo
            </p>

            {/* Search */}
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="🔍 Поиск по базе знаний..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
              />
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <Chip
                variant={activeCategory === 'all' ? 'accent' : 'default'}
                onClick={() => handleCategoryFilter('all')}
                style={{ cursor: 'pointer', fontSize: '13px' }}
              >
                Все ({PAGES_MOCK.length})
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'accent' : 'default'}
                  onClick={() => handleCategoryFilter(cat.id)}
                  style={{ cursor: 'pointer', fontSize: '13px' }}
                >
                  {cat.icon} {cat.name} ({cat.pageCount})
                </Chip>
              ))}
            </div>

            {/* Pages list */}
            {pages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Ничего не найдено</p>
                <p style={{ fontSize: '13px' }}>Попробуйте изменить запрос или категорию</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => handlePageClick(page.id)}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      borderLeft: page.isOfficial ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0,
                        }}
                      >
                        {getCategoryIcon(page.categoryId)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {page.title}
                          </h3>
                          {page.isOfficial && (
                            <Chip variant="accent" style={{ fontSize: '10px' }}>Официальная</Chip>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                          {page.excerpt}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>{getCategoryName(page.categoryId)}</span>
                          <span>·</span>
                          <span>{page.updatedAt}</span>
                          <span>·</span>
                          <span>{page.author}</span>
                          <span>·</span>
                          <span>v{page.version}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
