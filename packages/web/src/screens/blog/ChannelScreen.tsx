// Channel Screen — страница канала, посты, подписка
// Соответствует макету: mockups/blog-balloo-su/channel.html

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Avatar } from '@/components/shared/Avatar';
import { Chip } from '@/components/shared/Chip';
import { Button } from '@/components/shared/Button';

interface ChannelData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  avatarGradient: string;
  avatarEmoji: string;
  followers: number;
  postCount: number;
  isFollowing: boolean;
  isOwner: boolean;
}

interface ChannelPost {
  id: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  readTime: number;
  views: number;
  reactions: number;
  comments: number;
}

const CHANNEL_MOCK: ChannelData = {
  id: 'news',
  name: 'Новости',
  emoji: '📰',
  description: 'Официальные новости и обновления проекта Balloo. Релизы, важные события и анонсы.',
  avatarGradient: 'linear-gradient(135deg, #a855f7, #6b21a8)',
  avatarEmoji: '📰',
  followers: 342,
  postCount: 28,
  isFollowing: false,
  isOwner: false,
};

const POSTS_MOCK: ChannelPost[] = [
  {
    id: '1',
    title: 'Релиз v1.0.0-beta — первый публичный бета-релиз Balloo',
    subtitle: 'Сегодня мы запускаем первую бета-версию мессенджера Balloo...',
    publishedAt: '16 июля 2026',
    readTime: 5,
    views: 1200,
    reactions: 34,
    comments: 12,
  },
  {
    id: '2',
    title: 'Обновление плана развития на Q3 2026',
    subtitle: 'Делимся подробным планом развития на третий квартал...',
    publishedAt: '14 июля 2026',
    readTime: 4,
    views: 890,
    reactions: 22,
    comments: 8,
  },
  {
    id: '3',
    title: 'Итоги спринта: что сделано за 2 недели',
    subtitle: 'Краткий обзор результатов текущего спринта...',
    publishedAt: '12 июля 2026',
    readTime: 3,
    views: 567,
    reactions: 15,
    comments: 5,
  },
];

export function ChannelScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  const [channel] = useState<ChannelData>(CHANNEL_MOCK);
  const [posts] = useState<ChannelPost[]>(POSTS_MOCK);
  const [isFollowing, setIsFollowing] = useState(channel.isFollowing);
  const [followers, setFollowers] = useState(channel.followers);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.unfollowChannel(channel.id);
      } else {
        await api.followChannel(channel.id);
      }
      setIsFollowing(!isFollowing);
      setFollowers(isFollowing ? followers - 1 : followers + 1);
    } catch {
      // Fallback to local state
      setIsFollowing(!isFollowing);
      setFollowers(isFollowing ? followers - 1 : followers + 1);
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/blog/post/${postId}`);
  };

  const handleBack = () => {
    navigate('/blog');
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
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ← Назад
            </button>
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
              {channel.emoji} {channel.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Channel header */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: channel.avatarGradient,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  margin: '0 auto 16px',
                }}
              >
                {channel.avatarEmoji}
              </div>

              {/* Name */}
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {channel.emoji} {channel.name}
              </h1>

              {/* Description */}
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                {channel.description}
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {channel.postCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Постов</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {followers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Подписчиков</div>
                </div>
              </div>

              {/* Follow button */}
              <Button
                onClick={handleFollow}
                style={{
                  background: isFollowing ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: isFollowing ? 'var(--text-primary)' : '#fff',
                  minWidth: '160px',
                }}
              >
                {isFollowing ? '✓ Подписка' : '+ Подписаться'}
              </Button>

              {/* Admin actions */}
              {channel.isOwner && (
                <div style={{ marginTop: '12px' }}>
                  <Chip
                    variant="default"
                    style={{ fontSize: '12px', cursor: 'pointer' }}
                  >
                    ⚙️ Управление каналом
                  </Chip>
                </div>
              )}
            </div>

            {/* Posts list */}
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Посты канала
            </h2>

            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                  {post.subtitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {post.publishedAt} · {post.readTime} мин
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Chip style={{ fontSize: '11px' }}>👁 {formatViews(post.views)}</Chip>
                    <Chip style={{ fontSize: '11px' }}>😀 {post.reactions}</Chip>
                    <Chip style={{ fontSize: '11px' }}>💬 {post.comments}</Chip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
