// BlogChannelScreen — страница канала/автора корпоративного блога (blog.balloo.su)
// Соответствует макету: mockups/blog-balloo-su/channel.html
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { BlogTopBar } from './BlogTopBar';
import { BlogCard } from './BlogCard';
import type { BlogLandingPost, BlogLandingChannel } from './types';

export default function BlogChannelScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [channel, setChannel] = useState<BlogLandingChannel | null>(null);
  const [posts, setPosts] = useState<BlogLandingPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [channelSearch, setChannelSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function loadChannel() {
      setLoading(true);
      try {
        const [channelsRes, postsRes] = await Promise.all([
          api.getBlogLandingChannels(),
          api.getBlogLandingPosts({ page: 1, limit: 10, channelId: id }),
        ]);

        if (cancelled) return;

        const found = (channelsRes.channels || []).find(
          (c: BlogLandingChannel) => c.id === id
        );
        setChannel(found || null);
        setPosts(postsRes.posts || []);
        setHasMore(postsRes.hasMore || false);
      } catch {
        if (!cancelled) {
          setChannel(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChannel();
    return () => { cancelled = true; };
  }, [id]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !id) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const postsRes = await api.getBlogLandingPosts({ page: nextPage, limit: 10, channelId: id });
      setPosts((prev) => [...prev, ...(postsRes.posts || [])]);
      setHasMore(postsRes.hasMore || false);
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, id]);

  // Filter posts by in-channel search
  const filteredPosts = channelSearch
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(channelSearch.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(channelSearch.toLowerCase())
      )
    : posts;

  if (loading) {
    return (
      <div>
        <BlogTopBar title="Канал" />
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

  if (!channel) {
    return (
      <div>
        <BlogTopBar title="Канал" />
        <div className="main">
          <div className="content overflow-y-auto">
            <div className="page-container">
              <div className="empty-state">
                <div className="empty-state__animation">📡</div>
                <div className="empty-state__title">Канал не найден</div>
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
      <BlogTopBar title="Канал" />
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">

            {/* Back */}
            <button className="btn btn--tertiary btn--sm mb-4" onClick={() => navigate('/blog')}>
              ← Все каналы
            </button>

            {/* Channel header */}
            <div className="card mb-6">
              {/* Cover banner */}
              <div
                className="blog-channel__cover"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6b21a8)' }}
              >
                <span style={{ fontSize: 48 }}>{getChannelEmoji(channel.name)}</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div
                  className="blog-channel__avatar"
                  style={{
                    clipPath: 'var(--octagon-clip)',
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--accent)',
                  }}
                >
                  <span style={{ fontSize: 36 }}>{getChannelEmoji(channel.name)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>{channel.name}</h1>
                    <span className="chip chip--accent">Канал</span>
                  </div>
                  <p className="text-secondary text-sm">
                    {channel.description || 'Канал корпоративного блога Balloo'}
                  </p>
                </div>
                <button
                  className={`btn ${subscribed ? 'btn--secondary' : 'btn--accent'}`}
                  onClick={() => setSubscribed(!subscribed)}
                >
                  {subscribed ? '✓ Подписан' : '+ Подписаться'}
                </button>
              </div>

              <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
                <span className="chip">📄 {channel.postCount} статей</span>
                <span className="chip">👁 {formatNumber(channel.totalViews)} просмотров</span>
                <span className="chip">😀 {formatNumber(channel.followers)} подписчиков</span>
              </div>
            </div>

            {/* In-channel search */}
            <div className="form-group mb-4">
              <input
                type="text"
                className="form-input"
                placeholder={`🔍 Поиск по каналу «${channel.name}»...`}
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
              />
            </div>

            {/* Posts in channel */}
            {filteredPosts.map((post) => (
              <div key={post.id} className="mb-4">
                <BlogCard post={post} variant="regular" />
              </div>
            ))}

            {/* Load more */}
            {hasMore && !channelSearch && (
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

            {!loading && filteredPosts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__animation">📭</div>
                <div className="empty-state__title">
                  {channelSearch ? 'Ничего не найдено в канале' : 'В канале пока нет статей'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getChannelEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('новост')) return '📰';
  if (lower.includes('технол')) return '⚙️';
  if (lower.includes('команд')) return '👥';
  if (lower.includes('метрик')) return '📊';
  if (lower.includes('иван')) return '🦊';
  if (lower.includes('мария') || lower.includes('дизайн')) return '🎨';
  if (lower.includes('алекс') || lower.includes('devops')) return '🐳';
  return '📝';
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

