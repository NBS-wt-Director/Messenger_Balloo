// FeatureDetailScreen — детальная страница фич-реквеста
// Тикет №55 — Features: фич-реквесты (узел 04)
// Макет: mockups/features-balloo-su/feature-detail.html

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeatureVoteButton } from './FeatureVoteButton';
import { FeatureStatusBadge } from './FeatureStatusBadge';
import { api } from '@/services/api';

interface Comment {
  id: string;
  content: string;
  createdAt: number;
  author: { id: string; username: string; displayName: string; avatarUrl?: string };
  _count: { replies: number };
}

interface Feature {
  id: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  motivation?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  author: { id: string; username: string; displayName: string; avatarUrl?: string };
  voteCount: number;
  commentCount: number;
  comments: Comment[];
}

export function FeatureDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadFeature = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/features/${id}`);
      setFeature(res as any);
    } catch (error) {
      console.error('Ошибка загрузки фичи:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFeature();
  }, [loadFeature]);

  const handleComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await api.post(`/api/features/${id}/comments`, {
        content: commentText.trim(),
      });
      setCommentText('');
      loadFeature();
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, id, submittingComment, loadFeature]);

  if (loading) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">
            <div className="card text-center py-8">
              <h2>Фича не найдена</h2>
              <button className="btn btn--primary mt-4" onClick={() => navigate('/features')}>
                ← Назад к списку
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals: { label: string; seconds: number }[] = [
      { label: 'год', seconds: 31536000 },
      { label: 'месяц', seconds: 2592000 },
      { label: 'неделя', seconds: 604800 },
      { label: 'день', seconds: 86400 },
      { label: 'час', seconds: 3600 },
      { label: 'минуту', seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) return `${count} ${interval.label} назад`;
    }
    return 'только что';
  }

  const isAuthor = false; // TODO: check auth user === feature.author.id

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          <a
            href="#/features"
            className="text-sm text-secondary mb-4"
            style={{ display: 'inline-block' }}
          >
            ← Назад к списку
          </a>

          {/* Main card */}
          <div className="card mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FeatureVoteButton
                featureId={feature.id}
                initialVoteCount={feature.voteCount}
                hasVoted={false}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FeatureStatusBadge status={feature.status} size="md" />
                  <span className="chip">{feature.category}</span>
                  {feature.priority && (
                    <span className="chip" style={{ fontSize: '10px' }}>
                      Приоритет: {feature.priority}
                    </span>
                  )}
                </div>
                <h1 className="page-title" style={{ marginBottom: 4 }}>{feature.title}</h1>
                <div className="text-sm text-muted">
                  Предложил <strong>{feature.author.displayName || feature.author.username}</strong> ·{' '}
                  {new Date(feature.createdAt * 1000).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Description */}
            <div className="section-title" style={{ marginTop: 16 }}>Описание</div>
            <p className="card__body" style={{ fontSize: 15, lineHeight: 1.7 }}>
              {feature.description}
            </p>

            {/* Motivation */}
            {feature.motivation && (
              <>
                <div className="section-title">Мотивация</div>
                <p className="card__body" style={{ fontSize: 15, lineHeight: 1.7 }}>
                  {feature.motivation}
                </p>
              </>
            )}

            {/* Planned implementation placeholder */}
            {feature.status === 'in_progress' && (
              <>
                <div className="section-title">Планируемая реализация</div>
                <div className="card__body" style={{ fontSize: 14 }}>
                  <ul style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Определение командой разработки</li>
                    <li>Детали будут добавлены позже</li>
                  </ul>
                </div>
              </>
            )}

            {/* Meta info */}
            <div className="flex gap-4 mt-6" style={{ flexWrap: 'wrap' }}>
              <div className="meta-item">
                <span className="meta-item__label">Статус</span>
                <FeatureStatusBadge status={feature.status} size="md" />
              </div>
              <div className="meta-item">
                <span className="meta-item__label">Автор</span>
                <span className="meta-item__value">
                  {feature.author.displayName || feature.author.username}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-item__label">Дата</span>
                <span className="meta-item__value">
                  {new Date(feature.createdAt * 1000).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="card mb-6">
            <h3 className="card__title mb-4">
              Комментарии ({feature.commentCount || feature.comments.length})
            </h3>

            {/* Comments list */}
            {feature.comments.length === 0 ? (
              <p className="text-muted text-center py-4">Комментариев пока нет. Будьте первым!</p>
            ) : (
              feature.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="list__item"
                  style={{ border: 'none', alignItems: 'flex-start' }}
                >
                  <div className="avatar avatar--sm avatar--bordered" style={{ flexShrink: 0 }}>
                    <div className="avatar__inner">
                      <span>
                        {(comment.author.displayName || comment.author.username)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong>{comment.author.displayName || comment.author.username}</strong>
                      {(comment.author.id === feature.author.id) && (
                        <span className="chip chip--accent" style={{ fontSize: 10 }}>автор</span>
                      )}
                      <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.5 }}
                    >
                      {comment.content}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="btn btn--tertiary btn--sm">▲ {comment._count.replies || 0}</button>
                      <button className="btn btn--tertiary btn--sm">Ответить</button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Comment input */}
            <div className="divider" />
            <form onSubmit={handleComment} className="input-area" style={{ border: 'none', padding: 0 }}>
              <textarea
                className="input-area__field"
                placeholder="Написать комментарий..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
