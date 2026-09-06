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
      } catch {
        // API unavailable — show empty state
        if (!cancelled) {
          setFeaturedPosts([]);
          setPosts([]);
          setCategories([]);
          setChannels([]);
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
      setPosts([]);
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

