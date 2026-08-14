// Blog Screen — лента постов, фильтры по каналам/категориям, featured посты
// Соответствует макету: mockups/blog-balloo-su/feed.html

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Avatar } from '@/components/shared/Avatar';
import { Chip } from '@/components/shared/Chip';
import { Button } from '@/components/shared/Button';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  coverEmoji: string;
  coverGradient: string;
  channel: { name: string; emoji: string };
  isPinned?: boolean;
  author: { name: string; initials: string; avatarUrl?: string };
  publishedAt: string;
  readTime: number;
  views: number;
  reactions: number;
  comments: number;
  content: string;
  tags: string[];
  categoryId: string;
}

interface BlogChannel {
  id: string;
  name: string;
  emoji: string;
}

const CHANNELS: BlogChannel[] = [
  { id: 'all', name: 'Все каналы', emoji: '' },
  { id: 'news', name: 'Новости', emoji: '📰' },
  { id: 'tech', name: 'Технологии', emoji: '⚙️' },
  { id: 'team', name: 'Команда', emoji: '👥' },
  { id: 'metrics', name: 'Метрики', emoji: '📊' },
];

const POSTS_MOCK: BlogPost[] = [
  {
    id: '1',
    title: 'Релиз v1.0.0-beta — первый публичный бета-релиз Balloo',
    subtitle: 'Сегодня мы запускаем первую бета-версию мессенджера Balloo. Онбординг, чаты, звонки, группы, 3 темы оформления и 6 языков — всё готово для первых пользователей…',
    coverEmoji: '🚀',
    coverGradient: 'linear-gradient(135deg, #1a1d21, #2d3742)',
    channel: { name: 'Новости', emoji: '📰' },
    isPinned: true,
    author: { name: 'Иван Воронов', initials: 'ИВ', avatarUrl: '' },
    publishedAt: '16 июля 2026',
    readTime: 5,
    views: 1200,
    reactions: 34,
    comments: 12,
    content: 'Сегодня важный день для нашей команды — мы запускаем первую бета-версию мессенджера Balloo.',
    tags: ['#релиз', '#beta', '#v1.0.0', '#обновление'],
    categoryId: 'news',
  },
  {
    id: '2',
    title: 'Дизайн-система Balloo: октагоны, пузыри и glassmorphism',
    subtitle: 'Как мы построили уникальную визуальную идентичность: восьмигранные аватарки, пузыри без скруглений, три темы оформления…',
    coverEmoji: '🎨',
    coverGradient: 'linear-gradient(135deg, #a855f7, #6b21a8)',
    channel: { name: 'Технологии', emoji: '⚙️' },
    author: { name: 'Мария Андреева', initials: 'МА', avatarUrl: '' },
    publishedAt: '14 июля 2026',
    readTime: 8,
    views: 856,
    reactions: 21,
    comments: 7,
    content: 'Как мы построили уникальную визуальную идентичность: восьмигранные аватарки, пузыри без скруглений.',
    tags: ['#дизайн', '#система', '#ui'],
    categoryId: 'tech',
  },
  {
    id: '3',
    title: 'WebSocket на Hono + uWebSockets.js: масштабирование realtime',
    subtitle: 'Почему мы выбрали uWebSockets.js вместо ws, как масштабируем соединения и обрабатываем миллионы сообщений…',
    coverEmoji: '⚡',
    coverGradient: 'linear-gradient(135deg, #2db84d, #166534)',
    channel: { name: 'Технологии', emoji: '⚙️' },
    author: { name: 'Иван Воронов', initials: 'ИВ', avatarUrl: '' },
    publishedAt: '12 июля 2026',
    readTime: 12,
    views: 2100,
    reactions: 45,
    comments: 18,
    content: 'Почему мы выбрали uWebSockets.js вместо ws, как масштабируем соединения.',
    tags: ['#websocket', '#backend', '#масштабирование'],
    categoryId: 'tech',
  },
  {
    id: '4',
    title: 'Команда Balloo: как мы работаем удалённо',
    subtitle: 'История создания команды, инструменты коммуникации, ретроспективы и наши принципы удалённой работы…',
    coverEmoji: '👥',
    coverGradient: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    channel: { name: 'Команда', emoji: '👥' },
    author: { name: 'Анна Петрова', initials: 'АП', avatarUrl: '' },
    publishedAt: '10 июля 2026',
    readTime: 6,
    views: 643,
    reactions: 28,
    comments: 9,
    content: 'История создания команды, инструменты коммуникации, ретроспективы.',
    tags: ['#команда', '#удалёнка', '#ретроспектива'],
    categoryId: 'team',
  },
];

export function BlogScreen() {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState('all');
  const [posts, setPosts] = useState<BlogPost[]>(POSTS_MOCK);
  const [channels, setChannels] = useState<BlogChannel[]>(CHANNELS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Загрузка каналов из API
    const loadChannels = async () => {
      try {
        const data = await api.getBlogChannels();
        if (data.length > 0) {
          setChannels(prev => [prev[0], ...data.map((c: any) => ({
            id: c.id,
            name: c.name,
            emoji: c.emoji || '📌',
          }))]);
        }
      } catch {
        // Используем моковые данные
      }
    };
    loadChannels();
  }, []);

  const handleChannelFilter = (channelId: string) => {
    setActiveChannel(channelId);
    if (channelId === 'all') {
      setPosts(POSTS_MOCK);
    } else {
      const filtered = POSTS_MOCK.filter(p => p.categoryId === channelId);
      setPosts(filtered);
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/blog/post/${postId}`);
  };

  const handleCreatePost = () => {
    navigate('/blog/create');
  };

  const formatViews = (views: number): string => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return String(views);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--bg-tertiary)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: '#a855f7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📝
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              Blog
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button onClick={handleCreatePost} style={{ background: 'var(--accent)', color: '#fff' }}>
              ✏️ Написать
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              📝 Корпоративный блог
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Новости • Технологии • Команда Balloo
            </p>

            {/* Channel filter chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {channels.map((channel) => (
                <Chip
                  key={channel.id}
                  variant={activeChannel === channel.id ? 'accent' : 'default'}
                  onClick={() => handleChannelFilter(channel.id)}
                  style={{ cursor: 'pointer', fontSize: '13px' }}
                >
                  {channel.emoji && <span style={{ marginRight: '4px' }}>{channel.emoji}</span>}
                  {channel.name}
                </Chip>
              ))}
            </div>

            {/* Posts list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Постов пока нет</p>
                <p style={{ fontSize: '13px' }}>Будьте первым — напишите статью!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    borderLeft: post.isPinned ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Featured cover */}
                  {post.isPinned && (
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
                        background: post.coverGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '56px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      {post.coverEmoji}
                    </div>
                  )}

                  {/* Channel + pinned */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Chip variant="accent" style={{ fontSize: '12px' }}>
                      {post.channel.emoji} {post.channel.name}
                    </Chip>
                    {post.isPinned && (
                      <Chip variant="default" style={{ fontSize: '12px' }}>
                        Закреплено
                      </Chip>
                    )}
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontSize: post.isPinned ? '20px' : '17px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                    }}
                  >
                    {post.title}
                  </h2>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      marginBottom: '12px',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.subtitle}
                  </p>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar
                        initials={post.author.initials}
                        size="xs"
                        status="online"
                        ctx="contact"
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {post.author.name} · {post.publishedAt} · {post.readTime} мин чтения
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Chip style={{ fontSize: '11px' }}>👁 {formatViews(post.views)}</Chip>
                      <Chip style={{ fontSize: '11px' }}>😀 {post.reactions}</Chip>
                      <Chip style={{ fontSize: '11px' }}>💬 {post.comments}</Chip>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
