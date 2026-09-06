// BlogLandingPostScreen — страница поста корпоративного блога (blog.balloo.su)
// Соответствует макету: mockups/blog-balloo-su/post.html
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { BlogTopBar } from './BlogTopBar';
import { BlogCard } from './BlogCard';
import { BlogShareButtons } from './BlogShareButtons';
import type { BlogLandingPost } from './types';

export default function BlogLandingPostScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogLandingPost | null>(null);
  const [related, setRelated] = useState<BlogLandingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      try {
        const res = await api.getBlogLandingPost(id!);
        if (cancelled) return;
        setPost(res.post);
        setRelated(res.related || []);
        setComments(res.post?.commentsList || []);
      } catch {
        if (!cancelled) {
          setPost(null);
          setRelated([]);
          setComments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPost();
    return () => { cancelled = true; };
  }, [id]);

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `local-${Date.now()}`,
      author: { id: 'me', name: 'Вы', initials: 'ВЫ' },
      content: commentText,
      createdAtFormatted: 'только что',
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
  };

  if (loading) {
    return (
      <div>
        <BlogTopBar title="Статья" />
        <div className="main">
          <div className="content overflow-y-auto">
            <div className="page-container">
              <div className="text-center" style={{ padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div>
        <BlogTopBar title="Статья" />
        <div className="main">
          <div className="content overflow-y-auto">
            <div className="page-container">
              <div className="empty-state">
                <div className="empty-state__animation">🔍</div>
                <div className="empty-state__title">Статья не найдена</div>
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
      <BlogTopBar title="Статья" />
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">

            {/* Neighbor navigation */}
            <div className="flex justify-between mb-6">
              <button className="btn btn--tertiary btn--sm" onClick={() => navigate('/blog')}>
                ← Лента
              </button>
              <div className="flex gap-2">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate(-1)}
                >
                  ← Предыдущая
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate('/blog')}
                >
                  Следующая →
                </button>
              </div>
            </div>

            {/* Channel breadcrumb */}
            {post.channel && (
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="chip"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/blog/channel/${post.channel!.id}`)}
                >
                  {post.channel.name}
                </span>
                <span className="text-muted text-xs">→</span>
                <span className="text-xs text-secondary">{post.title.slice(0, 40)}{post.title.length > 40 ? '…' : ''}</span>
              </div>
            )}

            {/* Cover image */}
            <div
              className="blog-cover mb-6"
              style={{ background: post.coverGradient }}
            >
              <span style={{ fontSize: 80 }}>{post.coverEmoji}</span>
            </div>

            {/* Post header */}
            <h1 className="page-title" style={{ marginBottom: 8 }}>{post.title}</h1>
            {post.excerpt && (
              <p className="page-subtitle" style={{ marginBottom: 16 }}>{post.excerpt}</p>
            )}

            {/* Author + meta */}
            <div className="flex items-center justify-between mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="flex items-center gap-3">
                <div className="avatar avatar--md avatar--bordered avatar--status-online avatar--ctx-contact">
                  <div className="avatar__inner">
                    <span>{post.author.initials}</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {post.author.name}
                  </div>
                  <div className="text-xs text-muted">
                    {post.publishedAtFormatted} · {post.readTime} мин чтения
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="chip">👁 {post.views}</span>
                <span className="chip">😀 {post.reactions}</span>
                <span className="chip">💬 {comments.length}</span>
                <BlogShareButtons title={post.title} />
              </div>
            </div>

            {/* Post body (markdown rendered) */}
            <div className="card mb-6">
              <div className="card__body blog-post-content">
                <RenderContent content={post.content} />
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="chip"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/blog/search?q=${encodeURIComponent(tag)}`)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reactions bar */}
            <div className="card mb-6">
              <h3 className="card__title mb-4">Реакции</h3>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {['👍', '❤️', '🚀', '🎉', '🔥'].map((emoji, i) => (
                  <span
                    key={emoji}
                    className="message__reaction"
                    style={{ cursor: 'pointer' }}
                  >
                    {emoji} <span>{[12, 8, 6, 5, 3][i]}</span>
                  </span>
                ))}
                <button className="btn btn--tertiary btn--sm">+ Добавить реакцию</button>
              </div>
            </div>

            {/* Comments */}
            <div className="card mb-6">
              <h3 className="card__title mb-4">Комментарии ({comments.length})</h3>

              {comments.map((comment: any) => (
                <div key={comment.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="avatar avatar--xs avatar--bordered avatar--ctx-contact">
                      <div className="avatar__inner">
                        <span>{comment.author.initials}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    <span className="text-xs text-muted">{comment.createdAtFormatted}</span>
                  </div>
                  <p className="text-sm text-secondary" style={{ paddingLeft: 40 }}>
                    {comment.content}
                  </p>
                  <div className="flex gap-2" style={{ paddingLeft: 40, marginTop: 6 }}>
                    <button className="btn btn--tertiary btn--sm">😀 0</button>
                    <button className="btn btn--tertiary btn--sm">↩ Ответить</button>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div className="input-area mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div className="avatar avatar--xs avatar--bordered avatar--status-online avatar--ctx-contact">
                  <div className="avatar__inner"><span>ВЫ</span></div>
                </div>
                <textarea
                  className="input-area__field"
                  placeholder="Напишите комментарий…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  className="input-area__btn input-area__btn--send"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                >
                  ➤
                </button>
              </div>
            </div>

            {/* Related posts */}
            {related.length > 0 && (
              <div className="card">
                <h3 className="card__title mb-4">📖 Читайте также — {related.length}</h3>
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                  {related.map((rp) => (
                    <BlogCard key={rp.id} post={rp} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Simple Markdown renderer (headings, paragraphs, lists, blockquote, links)
// ============================================================
function RenderContent({ content }: { content: string }) {
  if (!content) {
    return <p className="text-secondary">Содержание поста будет доступно позже.</p>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 16, lineHeight: 2 }}>
          {listItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={i} style={{ margin: '24px 0 12px', fontSize: 18, color: 'var(--text-primary)' }}>{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={i} style={{ margin: '24px 0 12px', fontSize: 20, color: 'var(--text-primary)' }}>{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={i} style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px', background: 'var(--bg-tertiary)', margin: '16px 0', color: 'var(--text-secondary)' }}>
          {trimmed.slice(2)}
        </blockquote>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={i} style={{ marginBottom: 16 }}>{trimmed}</p>);
    }
  });
  flushList();

  return <>{elements}</>;
}

// ============================================================
