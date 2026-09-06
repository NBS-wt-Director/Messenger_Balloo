// BlogCategoryScreen — страница категории корпоративного блога (blog.balloo.su)
// Соответствует макету: mockups/blog-balloo-su/category.html
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { BlogTopBar } from './BlogTopBar';
import { BlogCard } from './BlogCard';
import type { BlogLandingPost, BlogLandingCategory } from './types';

const CATEGORY_EMOJI: Record<string, string> = {
  news: '📰',
  tech: '⚙️',
  team: '👥',
  metrics: '📊',
};

export default function BlogCategoryScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<BlogLandingCategory | null>(null);
  const [posts, setPosts] = useState<BlogLandingPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadCategory() {
      setLoading(true);
      try {
        const categoriesRes = await api.getBlogLandingCategories();
        if (cancelled) return;

        const found = (categoriesRes.categories || []).find(
          (c: BlogLandingCategory) => c.slug === slug
        );
        setCategory(found || null);

        if (found) {
          const postsRes = await api.getBlogLandingPosts({
            page: 1,
            limit: 10,
            categoryId: found.id,
            sort,
          });
          if (cancelled) return;
          setPosts(postsRes.posts || []);
          setHasMore(postsRes.hasMore || false);
        }
      } catch {
        if (!cancelled) {
          setCategory(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCategory();
    return () => { cancelled = true; };
  }, [slug, sort]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !category) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const postsRes = await api.getBlogLandingPosts({
        page: nextPage,
        limit: 10,
        categoryId: category.id,
        sort,
      });
      setPosts((prev) => [...prev, ...(postsRes.posts || [])]);
      setHasMore(postsRes.hasMore || false);
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, category, sort]);

  if (loading) {
    return (
      <div>
        <BlogTopBar title="Категория" />
        <div className="main">
          <div className="content overflow-y-auto">
            <div className="page-container">
              <div className="spinner" style={{ margin: '60px auto' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div>
        <BlogTopBar title="Категория" />
        <div className="main">
          <div className="content overflow-y-auto">
            <div className="page-container">
              <div className="empty-state">
                <div className="empty-state__animation">📂</div>
                <div className="empty-state__title">Категория не найдена</div>
                <button className="btn btn--accent mt-4" onClick={() => navigate('/blog')}>
                  ← Вернуться в блог
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BlogTopBar title="Категория" />
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">

            {/* Back */}
            <button className="btn btn--tertiary btn--sm mb-4" onClick={() => navigate('/blog')}>
              ← Лента
            </button>

            {/* Category header */}
            <div className="card mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize: 40 }}>{CATEGORY_EMOJI[category.slug] || '📂'}</span>
                <div>
                  <h1 className="page-title" style={{ marginBottom: 4 }}>{category.name}</h1>
                  <p className="text-secondary text-sm">
                    Статьи в категории «{category.name}»
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="chip">📄 {category.postCount} статей</span>
                <span className="chip">👁 {formatNumber(category.totalViews)} просмотров</span>
              </div>
            </div>

            {/* Sort filter */}
            <div className="flex gap-2 mb-6">
              <span
                className={`chip ${sort === 'recent' ? 'chip--accent' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSort('recent')}
              >
                🕐 По дате
              </span>
              <span
                className={`chip ${sort === 'popular' ? 'chip--accent' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSort('popular')}
              >
                🔥 По популярности
              </span>
            </div>

            {/* Posts in category */}
            {posts.map((post) => (
              <div key={post.id} className="mb-4">
                <BlogCard post={post} variant="regular" />
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё ↓'}
                </button>
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__animation">📭</div>
                <div className="empty-state__title">В этой категории пока нет статей</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

