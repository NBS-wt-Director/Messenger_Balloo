// Knowledge Page Screen — Просмотр / редактирование статьи базы знаний
// Expand-аккордеон для навигации по разделам

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface ArticleSection {
  id: string;
  title: string;
  content: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  tags: string[];
  readTime: string;
  progress: { current: number; total: number };
  sections: ArticleSection[];
  isNew?: boolean;
  isUpdated?: boolean;
  lastUpdated: string;
  author: string;
}

const mockArticle: Article = {
  id: '1',
  title: '🚀 Быстрый старт для разработчика',
  description: 'Как развернуть проект локально: pnpm install, docker compose up, настройка переменных окружения.',
  tags: ['onboarding', 'setup'],
  readTime: '15 мин',
  progress: { current: 1, total: 5 },
  isNew: true,
  lastUpdated: '28 июля 2026',
  author: 'Иван Иванов',
  sections: [
    {
      id: 's1',
      title: '1. Требования',
      content: 'Для локальной разработки потребуется:\n\n• Node.js 20+\n• pnpm (npm install -g pnpm)\n• Docker и Docker Compose\n• PostgreSQL 16\n• Redis 7\n\nУбедитесь, что все зависимости установлены и работают.',
    },
    {
      id: 's2',
      title: '2. Клонирование и установка',
      content: 'git clone https://github.com/balloo/messenger.git\ncd messenger\npnpm install\n\nМонорепо использует pnpm workspaces. Все зависимости устанавливаются автоматически в корневой директории.',
    },
    {
      id: 's3',
      title: '3. Настройка окружения',
      content: 'Скопируйте .env.example в .env:\ncp .env.example .env\n\nЗаполните переменные:\n• DATABASE_URL — URL подключения к PostgreSQL\n• REDIS_URL — URL подключения к Redis\n• JWT_SECRET — секрет для JWT токенов\n• SETUP_PASSWORD — пароль установки',
    },
    {
      id: 's4',
      title: '4. Запуск сервисов',
      content: 'docker compose up -d postgres redis\n\ncd packages/shared\nnpx prisma db push\nnpx prisma db seed\n\ncd ../../packages/server\npnpm dev\n\ncd ../../packages/web\npnpm dev\n\nСервер запустится на порту 3100, web — на 5173.',
    },
    {
      id: 's5',
      title: '5. Проверка',
      content: 'Откройте http://localhost:5173 — должна появиться landing page.\n\nПроверьте API: curl http://localhost:3100/health\n\nОжидаемый ответ: {"status":"ok","timestamp":...}',
    },
  ],
};

export function KnowledgePageScreen() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['s1']));
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(mockArticle.sections[0].content);

  const article = mockArticle;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAsRead = () => {
    // TODO: API call to mark article as read
    alert('Статья отмечена как прочитанная!');
  };

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
          <div className="flex items-center gap-2">
            <h1 className="page-title" style={{ margin: 0 }}>{article.title}</h1>
            {article.isNew && <span className="chip chip--danger">Новое</span>}
            {article.isUpdated && <span className="chip chip--info">Обновлено</span>}
          </div>
          <p className="page-subtitle mb-0">{article.description}</p>
        </div>
      </div>

      {/* Meta info */}
      <div className="card mb-4" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="flex items-center gap-2">
          <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
            <div className="avatar__inner"><span>ИВ</span></div>
          </div>
          <span style={{ fontSize: 13 }}>{article.author}</span>
        </div>
        <span className="chip">{article.readTime}</span>
        <span className="text-xs text-muted">Обновлено: {article.lastUpdated}</span>
        <div style={{ flex: 1 }} />
        <span className="text-xs text-muted">
          Прогресс: {article.progress.current}/{article.progress.total}
        </span>
        <button className="btn btn--primary btn--sm" onClick={markAsRead}>✅ Отметить прочитанным</button>
        <button className="btn btn--tertiary btn--sm" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? '❌ Отмена' : '✏️ Редактировать'}
        </button>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        {article.tags.map(tag => <span key={tag} className="chip">{tag}</span>)}
      </div>

      {/* TOC — Table of Contents */}
      <div className="card mb-4">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>📑 Содержание</h3>
        </div>
        <div style={{ padding: '8px 0' }}>
          {article.sections.map((section, idx) => (
            <div
              key={section.id}
              className="tab"
              onClick={() => toggleSection(section.id)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                borderLeft: expandedSections.has(section.id) ? `3px solid var(--accent)` : '3px solid transparent',
                background: expandedSections.has(section.id) ? 'var(--bg-elevated)' : 'transparent',
                fontSize: 13,
              }}
            >
              {idx + 1}. {section.title}
            </div>
          ))}
        </div>
      </div>

      {/* Sections (expandable accordion) */}
      <div>
        {article.sections.map((section) => (
          <div
            key={section.id}
            className="card mb-2"
            style={{
              borderLeft: `3px solid ${expandedSections.has(section.id) ? 'var(--accent)' : 'var(--border-color)'}`,
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: '12px 16px', cursor: 'pointer' }}
              onClick={() => toggleSection(section.id)}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                {article.sections.indexOf(section) + 1}. {section.title}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {expandedSections.has(section.id) ? '▲ Свернуть' : '▼ Развернуть'}
              </span>
            </div>

            {expandedSections.has(section.id) && (
              <div style={{ padding: '0 16px 16px' }}>
                {isEditing ? (
                  <textarea
                    className="form-input"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                  />
                ) : (
                  <div
                    className="card__body"
                    style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}
                  >
                    {section.content}
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn--primary btn--sm" onClick={() => { setIsEditing(false); alert('Сохранено!'); }}>
                      💾 Сохранить
                    </button>
                    <button className="btn btn--tertiary btn--sm" onClick={() => setIsEditing(false)}>
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Related articles */}
      <div className="card mt-6">
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>📌_related_ статьи</h3>
        <div className="flex gap-2 flex-wrap">
          <div
            className="card card--hover"
            style={{ padding: '10px 14px', cursor: 'pointer', flex: '1 1 200px' }}
            onClick={() => navigate('/command/knowledge/2')}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>🎨 Дизайн-система Balloo</div>
            <div className="text-xs text-muted mt-1">Восьмигранные аватарки, пузыри...</div>
          </div>
          <div
            className="card card--hover"
            style={{ padding: '10px 14px', cursor: 'pointer', flex: '1 1 200px' }}
            onClick={() => navigate('/command/knowledge/3')}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>🔐 Авторизация и NextAuth.js</div>
            <div className="text-xs text-muted mt-1">Настройка OAuth...</div>
          </div>
          <div
            className="card card--hover"
            style={{ padding: '10px 14px', cursor: 'pointer', flex: '1 1 200px' }}
            onClick={() => navigate('/command/knowledge/4')}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>🗄️ База данных и Prisma</div>
            <div className="text-xs text-muted mt-1">Схема БД, миграции...</div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="card mt-4" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn--tertiary btn--sm">👍 Полезно</button>
        <button className="btn btn--tertiary btn--sm">👎 Не полезно</button>
        <button className="btn btn--tertiary btn--sm">🔗 Поделиться</button>
        <button className="btn btn--tertiary btn--sm">🚩 Пожаловаться</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn--tertiary btn--sm">🖨️ Печать</button>
      </div>
    </div>
  );
}
