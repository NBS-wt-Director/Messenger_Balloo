// BlogCard — карточка поста (изображение, заголовок, дата, категория, excerpt)
// Тикет №60 — Blog: корпоративный блог

import { useNavigate } from 'react-router-dom';
import type { BlogLandingPost } from './types';

interface BlogCardProps {
  post: BlogLandingPost;
  variant?: 'featured' | 'regular' | 'compact' | 'search';
}

export function BlogCard({ post, variant = 'regular' }: BlogCardProps) {
  const navigate = useNavigate();

  const handleClick = () => navigate(`/blog/post/${post.id}`);

  // Featured — крупная карточка с обложкой сверху
  if (variant === 'featured') {
    return (
      <div
        className="blog-card blog-card--featured"
        onClick={handleClick}
        style={{ borderLeft: '3px solid var(--accent)', cursor: 'pointer' }}
      >
        <div
          className="blog-card__cover"
          style={{ background: post.coverGradient }}
        >
          <span style={{ fontSize: 64 }}>{post.coverEmoji}</span>
        </div>
        <div className="blog-card__body">
          <div className="flex items-center gap-2 mb-2">
            {post.channel && (
              <span className="chip chip--accent">{post.channel.name}</span>
            )}
            <span className="chip">Закреплено</span>
          </div>
          <h2 className="blog-card__title blog-card__title--lg">{post.title}</h2>
          <p className="blog-card__excerpt">{post.excerpt}</p>
          <BlogCardFooter post={post} />
        </div>
      </div>
    );
  }

  // Compact — для related posts
  if (variant === 'compact') {
    return (
      <div
        className="blog-card blog-card--compact card card--hover"
        onClick={handleClick}
        style={{ cursor: 'pointer', minWidth: 200, textDecoration: 'none' }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{post.coverEmoji}</div>
        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {post.title}
        </div>
        <div className="text-xs text-muted mt-2">
          {post.readTime} мин · 👁 {formatNumber(post.views)}
        </div>
      </div>
    );
  }

  // Search — с подсветкой
  if (variant === 'search') {
    return (
      <div
        className="blog-card blog-card--search card card--hover"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex gap-4">
          <div
            className="blog-card__cover blog-card__cover--sm"
            style={{ background: post.coverGradient }}
          >
            <span style={{ fontSize: 36 }}>{post.coverEmoji}</span>
          </div>
          <div className="flex-1">
            {post.channel && (
              <div className="flex items-center gap-2 mb-2">
                <span className="chip">{post.channel.name}</span>
              </div>
            )}
            <h3 className="blog-card__title blog-card__title--sm">
              {highlightText(post.title, post.highlightQuery)}
            </h3>
            <p className="blog-card__excerpt blog-card__excerpt--sm">
              {highlightText(post.excerpt, post.highlightQuery)}
            </p>
            <span className="text-xs text-muted">
              {post.author.name} · {post.publishedAtFormatted} · {post.readTime} мин · 👁 {formatNumber(post.views)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Regular — горизонтальная карточка с превью слева
  return (
    <div
      className="blog-card blog-card--regular card card--hover"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex gap-4">
        <div
          className="blog-card__cover blog-card__cover--md"
          style={{ background: post.coverGradient }}
        >
          <span style={{ fontSize: 40 }}>{post.coverEmoji}</span>
        </div>
        <div className="flex-1">
          {post.channel && (
            <div className="flex items-center gap-2 mb-2">
              <span className="chip">{post.channel.name}</span>
            </div>
          )}
          <h3 className="blog-card__title blog-card__title--md">{post.title}</h3>
          <p className="blog-card__excerpt blog-card__excerpt--sm">{post.excerpt}</p>
          <BlogCardFooter post={post} />
        </div>
      </div>
    </div>
  );
}

function BlogCardFooter({ post }: { post: BlogLandingPost }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="avatar avatar--xs avatar--bordered avatar--ctx-contact">
          <div className="avatar__inner">
            <span>{post.author.initials}</span>
          </div>
        </div>
        <span className="text-xs text-muted">
          {post.author.name} · {post.publishedAtFormatted} · {post.readTime} мин
        </span>
      </div>
      <div className="flex gap-2">
        <span className="chip text-xs">👁 {formatNumber(post.views)}</span>
        <span className="chip text-xs">😀 {post.reactions}</span>
        {post.comments > 0 && <span className="chip text-xs">💬 {post.comments}</span>}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function highlightText(text: string, query?: string): React.ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{ background: 'rgba(168,85,247,0.25)', color: 'var(--text-primary)' }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
