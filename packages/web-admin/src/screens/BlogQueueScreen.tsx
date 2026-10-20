// BlogQueueScreen — очередь модерации блога (админка)
// Фильтры по статусу, таблица постов, недавно рассмотренные
// + BlogReviewScreen (sub-component)

import { useState, useCallback, useEffect } from 'react';

// --- Types ---
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorInitials: string;
  authorStatus: 'online' | 'offline' | 'away';
  channelId: string;
  channelName: string;
  channelType: 'corporate' | 'personal';
  categoryId: string;
  categoryName: string;
  submittedAt: number;
  status: 'review' | 'published' | 'rejected' | 'needs-fix';
  tags: string[];
  coverUrl?: string;
}

interface ResolvedPost {
  id: string;
  title: string;
  authorName: string;
  resolution: 'approved' | 'rejected';
  reviewerName: string;
  resolvedAt: number;
}

type StatusFilter = 'review' | 'published' | 'rejected' | 'needs-fix' | 'all';

// --- Constants ---
const STATUS_FILTERS: { key: StatusFilter; label: string; count?: number }[] = [
  { key: 'review', label: 'На ревью', count: 3 },
  { key: 'published', label: 'Опубликованы', count: 24 },
  { key: 'rejected', label: 'Отклонены', count: 2 },
  { key: 'needs-fix', label: 'Нужны правки', count: 1 },
  { key: 'all', label: 'Все', count: 30 },
];

const STATUS_CHIP_STYLES: Record<string, React.CSSProperties> = {
  review: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'var(--danger)' },
  published: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  rejected: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'var(--danger)' },
  'needs-fix': { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderColor: 'var(--warning)' },
};

const CHANNEL_CHIP_STYLES: Record<string, React.CSSProperties> = {
  corporate: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  personal: { background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderColor: '#a855f7' },
};

const AVATAR_STATUS_MAP: Record<string, string> = {
  online: 'avatar--status-online',
  offline: 'avatar--status-offline',
  away: 'avatar--status-away',
};

// --- Components ---

function Avatar({ initials, status, size = 'xs', bordered = true }: {
  initials: string;
  status?: string;
  size?: 'xs' | 'sm' | 'md';
  bordered?: boolean;
}) {
  const sizeClass = `avatar--${size}`;
  const statusClass = status ? AVATAR_STATUS_MAP[status] || '' : '';
  const borderClass = bordered ? 'avatar--bordered' : '';
  const ctxClass = 'avatar--ctx-contact';
  return (
    <div className={`avatar ${sizeClass} ${statusClass} ${borderClass} ${ctxClass}`}>
      <div className="avatar__inner"><span>{initials}</span></div>
    </div>
  );
}

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="chip" style={style}>{children}</span>
  );
}

function Button({ children, variant = 'tertiary', size = 'sm', onClick, disabled }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'tertiary';
  size?: 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variantClass = `btn btn--${variant}`;
  const sizeClass = `btn--${size}`;
  return (
    <button
      className={`${variantClass} ${sizeClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// --- Main Screen ---

export function BlogQueueScreen() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('review');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [resolvedPosts, setResolvedPosts] = useState<ResolvedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewPost, setReviewPost] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    if (activeFilter === 'review') {
      setPosts([
        { id: '1', title: 'Архитектура realtime: WebSocket, Redis', excerpt: 'Как устроена realtime-обработка', authorId: 'u1', authorName: 'Иван В.', authorUsername: 'ivan', authorInitials: 'ИВ', authorStatus: 'online', channelId: 'c1', channelName: 'Технологии', channelType: 'corporate', categoryId: 'cat1', categoryName: 'Технологии', submittedAt: 1752547200000, status: 'review', tags: ['#websocket', '#redis', '#архитектура'] },
        { id: '2', title: 'Как мы строим библиотеку компонентов', excerpt: 'Подход к проектированию UI', authorId: 'u2', authorName: 'Мария А.', authorUsername: 'maria', authorInitials: 'МА', authorStatus: 'offline', channelId: 'c2', channelName: 'Личный', channelType: 'personal', categoryId: 'cat1', categoryName: 'Технологии', submittedAt: 1752547200000, status: 'review', tags: ['#react', '#components'] },
        { id: '3', title: 'Docker для новичков', excerpt: 'Полный гайд по контейнеризации', authorId: 'u1', authorName: 'Иван В.', authorUsername: 'ivan', authorInitials: 'ИВ', authorStatus: 'online', channelId: 'c2', channelName: 'Личный', channelType: 'personal', categoryId: 'cat1', categoryName: 'Технологии', submittedAt: 1752460800000, status: 'review', tags: ['#docker', '#devops'] },
      ]);
      setResolvedPosts([
        { id: 'r1', title: 'Релиз v1.0.0-beta', authorName: 'Иван В.', resolution: 'approved', reviewerName: 'Алексей Д.', resolvedAt: 1752633600000 },
        { id: 'r2', title: 'WebSocket масштабирование', authorName: 'Иван В.', resolution: 'approved', reviewerName: 'Алексей Д.', resolvedAt: 1752288000000 },
        { id: 'r3', title: 'Спам в комментариях', authorName: '—', resolution: 'rejected', reviewerName: 'Мария А.', resolvedAt: 1752115200000 },
      ]);
    } else if (activeFilter === 'published') {
      setPosts([
        { id: 'p1', title: 'Релиз v1.0.0-beta', excerpt: 'Первый бета-релиз', authorId: 'u1', authorName: 'Иван В.', authorUsername: 'ivan', authorInitials: 'ИВ', authorStatus: 'online', channelId: 'c1', channelName: 'Новости', channelType: 'corporate', categoryId: 'cat2', categoryName: 'Новости', submittedAt: 1752288000000, status: 'published', tags: ['#релиз', '#balloo'] },
      ]);
      setResolvedPosts([]);
    } else if (activeFilter === 'rejected') {
      setPosts([
        { id: 'r1', title: 'Спам в комментариях', excerpt: 'Некачественный контент', authorId: 'u3', authorName: '—', authorUsername: 'anon', authorInitials: '??', authorStatus: 'offline', channelId: 'c3', channelName: 'Общий', channelType: 'corporate', categoryId: 'cat3', categoryName: 'Общее', submittedAt: 1752115200000, status: 'rejected', tags: ['#спам'] },
      ]);
      setResolvedPosts([]);
    } else if (activeFilter === 'needs-fix') {
      setPosts([
        { id: 'f1', title: 'Обновление гайда по безопасности', excerpt: 'Нужны правки по структуре', authorId: 'u2', authorName: 'Мария А.', authorUsername: 'maria', authorInitials: 'МА', authorStatus: 'online', channelId: 'c1', channelName: 'Технологии', channelType: 'corporate', categoryId: 'cat4', categoryName: 'Безопасность', submittedAt: 1752374400000, status: 'needs-fix', tags: ['#безопасность', '#гайд'] },
      ]);
      setResolvedPosts([]);
    } else {
      setPosts([
        { id: '1', title: 'Архитектура realtime', excerpt: 'Как устроена realtime', authorId: 'u1', authorName: 'Иван В.', authorUsername: 'ivan', authorInitials: 'ИВ', authorStatus: 'online', channelId: 'c1', channelName: 'Технологии', channelType: 'corporate', categoryId: 'cat1', categoryName: 'Технологии', submittedAt: 1752547200000, status: 'review', tags: ['#websocket'] },
        { id: 'p1', title: 'Релиз v1.0.0-beta', excerpt: 'Первый бета-релиз', authorId: 'u1', authorName: 'Иван В.', authorUsername: 'ivan', authorInitials: 'ИВ', authorStatus: 'online', channelId: 'c1', channelName: 'Новости', channelType: 'corporate', categoryId: 'cat2', categoryName: 'Новости', submittedAt: 1752288000000, status: 'published', tags: ['#релиз'] },
        { id: 'r1', title: 'Спам в комментариях', excerpt: 'Некачественный контент', authorId: 'u3', authorName: '—', authorUsername: 'anon', authorInitials: '??', authorStatus: 'offline', channelId: 'c3', channelName: 'Общий', channelType: 'corporate', categoryId: 'cat3', categoryName: 'Общее', submittedAt: 1752115200000, status: 'rejected', tags: ['#спам'] },
      ]);
      setResolvedPosts([
        { id: 'r1', title: 'Релиз v1.0.0-beta', authorName: 'Иван В.', resolution: 'approved', reviewerName: 'Алексей Д.', resolvedAt: 1752633600000 },
        { id: 'r2', title: 'WebSocket масштабирование', authorName: 'Иван В.', resolution: 'approved', reviewerName: 'Алексей Д.', resolvedAt: 1752288000000 },
        { id: 'r3', title: 'Спам в комментариях', authorName: '—', resolution: 'rejected', reviewerName: 'Мария А.', resolvedAt: 1752115200000 },
      ]);
    }
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleReview = (post: BlogPost) => {
    setReviewPost(post);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  if (reviewPost) {
    return (
      <BlogReviewScreen
        post={reviewPost}
        onBack={() => setReviewPost(null)}
        onRefresh={fetchPosts}
      />
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">📝 Очередь блога</h1>
      <p className="page-subtitle">Статьи на ревью и модерацию</p>

      {/* Status filters */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span style={{ marginLeft: '4px', opacity: 0.8 }}>{filter.count}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Main queue table */}
      <div className="card mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Автор</th>
              <th>Канал</th>
              <th>Категория</th>
              <th>Подано</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Нет статей в этой категории
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="table__row">
                  <td><strong style={{ color: 'var(--text-primary)' }}>{post.title}</strong></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar initials={post.authorInitials} status={post.authorStatus} />
                      {post.authorName}
                    </div>
                  </td>
                  <td><Chip style={CHANNEL_CHIP_STYLES[post.channelType]}>{post.channelName}</Chip></td>
                  <td><Chip>{post.categoryName}</Chip></td>
                  <td className="text-xs text-muted">{formatDate(post.submittedAt)}</td>
                  <td>
                    <Button variant="primary" size="sm" onClick={() => handleReview(post)}>Ревью →</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recently resolved */}
      <div className="card">
        <h3 className="card__title mb-4">Недавно рассмотренные</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Автор</th>
              <th>Решение</th>
              <th>Ревьюер</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {resolvedPosts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Нет рассмотренных статей
                </td>
              </tr>
            ) : (
              resolvedPosts.map((post) => (
                <tr key={post.id} className="table__row">
                  <td>{post.title}</td>
                  <td>{post.authorName}</td>
                  <td>
                    <Chip style={post.resolution === 'approved' ? STATUS_CHIP_STYLES.published : STATUS_CHIP_STYLES.rejected}>
                      {post.resolution === 'approved' ? 'Одобрено' : 'Отклонено'}
                    </Chip>
                  </td>
                  <td>{post.reviewerName}</td>
                  <td className="text-xs text-muted">{formatDate(post.resolvedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Blog Review Screen (sub-component) ---

function BlogReviewScreen({ post, onBack, onRefresh }: {
  post: BlogPost;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [comment, setComment] = useState('');
  const [fixRequest, setFixRequest] = useState('');
  const [showFixModal, setShowFixModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = () => {
    setProcessing('approve');
    setTimeout(() => {
      onRefresh();
      onBack();
      setProcessing(null);
    }, 300);
  };

  const handleReject = () => {
    if (!comment.trim()) {
      alert('Комментарий обязателен при отклонении');
      return;
    }
    setProcessing('reject');
    setTimeout(() => {
      onRefresh();
      onBack();
      setProcessing(null);
    }, 300);
  };

  const handleRequestFixes = () => {
    if (!fixRequest.trim()) {
      alert('Укажите, что нужно исправить');
      return;
    }
    setProcessing('fix');
    setTimeout(() => {
      onRefresh();
      setShowFixModal(false);
      setProcessing(null);
    }, 300);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]} 2026`;
  };

  return (
    <div className="page-container">
      <div className="flex justify-between mb-6">
        <Button variant="tertiary" size="sm" onClick={onBack}>← Очередь</Button>
        <div className="flex gap-2">
          <Button variant="tertiary" size="sm">👁 Предпросмотр</Button>
        </div>
      </div>

      <h1 className="page-title">Ревью статьи</h1>
      <Chip
        style={{
          display: 'inline-flex',
          ...(STATUS_CHIP_STYLES[post.status] || {}),
          marginBottom: 24,
        }}
      >
        {post.status === 'review' ? 'На ревью' : post.status}
      </Chip>

      {/* Article metadata */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar initials={post.authorInitials} status={post.authorStatus} size="md" />
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{post.authorName}</div>
              <div className="text-xs text-muted">
                {post.authorUsername} · подано {formatDate(post.submittedAt)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Chip style={CHANNEL_CHIP_STYLES[post.channelType]}>{post.channelName}</Chip>
            <Chip>{post.categoryName}</Chip>
          </div>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {post.title}
        </h2>
        <p className="text-secondary text-sm">{post.excerpt}</p>
      </div>

      {/* Article content preview */}
      <div className="card mb-6">
        <h3 className="card__title mb-4">📄 Содержание статьи</h3>
        <div className="card__body" style={{ lineHeight: 1.8, fontSize: 14, background: 'var(--bg-tertiary)', padding: 16 }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>## Введение</h4>
          <p style={{ marginBottom: 12 }}>
            В Balloo realtime-обновления — основа UX. Сообщения, реакции, статусы — всё должно доходить мгновенно.
          </p>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>## Архитектура</h4>
          <p style={{ marginBottom: 12 }}>
            Мы используем <strong>Hono + uWebSockets.js</strong> для WebSocket-сервера...
          </p>
          <p style={{ marginBottom: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            [... продолжение статьи ...]
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="card mb-6">
        <h3 className="card__title mb-4">Теги</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {post.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </div>

      {/* Review decision */}
      <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
        <h3 className="card__title mb-4">Решение по статье</h3>
        <div className="form-group">
          <label className="form-label">
            Комментарий автору (обязательно при отклонении / правках)
          </label>
          <textarea
            className="form-textarea"
            placeholder="Напишите комментарий для автора…"
            style={{ minHeight: 80 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleApprove} disabled={processing !== null}>
            ✓ Одобрить и опубликовать
          </Button>
          <Button variant="secondary" onClick={() => setShowFixModal(true)} disabled={processing !== null}>
            ⚠ Запросить правки
          </Button>
          <Button variant="danger" onClick={handleReject} disabled={processing !== null}>
            ✕ Отклонить
          </Button>
        </div>
      </div>

      {/* Fix request modal */}
      {showFixModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowFixModal(false)} />
          <div className="modal modal--status-warning">
            <div className="modal__header">
              <span className="modal__title">⚠ Запросить правки</span>
              <div className="modal__close" onClick={() => setShowFixModal(false)}>✕</div>
            </div>
            <div className="modal__body">
              <p className="text-sm text-secondary mb-4">
                Укажите что именно нужно исправить. Автор получит уведомление.
              </p>
              <div className="form-group">
                <label className="form-label">Что нужно исправить? *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Опишите правки подробно: например, 'Заменить заголовок', 'Добавить примеры кода', 'Исправить ошибки'..."
                  style={{ minHeight: 120 }}
                  required
                  value={fixRequest}
                  onChange={(e) => setFixRequest(e.target.value)}
                />
              </div>
            </div>
            <div className="modal__footer">
              <Button variant="tertiary" onClick={() => setShowFixModal(false)}>Отмена</Button>
              <Button variant="warning" onClick={handleRequestFixes} disabled={processing !== null}>
                Отправить правки
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
