// Blog Post Screen — просмотр статьи, комментарии, реакции
// Соответствует макету: mockups/blog-balloo-su/post.html

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '@/components/shared/Avatar';
import { Chip } from '@/components/shared/Chip';
import { Button } from '@/components/shared/Button';

interface BlogPostData {
  id: string;
  title: string;
  subtitle: string;
  coverEmoji: string;
  coverGradient: string;
  channel: { name: string; emoji: string; id: string };
  author: { name: string; initials: string; role: string; avatarUrl?: string };
  publishedAt: string;
  readTime: number;
  views: number;
  reactions: number;
  comments: number;
  content: string;
  tags: string[];
}

const POST_MOCK: BlogPostData = {
  id: '1',
  title: 'Релиз v1.0.0-beta — первый публичный бета-релиз Balloo',
  subtitle: 'Сегодня мы запускаем первую бета-версию мессенджера Balloo для всех желающих.',
  coverEmoji: '🚀',
  coverGradient: 'linear-gradient(135deg, #1a1d21, #2d3742)',
  channel: { name: 'Новости', emoji: '📰', id: 'news' },
  author: { name: 'Иван Воронов', initials: 'ИВ', role: 'Lead Developer', avatarUrl: '' },
  publishedAt: '16 июля 2026',
  readTime: 5,
  views: 1234,
  reactions: 34,
  comments: 12,
  content: `Сегодня важный день для нашей команды — мы запускаем <strong>первую бета-версию</strong> мессенджера Balloo. После месяцев разработки, проектирования макетов и настройки инфраструктуры, продукт готов к тестированию широкой аудиторией.

### Что внутри беты?

Balloo v1.0.0-beta включает:

- Онбординг с 3 приветственными экранами
- Аутентификация: Email + OAuth (Яндекс, Mail.ru, Rambler)
- Текстовые сообщения с Markdown, реакции (до 5), вложения
- 1:1 и групповые чаты (4 типа групп)
- Голосовые и видеозвонки 1:1 (WebRTC)
- Восьмигранные аватарки с двойной рамкой
- 3 темы оформления: тёмная, светлая, «Наша»
- 6 языков: RU, EN, ZH, FR, BE, HI

> Balloo — это не просто мессенджер. Это российская технологическая платформа с уникальной визуальной идентичностью.

### Что дальше?

В v1.1 мы планируем групповые видеозвонки до 12 человек, а в v2 — P2G threading, истории и бот-маркетплейс.`,
  tags: ['релиз', 'бета', 'v1.0'],
};

interface Comment {
  id: string;
  author: { name: string; initials: string; role?: string };
  content: string;
  createdAt: string;
  reactions: number;
}

const COMMENTS_MOCK: Comment[] = [
  {
    id: '1',
    author: { name: 'Мария Андреева', initials: 'МА', role: 'Designer' },
    content: 'Отличная работа! Бета выглядит впечатляюще. Жду возможности протестировать групповые чаты 🎉',
    createdAt: '16 июля, 14:30',
    reactions: 8,
  },
  {
    id: '2',
    author: { name: 'Алексей Козлов', initials: 'АК' },
    content: 'Наконец-то российский мессенджер с уникальным дизайном! Октагоны — это круто.',
    createdAt: '16 июля, 15:12',
    reactions: 5,
  },
];

export function BlogPostScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  const [post] = useState<BlogPostData>(POST_MOCK);
  const [comments, setComments] = useState<Comment[]>(COMMENTS_MOCK);
  const [newComment, setNewComment] = useState('');
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const reactions = ['👍', '❤️', '🎉', '🔥', '💡'];

  const handleReaction = (emoji: string) => {
    setActiveReaction(activeReaction === emoji ? null : emoji);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: String(Date.now()),
      author: { name: 'Вы', initials: 'ВЫ' },
      content: newComment,
      createdAt: 'Только что',
      reactions: 0,
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleChannelClick = () => {
    navigate('/blog');
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
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleChannelClick}
                style={{ fontSize: '13px' }}
              >
                ← Лента
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" style={{ fontSize: '13px' }}>
                  ← Предыдущая
                </Button>
                <Button variant="secondary" size="sm" style={{ fontSize: '13px' }}>
                  Следующая →
                </Button>
              </div>
            </div>

            {/* Channel breadcrumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
              onClick={handleChannelClick}
            >
              <Chip style={{ fontSize: '12px', cursor: 'pointer' }}>
                {post.channel.emoji} {post.channel.name}
              </Chip>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>→</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {post.title.slice(0, 30)}...
              </span>
            </div>

            {/* Cover image */}
            <div
              style={{
                width: '100%',
                height: '240px',
                background: post.coverGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '72px',
                borderRadius: '12px',
                marginBottom: '24px',
              }}
            >
              {post.coverEmoji}
            </div>

            {/* Title + subtitle */}
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.3' }}>
              {post.title}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {post.subtitle}
            </p>

            {/* Author + meta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar initials={post.author.initials} size="md" status="online" ctx="contact" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.author.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {post.author.role} · {post.publishedAt} · {post.readTime} мин чтения
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Chip style={{ fontSize: '12px' }}>👁 {post.views.toLocaleString()}</Chip>
                <Chip style={{ fontSize: '12px' }}>😀 {post.reactions}</Chip>
                <Chip style={{ fontSize: '12px' }}>💬 {post.comments}</Chip>
              </div>
            </div>

            {/* Post body */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                lineHeight: '1.8',
                fontSize: '15px',
                color: 'var(--text-primary)',
              }}
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/### (.*)/g, '<h3 style="color:var(--text-primary);margin:24px 0 12px;font-size:18px;">$1</h3>')
                  .replace(/## (.*)/g, '<h2 style="color:var(--text-primary);margin:28px 0 14px;font-size:20px;">$1</h2>')
                  .replace(/> (.*)/g, '<blockquote style="border-left:3px solid var(--accent);padding:12px 16px;background:var(--bg-tertiary);margin:16px 0;color:var(--text-secondary);font-style:italic;">$1</blockquote>')
                  .replace(/- (.*)/g, '<li style="margin-bottom:6px;">$1</li>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p style="margin-bottom:16px;">')
                  .replace(/^/, '<p style="margin-bottom:16px;">')
                  .replace(/$/, '</p>'),
              }}
            />

            {/* Tags */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {post.tags.map((tag) => (
                <Chip key={tag} style={{ cursor: 'pointer', fontSize: '12px' }}>
                  {tag}
                </Chip>
              ))}
            </div>

            {/* Reactions bar */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '32px',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Ваша реакция:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {reactions.map((emoji) => (
                  <Chip
                    key={emoji}
                    variant={activeReaction === emoji ? 'accent' : 'default'}
                    onClick={() => handleReaction(emoji)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '6px 12px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {emoji}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Comments section */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                Комментарии ({comments.length})
              </h3>

              {/* Comment form */}
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    style={{ fontSize: '13px' }}
                  >
                    Отправить
                  </Button>
                </div>
              </div>

              {/* Comments list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Avatar initials={comment.author.initials} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {comment.author.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {comment.author.role && <span>{comment.author.role} · </span>}
                          {comment.createdAt}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '10px' }}>
                      {comment.content}
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Chip
                        style={{ fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => handleReaction('👍')}
                      >
                        👍 {comment.reactions}
                      </Chip>
                      <Chip
                        style={{ fontSize: '11px', cursor: 'pointer' }}
                      >
                        💬 Ответить
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
