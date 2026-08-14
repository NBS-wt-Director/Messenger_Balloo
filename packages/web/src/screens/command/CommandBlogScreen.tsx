// Command Blog Screen — Корпоративный блог портала сотрудников
// Мои статьи, Мой канал, создание/редактирование статей, комментарии, лайки

import { useState } from 'react';

// ——— Types ———

type ArticleStatus = 'published' | 'draft' | 'review' | 'changes_needed';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  channel: string;
  channelIcon: string;
  status: ArticleStatus;
  statusLabel: string;
  statusClass: string;
  date: string;
  views: number;
  reactions: number;
  comments: number;
  reviewer?: string;
  reviewerDate?: string;
  feedback?: string;
}

interface Comment {
  id: string;
  author: string;
  initials: string;
  article: string;
  text: string;
  timeAgo: string;
  online: boolean;
  spam: boolean;
}

interface BlogPost {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  title: string;
  excerpt: string;
  channel: string;
  channelIcon: string;
  date: string;
  likes: number;
  liked: boolean;
  comments: number;
  shares: number;
}

// ——— Mock Data ———

const mockArticles: Article[] = [
  {
    id: '1', title: 'Релиз v1.0.0-beta', excerpt: 'Основные изменения в бете',
    channel: 'Новости', channelIcon: '📰', status: 'published', statusLabel: 'Опубликован', statusClass: 'chip--accent',
    date: '16 июля', views: 1234, reactions: 45, comments: 12,
  },
  {
    id: '2', title: 'WebSocket масштабирование', excerpt: 'Redis Pub/Sub и воркеры',
    channel: 'Технологии', channelIcon: '⚙️', status: 'published', statusLabel: 'Опубликован', statusClass: 'chip--accent',
    date: '12 июля', views: 2100, reactions: 45, comments: 8,
  },
  {
    id: '3', title: 'Архитектура realtime', excerpt: 'WebSocket gateway + очереди',
    channel: 'Технологии', channelIcon: '⚙️', status: 'review', statusLabel: 'На ревью', statusClass: 'chip--warning',
    date: '15 июля', views: 0, reactions: 0, comments: 0,
  },
  {
    id: '4', title: 'Prisma + Flyway: миграции', excerpt: 'Управление схемой БД',
    channel: 'Технологии', channelIcon: '⚙️', status: 'published', statusLabel: 'Опубликован', statusClass: 'chip--accent',
    date: '8 июля', views: 1500, reactions: 32, comments: 5,
  },
  {
    id: '5', title: '5 лет с DevOps', excerpt: 'Личный опыт работы',
    channel: 'Личный', channelIcon: '✍️', status: 'published', statusLabel: 'Опубликован', statusClass: 'chip--accent',
    date: '9 июля', views: 1100, reactions: 45, comments: 12,
  },
  {
    id: '6', title: 'Docker для новичков', excerpt: 'Основы контейнеризации',
    channel: 'Личный', channelIcon: '✍️', status: 'changes_needed', statusLabel: 'Нужны правки', statusClass: '',
    date: '11 июля', views: 0, reactions: 0, comments: 0,
    reviewer: 'Алексей Дрозд', reviewerDate: '11 июля 2026', feedback: 'Статья хорошая, но нужно добавить раздел про docker-compose и примеры команд. Также исправь опечатку в 3-м абзаце.',
  },
  {
    id: '7', title: '(без заголовка)', excerpt: 'Черновик',
    channel: 'Технологии', channelIcon: '⚙️', status: 'draft', statusLabel: 'Черновик', statusClass: '',
    date: '17 июля', views: 0, reactions: 0, comments: 0,
  },
  {
    id: '8', title: 'K8s для разработчиков', excerpt: 'Введение в Kubernetes',
    channel: 'Технологии', channelIcon: '⚙️', status: 'draft', statusLabel: 'Черновик', statusClass: '',
    date: '17 июля', views: 0, reactions: 0, comments: 0,
  },
];

const mockComments: Comment[] = [
  {
    id: '1', author: 'Анна Петрова', initials: 'АП', article: '5 лет с DevOps',
    text: 'Отличная статья! Поделитесь опытом с Helm?', timeAgo: '2 часа назад', online: true, spam: false,
  },
  {
    id: '2', author: 'Гость', initials: 'Г', article: 'WebSocket масштабирование',
    text: 'А почему не NATS вместо Redis?', timeAgo: '5 часов назад', online: false, spam: false,
  },
  {
    id: '3', author: 'Спамер', initials: 'СП', article: 'Docker для новичков',
    text: 'КУПИТЬ ДИПЛОМ НЕДОРОГО visit site...', timeAgo: '1 день назад', online: false, spam: true,
  },
];

const mockBlogFeed: BlogPost[] = [
  {
    id: 'f1', author: 'Иван Воронов', initials: 'ИВ', avatarColor: 'var(--info)',
    title: 'Релиз v1.0.0-beta: что нового', excerpt: 'Основные изменения в бете: WebSocket realtime, Stories, Polls, новый дизайн',
    channel: 'Новости', channelIcon: '📰', date: '16 июля',
    likes: 45, liked: true, comments: 12, shares: 3,
  },
  {
    id: 'f2', author: 'Алексей Морозов', initials: 'АМ', avatarColor: 'var(--accent)',
    title: 'Как мы мигрировали на Prisma', excerpt: 'История миграции с TypeORM на Prisma: почему, как, какие были проблемы',
    channel: 'Технологии', channelIcon: '⚙️', date: '15 июля',
    likes: 32, liked: false, comments: 8, shares: 5,
  },
  {
    id: 'f3', author: 'Елена Волкова', initials: 'ЕВ', avatarColor: 'var(--warning)',
    title: 'Дизайн-система Balloo: принципы', excerpt: 'Как мы проектируем UI: октагоны, пузыри, темы, glassmorphism',
    channel: 'Команда', channelIcon: '👥', date: '14 июля',
    likes: 28, liked: false, comments: 6, shares: 7,
  },
  {
    id: 'f4', author: 'Дмитрий Соколов', initials: 'ДС', avatarColor: '#a855f7',
    title: 'Метрики за июнь: рост на 40%', excerpt: 'DAU вырос до 12K, MAU — 45K, сообщений в день — 2M',
    channel: 'Метрики', channelIcon: '📊', date: '13 июля',
    likes: 67, liked: false, comments: 15, shares: 10,
  },
  {
    id: 'f5', author: 'Иван Воронов', initials: 'ИВ', avatarColor: 'var(--info)',
    title: 'WebSocket масштабирование', excerpt: 'Redis Pub/Sub, воркеры, очереди — как мы масштабируем realtime',
    channel: 'Технологии', channelIcon: '⚙️', date: '12 июля',
    likes: 45, liked: false, comments: 8, shares: 4,
  },
];

const mockChannelStats = {
  totalPosts: 12,
  totalViews: 8400,
  totalReactions: 324,
  totalComments: 89,
};

const mockChartHeights = [40, 55, 30, 70, 85, 60, 90, 45, 65, 75];

// ——— Components ———

function formatViews(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toString();
}

function StatusChip({ statusClass, children }: { statusClass: string; children: React.ReactNode }) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid transparent',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  };
  const classMap: Record<string, React.CSSProperties> = {
    'chip--accent': { background: 'rgba(45,184,77,0.12)', color: 'var(--accent)', borderColor: 'var(--accent)' },
    'chip--warning': { background: 'rgba(255,165,0,0.12)', color: 'var(--warning)', borderColor: 'var(--warning)' },
  };
  return <span style={{ ...baseStyle, ...(classMap[statusClass] || {}) }}>{children}</span>;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="card flex-1"
      style={{ minWidth: 140 }}
    >
      <div className="text-xs text-muted">{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ——— Main Screen ———

type BlogTabType = 'feed' | 'my-posts' | 'my-channel' | 'create';

export function CommandBlogScreen() {
  const [activeTab, setActiveTab] = useState<BlogTabType>('feed');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelTab, setChannelTab] = useState<number>(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set(['f1']));

  // Create post state
  const [postTitle, setPostTitle] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postChannel, setPostChannel] = useState('news');
  const [postCategory, setPostCategory] = useState('tech');
  const [postTags, setPostTags] = useState('');
  const [postCover, setPostCover] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<'draft' | 'review'>('draft');

  // Comment moderation state
  const [moderationActions, setModerationActions] = useState<Record<string, 'approve' | 'hide' | null>>({});

  const filteredArticles = statusFilter === 'all'
    ? mockArticles
    : mockArticles.filter(a => a.status === statusFilter);

  const articleCounts = {
    all: mockArticles.length,
    draft: mockArticles.filter(a => a.status === 'draft').length,
    review: mockArticles.filter(a => a.status === 'review').length,
    published: mockArticles.filter(a => a.status === 'published').length,
    changes_needed: mockArticles.filter(a => a.status === 'changes_needed').length,
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleModerationAction = (commentId: string, action: 'approve' | 'hide') => {
    setModerationActions(prev => ({ ...prev, [commentId]: action }));
  };

  // ——— Render: Feed ———
  const renderFeed = () => (
    <div>
      {/* Hero */}
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, rgba(45,184,77,0.08), rgba(59,130,246,0.08))',
        borderColor: 'var(--accent)',
        padding: '24px',
      }}>
        <div className="flex items-center gap-4">
          <div style={{ fontSize: 48 }}>📝</div>
          <div className="flex-1">
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Корпоративный блог
            </h2>
            <p className="text-sm text-secondary" style={{ margin: '4px 0 0' }}>
              Лента статей сотрудников Balloo — обмен знаниями и опытом
            </p>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => setActiveTab('create')}
            style={{ whiteSpace: 'nowrap' }}
          >
            ✏️ Написать статью
          </button>
        </div>
      </div>

      {/* Feed list */}
      {mockBlogFeed.map((post) => (
        <div key={post.id} className="card mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="avatar avatar--sm avatar--bordered"
              style={{ background: post.avatarColor, flexShrink: 0 }}
            >
              <div className="avatar__inner"><span>{post.initials}</span></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <strong style={{ color: 'var(--text-primary)' }}>{post.author}</strong>
                <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {post.channelIcon} {post.channel}
                </span>
              </div>
              <div className="text-xs text-muted">{post.date}</div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
            {post.title}
          </h3>
          <p className="text-sm text-secondary" style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
            {post.excerpt}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(post.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: post.liked ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, padding: '4px 0',
              }}
            >
              {post.liked ? '❤️' : '🤍'} {post.likes + (post.liked ? 0 : 0) + (post.liked ? 1 : 0)}
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              💬 {post.comments}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              🔄 {post.shares}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  // ——— Render: My Posts ———
  const renderMyPosts = () => (
    <div>
      <h1 className="page-title">📝 Мои статьи</h1>
      <p className="page-subtitle">Статьи во всех каналах, где вы автор</p>

      {/* Status filter */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        <button
          className={`btn ${statusFilter === 'all' ? 'btn--primary' : 'btn--tertiary'} btn--sm`}
          onClick={() => setStatusFilter('all')}
        >
          Все ({articleCounts.all})
        </button>
        <button
          className={`btn ${statusFilter === 'draft' ? 'btn--primary' : 'btn--tertiary'} btn--sm`}
          onClick={() => setStatusFilter('draft')}
        >
          Черновики ({articleCounts.draft})
        </button>
        <button
          className={`btn ${statusFilter === 'review' ? 'btn--primary' : 'btn--tertiary'} btn--sm`}
          onClick={() => setStatusFilter('review')}
        >
          На ревью ({articleCounts.review})
        </button>
        <button
          className={`btn ${statusFilter === 'published' ? 'btn--primary' : 'btn--tertiary'} btn--sm`}
          onClick={() => setStatusFilter('published')}
        >
          Опубликованы ({articleCounts.published})
        </button>
        <button
          className={`btn ${statusFilter === 'changes_needed' ? 'btn--primary' : 'btn--tertiary'} btn--sm`}
          onClick={() => setStatusFilter('changes_needed')}
        >
          Нужны правки ({articleCounts.changes_needed})
        </button>
      </div>

      {/* Articles table */}
      <div className="card mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Канал</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Просмотры</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.map((article) => (
              <tr key={article.id} className="table__row">
                <td><strong>{article.title}</strong></td>
                <td>
                  <span className="chip">{article.channelIcon} {article.channel}</span>
                </td>
                <td>
                  {article.status === 'changes_needed' ? (
                    <span style={{
                      background: 'var(--danger-bg)', color: 'var(--danger)',
                      border: '1px solid var(--danger)', padding: '4px 10px',
                      borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>
                      {article.statusLabel}
                    </span>
                  ) : (
                    <StatusChip statusClass={article.statusClass}>{article.statusLabel}</StatusChip>
                  )}
                </td>
                <td className="text-xs text-muted">{article.date}</td>
                <td>{article.views > 0 ? formatViews(article.views) : '—'}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn--tertiary btn--sm" title="Просмотр">👁</button>
                    <button className="btn btn--tertiary btn--sm" title="Редактировать">✏</button>
                    {article.status !== 'published' && (
                      <button className="btn btn--tertiary btn--sm" title="Удалить">🗑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reviewer feedback for "changes_needed" */}
      {mockArticles.filter(a => a.status === 'changes_needed').map((article) => (
        <div key={article.id} className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <h3 className="card__title mb-2">⚠️ {article.title} — нужны правки</h3>
          {article.reviewer && (
            <p className="text-xs text-muted mb-4">
              Ревьюер: {article.reviewer} · {article.reviewerDate}
            </p>
          )}
          {article.feedback && (
            <div className="card__body" style={{ background: 'var(--bg-tertiary)', padding: 12, borderLeft: '3px solid var(--warning)' }}>
              «{article.feedback}»
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button className="btn btn--primary btn--sm">✏ Внести правки</button>
          </div>
        </div>
      ))}
    </div>
  );

  // ——— Render: My Channel ———
  const renderMyChannel = () => (
    <div>
      <h1 className="page-title">✍️ Мой канал</h1>
      <p className="page-subtitle">Блог Ивана Воронова — вы автор и модератор</p>

      {/* Moderator info */}
      <div className="card mb-4" style={{
        background: 'rgba(45,184,77,0.06)',
        borderColor: 'var(--accent)',
      }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 }}>👤</span>
          <div className="flex-1">
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Модератор: Иван Воронов (совпадает с автором)
            </div>
            <div className="text-xs text-secondary">
              Для личных каналов модератор всегда совпадает с автором. Отдельная настройка модератора недоступна.
            </div>
          </div>
          <StatusChip statusClass="chip--accent">Личный канал</StatusChip>
        </div>
      </div>

      {/* Channel stats */}
      <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        <StatCard label="Статей" value={mockChannelStats.totalPosts} color="var(--accent)" />
        <StatCard label="Просмотров" value={formatViews(mockChannelStats.totalViews)} color="var(--info)" />
        <StatCard label="Реакций" value={mockChannelStats.totalReactions} color="var(--warning)" />
        <StatCard label="Комментариев" value={mockChannelStats.totalComments} color="#a855f7" />
      </div>

      {/* Channel tabs */}
      <div className="tabs mb-4" data-tab-group="channel">
        {[
          { label: '📄 Статьи', icon: '📄' },
          { label: '💬 Модерация комментариев', icon: '💬' },
          { label: '📊 Статистика', icon: '📊' },
        ].map((tab, i) => (
          <div
            key={i}
            className={`tab ${channelTab === i ? 'tab--active' : ''}`}
            onClick={() => setChannelTab(i)}
            style={{ cursor: 'pointer' }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tab 0: Articles */}
      {channelTab === 0 && (
        <div className="card mb-4">
          <table className="table">
            <thead>
              <tr>
                <th>Статья</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Просмотры</th>
                <th>Реакции</th>
                <th>Коммент.</th>
              </tr>
            </thead>
            <tbody>
              {mockArticles.slice(0, 3).map((article) => (
                <tr key={article.id} className="table__row">
                  <td><strong>{article.title}</strong></td>
                  <td>
                    {article.status === 'changes_needed' ? (
                      <span style={{
                        background: 'var(--danger-bg)', color: 'var(--danger)',
                        border: '1px solid var(--danger)', padding: '4px 10px',
                        borderRadius: 6, fontSize: 12, fontWeight: 600,
                      }}>
                        {article.statusLabel}
                      </span>
                    ) : (
                      <StatusChip statusClass={article.statusClass}>{article.statusLabel}</StatusChip>
                    )}
                  </td>
                  <td className="text-xs text-muted">{article.date}</td>
                  <td>{article.views > 0 ? formatViews(article.views) : '—'}</td>
                  <td>{article.reactions}</td>
                  <td>{article.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 1: Comment moderation */}
      {channelTab === 1 && (
        <div className="card mb-4">
          <h3 className="card__title mb-4">
            Комментарии на модерацию ({mockComments.filter(c => !moderationActions[c.id]).length})
          </h3>
          {mockComments.map((comment) => {
            const action = moderationActions[comment.id];
            if (action) return null; // hidden
            return (
              <div key={comment.id} style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="avatar avatar--xs avatar--bordered"
                    style={{
                      background: comment.online ? 'var(--accent)' : 'var(--bg-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    <div className="avatar__inner"><span>{comment.initials}</span></div>
                  </div>
                  <span className="font-semibold text-sm">{comment.author}</span>
                  <span className="text-xs text-muted">
                    на «{comment.article}» · {comment.timeAgo}
                  </span>
                  {comment.spam && (
                    <span className="chip" style={{
                      background: 'var(--danger-bg)', color: 'var(--danger)',
                      border: '1px solid var(--danger)', fontSize: 10, padding: '1px 6px',
                    }}>
                      СПАМ
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary" style={{ paddingLeft: 40, marginBottom: 8 }}>
                  {comment.text}
                </p>
                <div className="flex gap-2" style={{ paddingLeft: 40 }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleModerationAction(comment.id, 'approve')}
                  >
                    ✓ Оставить
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleModerationAction(comment.id, 'hide')}
                  >
                    🗑 Скрыть
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Stats */}
      {channelTab === 2 && (
        <>
          <div className="card mb-4">
            <h3 className="card__title mb-4">Просмотры за 30 дней</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
              {mockChartHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: 'var(--accent)',
                    height: `${h}%`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${h * 10} просмотров`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted mt-2">
              <span>7 июля</span><span>17 июля</span>
            </div>
          </div>
          <div className="card">
            <h3 className="card__title mb-4">Топ статьи по просмотрам</h3>
            {[
              { title: 'WebSocket масштабирование', views: 2100 },
              { title: 'Prisma + Flyway', views: 1500 },
              { title: '5 лет с DevOps', views: 1100 },
            ].map((item, i) => (
              <div key={i} className="list__item" style={{ border: 'none' }}>
                <span className="flex-1">
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}
                  {item.title}
                </span>
                <span className="font-bold text-accent">{formatViews(item.views)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ——— Render: Create Post ———
  const renderCreatePost = () => (
    <div>
      <div className="flex justify-between mb-6">
        <button className="btn btn--tertiary btn--sm" onClick={() => setActiveTab('my-posts')}>
          ← Мои статьи
        </button>
        <div className="flex gap-2">
          <button className="btn btn--secondary btn--sm">👁 Предпросмотр</button>
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => { setPostStatus('draft'); }}
          >
            💾 Сохранить черновик
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => { setPostStatus('review'); }}
          >
            📤 Отправить на ревью
          </button>
        </div>
      </div>

      <h1 className="page-title">Новая статья</h1>
      <StatusChip statusClass={postStatus === 'draft' ? '' : 'chip--warning'}>
        {postStatus === 'draft' ? 'Черновик' : 'На ревью'}
      </StatusChip>

      {/* Channel selector */}
      <div className="form-group">
        <label className="form-label">Канал</label>
        <select
          className="form-select"
          value={postChannel}
          onChange={(e) => setPostChannel(e.target.value)}
        >
          <option value="news">📰 Новости (корпоративный)</option>
          <option value="tech">⚙️ Технологии (корпоративный)</option>
          <option value="personal">✍️ Мой личный канал</option>
        </select>
        <div className="form-hint">Выберите канал, в котором вы являетесь автором</div>
      </div>

      {/* Cover image */}
      <div className="form-group">
        <label className="form-label">Обложка</label>
        <div
          onClick={() => setPostCover('uploaded')}
          style={{
            border: '2px dashed var(--border-strong)',
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: 8,
          }}
        >
          {postCover ? (
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div className="text-sm">Обложка загружена</div>
              <button
                className="btn btn--tertiary btn--sm mt-2"
                onClick={(e) => { e.stopPropagation(); setPostCover(null); }}
              >
                Удалить
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
              <div className="text-sm">Перетащите изображение или нажмите для выбора</div>
              <div className="text-xs text-muted">PNG, JPG до 5 МБ · рекомендуется 1200×630</div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="form-group">
        <label className="form-label">Заголовок</label>
        <input
          type="text"
          className="form-input"
          style={{ fontSize: 18, fontWeight: 700 }}
          placeholder="Введите заголовок статьи…"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
        />
      </div>

      {/* Excerpt */}
      <div className="form-group">
        <label className="form-label">Анонс (краткое описание)</label>
        <textarea
          className="form-textarea"
          placeholder="2-3 предложения для ленты…"
          style={{ minHeight: 60 }}
          value={postExcerpt}
          onChange={(e) => setPostExcerpt(e.target.value)}
        />
        <div className="form-hint">Показывается в ленте блога. Максимум 300 символов.</div>
      </div>

      {/* Markdown editor */}
      <div className="form-group">
        <label className="form-label">Текст статьи (Markdown)</label>
        <div className="flex gap-2 mb-2">
          {['B', 'I', 'H', '🔗', '📷', '{ }', '"', '•'].map((tool, i) => (
            <button
              key={i}
              className="btn btn--tertiary btn--sm"
              title={tool}
              style={{ minWidth: 32, padding: '4px 8px' }}
            >
              {tool}
            </button>
          ))}
        </div>
        <textarea
          className="form-textarea"
          style={{ minHeight: 400, fontFamily: "'Fira Code',monospace", fontSize: 13, lineHeight: 1.6 }}
          placeholder="## Введение\n\nТекст статьи в Markdown..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        />
      </div>

      {/* Category and tags */}
      <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        <div className="form-group flex-1" style={{ minWidth: 200 }}>
          <label className="form-label">Категория</label>
          <select
            className="form-select"
            value={postCategory}
            onChange={(e) => setPostCategory(e.target.value)}
          >
            <option value="tech">⚙️ Технологии</option>
            <option value="news">📰 Новости</option>
            <option value="team">👥 Команда</option>
            <option value="metrics">📊 Метрики</option>
          </select>
        </div>
        <div className="form-group flex-1" style={{ minWidth: 200 }}>
          <label className="form-label">Теги</label>
          <input
            type="text"
            className="form-input"
            placeholder="через запятую…"
            value={postTags}
            onChange={(e) => setPostTags(e.target.value)}
          />
        </div>
      </div>

      {/* Localization */}
      <div className="card mb-4">
        <h3 className="card__title mb-4">🌐 Локализация</h3>
        <p className="text-xs text-secondary mb-4">
          Статья может иметь переводы для 6 языков. Если перевод отсутствует — показывается язык по умолчанию (RU).
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Язык</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🇷🇺 Русский</td>
              <td><StatusChip statusClass="chip--accent">✓ Основной</StatusChip></td>
              <td><button className="btn btn--tertiary btn--sm">✏</button></td>
            </tr>
            <tr>
              <td>🇬🇧 English</td>
              <td><span className="chip">—</span></td>
              <td><button className="btn btn--tertiary btn--sm">➕ Добавить</button></td>
            </tr>
            <tr>
              <td>🇨🇳 中文</td>
              <td><span className="chip">—</span></td>
              <td><button className="btn btn--tertiary btn--sm">➕ Добавить</button></td>
            </tr>
            <tr>
              <td>🇫🇷 Français</td>
              <td><span className="chip">—</span></td>
              <td><button className="btn btn--tertiary btn--sm">➕ Добавить</button></td>
            </tr>
            <tr>
              <td>🇧🇪 Беларуская</td>
              <td><span className="chip">—</span></td>
              <td><button className="btn btn--tertiary btn--sm">➕ Добавить</button></td>
            </tr>
            <tr>
              <td>🇮🇳 हिन्दी</td>
              <td><span className="chip">—</span></td>
              <td><button className="btn btn--tertiary btn--sm">➕ Добавить</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="btn btn--secondary" onClick={() => setPostStatus('draft')}>
          💾 Сохранить черновик
        </button>
        <button className="btn btn--primary" onClick={() => setPostStatus('review')}>
          📤 Отправить на ревью
        </button>
      </div>
    </div>
  );

  // ——— Main render ———
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar — reuse CommandLayout sidebar pattern */}
      <aside
        className="command-sidebar"
        style={{
          width: 240,
          minWidth: 240,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 56,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--info)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0,
          }}>
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Command
          </span>
        </div>

        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {[
            { icon: '🏠', label: 'Дашборд', path: '/command' },
            { icon: '💬', label: 'Внутренний чат', path: '/command/chat' },
            { icon: '📅', label: 'Совещания', path: '/command/meetings' },
            { icon: '📋', label: 'Задачи', path: '/command/tasks' },
            { icon: '🏢', label: 'Мой отдел', path: '/command/my-department' },
            { icon: '🏛️', label: 'Подразделения', path: '/command/departments' },
            { icon: '👥', label: 'HR', path: '/command/hr' },
            { icon: '📚', label: 'База знаний', path: '/command/knowledge' },
            { icon: '🎯', label: 'Найм', path: '/command/hiring' },
            { icon: '📊', label: 'Мониторинг', path: '/command/monitoring' },
          ].map((item) => (
            <div
              key={item.path}
              className="list__item"
              style={{ cursor: 'pointer' }}
              onClick={() => { /* navigate */ }}
            >
              {item.icon} {item.label}
            </div>
          ))}

          {/* Blog section */}
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0', padding: '12px 0' }}>
            <div style={{
              padding: '4px 16px', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)',
            }}>
              Блог
            </div>
            {[
              { icon: '📝', label: 'Мои статьи', tab: 'my-posts' as BlogTabType },
              { icon: '✍️', label: 'Мой канал', tab: 'my-channel' as BlogTabType },
            ].map((item) => (
              <div
                key={item.tab}
                className={`list__item ${activeTab === item.tab ? 'list__item--active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveTab(item.tab)}
              >
                {item.icon} {item.label}
              </div>
            ))}
          </div>

          {/* Hiring section */}
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0', padding: '12px 0' }}>
            <div style={{
              padding: '4px 16px', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)',
            }}>
              Найм
            </div>
            {[
              { icon: '💼', label: 'Вакансии', path: '/command/vacancies' },
              { icon: '⭐', label: 'Почему мы', path: '/command/why-us' },
            ].map((item) => (
              <div
                key={item.path}
                className="list__item"
                style={{ cursor: 'pointer' }}
                onClick={() => { /* navigate */ }}
              >
                {item.icon} {item.label}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="content overflow-y-auto" style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar__logo">
            <div className="topbar__logo-icon" style={{ background: 'var(--info)' }}>C</div>
            <span>Command</span>
            <div className="topbar__dropdown" />
          </div>
          <div className="topbar__title">
            {activeTab === 'feed' && 'Корпоративный блог'}
            {activeTab === 'my-posts' && 'Мои статьи'}
            {activeTab === 'my-channel' && 'Мой канал'}
            {activeTab === 'create' && 'Редактор статьи'}
          </div>
          <div className="topbar__actions">
            {activeTab !== 'create' && (
              <button
                className="topbar__actions-btn"
                onClick={() => setActiveTab('create')}
                title="Новая статья"
              >
                ✏
              </button>
            )}
          </div>
          <div className="topbar__right" />
        </div>

        {/* Blog navigation tabs */}
        <div className="tabs mb-4" data-tab-group="blog">
          {[
            { label: '📰 Лента', tab: 'feed' as BlogTabType },
            { label: '📝 Мои статьи', tab: 'my-posts' as BlogTabType },
            { label: '✍️ Мой канал', tab: 'my-channel' as BlogTabType },
            { label: '➕ Новая статья', tab: 'create' as BlogTabType },
          ].map((tab) => (
            <div
              key={tab.tab}
              className={`tab ${activeTab === tab.tab ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(tab.tab)}
              style={{ cursor: 'pointer' }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="page-container">
          {activeTab === 'feed' && renderFeed()}
          {activeTab === 'my-posts' && renderMyPosts()}
          {activeTab === 'my-channel' && renderMyChannel()}
          {activeTab === 'create' && renderCreatePost()}
        </div>
      </div>
    </div>
  );
}
