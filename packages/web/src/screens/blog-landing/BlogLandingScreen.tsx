// BlogLandingScreen — главная страница корпоративного блога (blog.balloo.su)
// Соответствует макету: mockups/blog-balloo-su/feed.html
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { BlogTopBar } from './BlogTopBar';
import { BlogCard } from './BlogCard';
import { BlogSidebar } from './BlogSidebar';
import { BlogSubscribeForm } from './BlogSubscribeForm';
import type { BlogLandingPost, BlogLandingCategory, BlogLandingChannel } from './types';

export default function BlogLandingScreen() {
  const navigate = useNavigate();

  const [featuredPosts, setFeaturedPosts] = useState<BlogLandingPost[]>([]);
  const [posts, setPosts] = useState<BlogLandingPost[]>([]);
  const [categories, setCategories] = useState<BlogLandingCategory[]>([]);
  const [channels, setChannels] = useState<BlogLandingChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      try {
        const [featuredRes, postsRes, categoriesRes, channelsRes] = await Promise.all([
          api.getBlogLandingFeatured(),
          api.getBlogLandingPosts({ page: 1, limit: 6 }),
          api.getBlogLandingCategories(),
          api.getBlogLandingChannels(),
        ]);

        if (cancelled) return;

        setFeaturedPosts(featuredRes.posts || []);
        setPosts(postsRes.posts || []);
        setHasMore(postsRes.hasMore || false);
        setCategories(categoriesRes.categories || []);
        setChannels(channelsRes.channels || []);
      } catch (err) {
        // Fallback: use mock data if API is unavailable
        if (!cancelled) {
          setFeaturedPosts(MOCK_FEATURED);
          setPosts(MOCK_POSTS);
          setCategories(MOCK_CATEGORIES);
          setChannels(MOCK_CHANNELS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => { cancelled = true; };
  }, []);

  // Filter by channel
  const handleChannelFilter = useCallback(async (channelId: string) => {
    setActiveChannel(channelId);
    setPage(1);
    setLoading(true);

    try {
      const postsRes = await api.getBlogLandingPosts({
        page: 1,
        limit: 6,
        channelId: channelId === 'all' ? undefined : channelId,
      });
      setPosts(postsRes.posts || []);
      setHasMore(postsRes.hasMore || false);
    } catch {
      setPosts(MOCK_POSTS);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more (infinite scroll)
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const postsRes = await api.getBlogLandingPosts({
        page: nextPage,
        limit: 6,
        channelId: activeChannel === 'all' ? undefined : activeChannel,
      });
      setPosts((prev) => [...prev, ...(postsRes.posts || [])]);
      setHasMore(postsRes.hasMore || false);
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, activeChannel]);

  if (loading) {
    return (
      <div>
        <BlogTopBar />
        <div className="main">
          <div className="content overflow-y-auto">
            <div className="page-container">
              <div className="text-center" style={{ padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p className="text-secondary mt-4">Загрузка блога...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featuredPost = featuredPosts[0] || posts[0];
  const otherFeatured = featuredPosts.slice(1, 4);

  return (
    <div>
      <BlogTopBar />
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">
            <h1 className="page-title">📝 Корпоративный блог</h1>
            <p className="page-subtitle">Новости • Технологии • Команда Balloo</p>

            {/* Channel filter chips */}
            <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
              <span
                className={`chip ${activeChannel === 'all' ? 'chip--accent' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleChannelFilter('all')}
              >
                Все каналы
              </span>
              {channels.map((ch) => (
                <span
                  key={ch.id}
                  className={`chip ${activeChannel === ch.id ? 'chip--accent' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleChannelFilter(ch.id)}
                >
                  {ch.name}
                </span>
              ))}
            </div>

            <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
              {/* Main content */}
              <div className="flex-1" style={{ minWidth: 300, flexBasis: '70%' }}>
                {/* Featured post */}
                {featuredPost && (
                  <div className="mb-6">
                    <BlogCard post={featuredPost} variant="featured" />
                  </div>
                )}

                {/* Other featured (3 cards) */}
                {otherFeatured.length > 0 && (
                  <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
                    {otherFeatured.map((post) => (
                      <div key={post.id} className="flex-1" style={{ minWidth: 200 }}>
                        <BlogCard post={post} variant="compact" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Regular posts */}
                {posts.map((post) => (
                  <div key={post.id} className="mb-4">
                    <BlogCard post={post} variant="regular" />
                  </div>
                ))}

                {/* Load more / infinite scroll */}
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
                    <div className="empty-state__title">Статей пока нет</div>
                    <div className="empty-state__subtitle">Загляните позже</div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div style={{ width: 300, flexShrink: 0 }}>
                <BlogSidebar
                  categories={categories}
                  recentPosts={featuredPosts.length > 0 ? featuredPosts : posts}
                />
                <div className="mt-4">
                  <BlogSubscribeForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Mock data (fallback when API is unavailable)
// ============================================================

const MOCK_FEATURED: BlogLandingPost[] = [
  {
    id: 'mock-1',
    title: 'Релиз v1.0.0-beta — первый публичный бета-релиз Balloo',
    excerpt: 'Сегодня мы запускаем первую бета-версию мессенджера Balloo. Онбординг, чаты, звонки, группы, 3 темы оформления и 6 языков — всё готово для первых пользователей…',
    content: '',
    coverEmoji: '🚀',
    coverGradient: 'linear-gradient(135deg, #1a1d21, #2d3742)',
    channel: { id: 'news', name: '📰 Новости' },
    categories: [],
    author: { id: '1', name: 'Иван Воронов', initials: 'ИВ' },
    publishedAt: Date.now() / 1000,
    publishedAtFormatted: '16 июля 2026',
    readTime: 5,
    views: 1200,
    reactions: 34,
    comments: 12,
    tags: ['#релиз', '#beta', '#v1.0.0'],
  },
];

const MOCK_POSTS: BlogLandingPost[] = [
  {
    id: 'mock-2',
    title: 'Дизайн-система Balloo: октагоны, пузыри и glassmorphism',
    excerpt: 'Как мы построили уникальную визуальную идентичность: восьмигранные аватарки, пузыри без скруглений, три темы оформления…',
    content: '',
    coverEmoji: '🎨',
    coverGradient: 'linear-gradient(135deg, #a855f7, #6b21a8)',
    channel: { id: 'tech', name: '⚙️ Технологии' },
    categories: [],
    author: { id: '2', name: 'Мария Андреева', initials: 'МА' },
    publishedAt: Date.now() / 1000,
    publishedAtFormatted: '14 июля 2026',
    readTime: 8,
    views: 856,
    reactions: 21,
    comments: 0,
    tags: ['#дизайн'],
  },
  {
    id: 'mock-3',
    title: 'WebSocket на Hono + uWebSockets.js: масштабирование realtime',
    excerpt: 'Почему мы выбрали uWebSockets.js вместо ws, как масштабируем соединения и обрабатываем миллионы сообщений…',
    content: '',
    coverEmoji: '⚡',
    coverGradient: 'linear-gradient(135deg, #2db84d, #166534)',
    channel: { id: 'tech', name: '⚙️ Технологии' },
    categories: [],
    author: { id: '1', name: 'Иван Воронов', initials: 'ИВ' },
    publishedAt: Date.now() / 1000,
    publishedAtFormatted: '12 июля 2026',
    readTime: 12,
    views: 2100,
    reactions: 45,
    comments: 0,
    tags: ['#websocket', '#realtime'],
  },
];

const MOCK_CATEGORIES: BlogLandingCategory[] = [
  { id: 'news', name: 'Новости', slug: 'news', postCount: 24, totalViews: 45200 },
  { id: 'tech', name: 'Технологии', slug: 'tech', postCount: 18, totalViews: 32100 },
  { id: 'team', name: 'Команда', slug: 'team', postCount: 8, totalViews: 5400 },
  { id: 'metrics', name: 'Метрики', slug: 'metrics', postCount: 5, totalViews: 3200 },
];

const MOCK_CHANNELS: BlogLandingChannel[] = [
  { id: 'news', name: '📰 Новости', description: 'Официальные новости', postCount: 24, followers: 1200, totalViews: 45200 },
  { id: 'tech', name: '⚙️ Технологии', description: 'Технические статьи', postCount: 18, followers: 800, totalViews: 32100 },
  { id: 'team', name: '👥 Команда', description: 'Новости команды', postCount: 8, followers: 400, totalViews: 5400 },
  { id: 'metrics', name: '📊 Метрики', description: 'Аналитика и метрики', postCount: 5, followers: 200, totalViews: 3200 },
];
