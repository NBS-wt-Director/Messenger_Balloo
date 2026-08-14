// BlogSearchScreen — поиск по корпоративному блогу (blog.balloo.su)
// Соответствует макету: mockups/blog-balloo-su/search.html
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { BlogTopBar } from './BlogTopBar';
import { BlogCard } from './BlogCard';
import type { BlogLandingPost, BlogLandingChannel } from './types';

export default function BlogSearchScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<BlogLandingPost[]>([]);
  const [channels, setChannels] = useState<BlogLandingChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load channels for filter
  useEffect(() => {
    let cancelled = false;
    async function loadChannels() {
      try {
        const res = await api.getBlogLandingChannels();
        if (!cancelled) setChannels(res.channels || []);
      } catch {
        if (!cancelled) setChannels([]);
      }
    }
    loadChannels();
    return () => { cancelled = true; };
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string, channelId?: string, pageNum = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    setLoading(pageNum === 1);
    setLoadingMore(pageNum > 1);

    try {
      const res = await api.searchBlogLanding({
        q: searchQuery,
        channelId: channelId === 'all' ? undefined : channelId,
        page: pageNum,
        limit: 10,
      });

      if (pageNum === 1) {
        setResults(res.posts || []);
      } else {
        setResults((prev) => [...prev, ...(res.posts || [])]);
      }
      setTotal(res.total || 0);
      setHasMore(res.hasMore || false);
      setPage(pageNum);
      setSearched(true);
    } catch {
      if (pageNum === 1) {
        setResults([]);
        setTotal(0);
      }
      setSearched(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Trigger search on query/channel change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialQuery) {
        setSearchParams(query ? { q: query } : {});
      }
      performSearch(query, activeChannel, 1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeChannel]);

  // Initial search from URL
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 'all', 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    performSearch(query, activeChannel, page + 1);
  };

  return (
    <div>
      <BlogTopBar title="Поиск" />
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">
            <h1 className="page-title">🔍 Поиск по блогу</h1>

            {/* Search input */}
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Поиск по статьям…"
                style={{ fontSize: 16, padding: 14 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Channel scope selector */}
            <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
              <span
                className={`chip ${activeChannel === 'all' ? 'chip--accent' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveChannel('all')}
              >
                📍 Все каналы
              </span>
              {channels.map((ch) => (
                <span
                  key={ch.id}
                  className={`chip ${activeChannel === ch.id ? 'chip--accent' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveChannel(ch.id)}
                >
                  {ch.name}
                </span>
              ))}
            </div>

            {/* Results count */}
            {searched && !loading && (
              <p className="text-secondary text-sm mb-4">
                Найдено: <strong style={{ color: 'var(--text-primary)' }}>{total} {pluralize(total, 'статья', 'статьи', 'статей')}</strong>
              </p>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center" style={{ padding: 40 }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p className="text-secondary mt-4">Поиск...</p>
              </div>
            )}

            {/* Results */}
            {!loading && results.map((post) => (
              <div key={post.id} className="mb-4">
                <BlogCard post={{ ...post, highlightQuery: query }} variant="search" />
              </div>
            ))}

            {/* No results */}
            {!loading && searched && results.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__animation">🔍</div>
                <div className="empty-state__title">Ничего не найдено</div>
                <div className="empty-state__subtitle">
                  Попробуйте изменить запрос или выбрать другой канал
                </div>
              </div>
            )}

            {/* Not searched yet */}
            {!loading && !searched && (
              <div className="text-center" style={{ padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
                <p className="text-secondary">Введите запрос для поиска по статьям блога</p>
              </div>
            )}

            {/* Load more */}
            {hasMore && !loading && (
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
          </div>
        </div>
      </div>
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
