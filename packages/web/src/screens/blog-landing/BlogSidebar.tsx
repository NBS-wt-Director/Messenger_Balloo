// BlogSidebar — сайдбар (категории, последние посты, теги)
// Тикет №60 — Blog: корпоративный блог

import { useNavigate } from 'react-router-dom';
import type { BlogLandingCategory, BlogLandingPost } from './types';

interface BlogSidebarProps {
  categories: BlogLandingCategory[];
  recentPosts: BlogLandingPost[];
  activeCategoryId?: string;
}

export function BlogSidebar({ categories, recentPosts, activeCategoryId }: BlogSidebarProps) {
  const navigate = useNavigate();

  // Collect all tags
  const allTags = new Set<string>();
  recentPosts.forEach((p) => p.tags.forEach((t) => allTags.add(t)));

  return (
    <div className="blog-sidebar">
      {/* Categories */}
      <div className="card mb-4">
        <h3 className="card__title mb-3">📂 Категории</h3>
        <div className="blog-sidebar__categories">
          <div
            className={`blog-sidebar__category ${!activeCategoryId ? 'blog-sidebar__category--active' : ''}`}
            onClick={() => navigate('/blog')}
            style={{ cursor: 'pointer' }}
          >
            <span>Все</span>
            <span className="text-xs text-muted">
              {categories.reduce((s, c) => s + c.postCount, 0)}
            </span>
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`blog-sidebar__category ${activeCategoryId === cat.id ? 'blog-sidebar__category--active' : ''}`}
              onClick={() => navigate(`/blog/category/${cat.slug}`)}
              style={{ cursor: 'pointer' }}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-muted">{cat.postCount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent posts */}
      <div className="card mb-4">
        <h3 className="card__title mb-3">🕐 Последние статьи</h3>
        <div className="blog-sidebar__recent">
          {recentPosts.slice(0, 5).map((post) => (
            <div
              key={post.id}
              className="blog-sidebar__recent-item"
              onClick={() => navigate(`/blog/post/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: 20 }}>{post.coverEmoji}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {post.title}
                </div>
                <div className="text-xs text-muted">
                  {post.publishedAtFormatted} · 👁 {post.views}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags.size > 0 && (
        <div className="card">
          <h3 className="card__title mb-3">🏷 Теги</h3>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {[...allTags].map((tag) => (
              <span key={tag} className="chip" style={{ cursor: 'pointer' }} onClick={() => navigate(`/blog/search?q=${encodeURIComponent(tag)}`)}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
