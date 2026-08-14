// FeaturesListScreen — список фич-реквестов
// Тикет №55 — Features: фич-реквесты (узел 04)
// Макет: mockups/features-balloo-su/list.html

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureStatusBadge } from './FeatureStatusBadge';
import { FeatureVoteButton } from './FeatureVoteButton';
import { api } from '@/services/api';

interface Feature {
  id: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  status: string;
  createdAt: number;
  author: { id: string; username: string; displayName: string; avatarUrl?: string };
  _count: { votes: number; comments: number };
}

const STATUS_SIDEBAR = [
  { key: 'all', label: '📋 Все фичи', count: null },
  { key: 'done', label: '✅ Готово', count: null },
  { key: 'in_progress', label: '🔄 В работе', count: null },
  { key: 'planned', label: '📌 Запланировано', count: null },
  { key: 'idea', label: '💡 Идеи', count: null },
];

const SORT_OPTIONS = [
  { key: 'votes', label: '🏆 Топ голосов' },
  { key: 'comments', label: '🔥 Обсуждаемые' },
  { key: 'date', label: '⏱ Свежие' },
];

const CATEGORY_TABS = [
  { key: '', label: 'Все' },
  { key: 'messenger', label: 'Мессенджер' },
  { key: 'calls', label: 'Звонки' },
  { key: 'groups', label: 'Группы' },
  { key: 'uiux', label: 'UI/UX' },
  { key: 'bots', label: 'Боты' },
  { key: 'files', label: 'Файлы и медиа' },
  { key: 'privacy', label: 'Приватность' },
  { key: 'integrations', label: 'Интеграции' },
  { key: 'other', label: 'Другое' },
];

export function FeaturesListScreen() {
  const navigate = useNavigate();

  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'date' | 'comments'>('votes');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Загрузка данных
  const loadFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy,
        ...(activeStatus !== 'all' && { status: activeStatus }),
        ...(activeCategory && { category: activeCategory }),
        ...(searchQuery && { search: searchQuery }),
      });

      const [featuresRes, statsRes] = await Promise.all([
        api.get(`/api/features?${params}`),
        api.get('/api/features/stats'),
      ]);

      setFeatures((featuresRes as any).items);
      setTotalPages((featuresRes as any).totalPages);
      setStats(statsRes as any);
    } catch (error) {
      console.error('Ошибка загрузки фич:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, activeStatus, activeCategory, searchQuery]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  // Обновление счётчиков в сайдбаре
  const sidebarCounts: Record<string, number> = {};
  if (stats?.byStatus) {
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      sidebarCounts[status] = count as number;
    });
  }

  // Поиск
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadFeatures();
  };

  // Статистика
  const totalFeatures = stats?.total || 0;
  const totalVotes = stats?.totalVotes || 0;
  const doneCount = sidebarCounts['done'] || 0;
  const inProgressCount = sidebarCounts['in_progress'] || 0;

  // Форматирование времени
  function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
      { label: 'год', seconds: 31536000 },
      { label: 'месяц', seconds: 2592000 },
      { label: 'неделя', seconds: 604800 },
      { label: 'день', seconds: 86400 },
      { label: 'час', seconds: 3600 },
      { label: 'минуту', seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label} назад`;
      }
    }
    return 'только что';
  }

  return (
    <div className="main">
      {/* Sidebar */}
      <div className="sidebar sidebar--narrow">
        <div className="sidebar__search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Поиск фич..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        <div className="list">
          {STATUS_SIDEBAR.map((item) => (
            <div
              key={item.key}
              className={`list__item ${activeStatus === item.key ? 'list__item--active' : ''}`}
              onClick={() => { setActiveStatus(item.key); setPage(1); }}
              style={{ cursor: 'pointer' }}
            >
              {item.label}
              {item.key !== 'all' && (
                <span className="badge" style={{ marginLeft: 'auto' }}>
                  {sidebarCounts[item.key] || 0}
                </span>
              )}
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '12px' }}>
            {SORT_OPTIONS.map((sort) => (
              <div
                key={sort.key}
                className={`list__item ${sortBy === sort.key ? 'list__item--active' : ''}`}
                onClick={() => setSortBy(sort.key as any)}
                style={{ cursor: 'pointer' }}
              >
                {sort.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content overflow-y-auto">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title" style={{ marginBottom: 4 }}>Фич-реквесты</h1>
              <p className="page-subtitle">Голосуйте за идеи и предлагайте новые функции для Balloo</p>
            </div>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/features/create')}
            >
              ✏ Предложить
            </button>
          </div>

          {/* Category tabs */}
          <div className="tabs mb-6" style={{ flexWrap: 'wrap' }}>
            {CATEGORY_TABS.map((tab) => (
              <div
                key={tab.key}
                className={`tab ${activeCategory === tab.key ? 'tab--active' : ''}`}
                onClick={() => { setActiveCategory(tab.key); setPage(1); }}
                style={{ cursor: 'pointer' }}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* Stats cards */}
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: 140 }}>
              <div className="text-xs text-muted">Всего фич</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                {totalFeatures}
              </div>
            </div>
            <div className="card flex-1" style={{ minWidth: 140 }}>
              <div className="text-xs text-muted">Готово</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                {doneCount}
              </div>
            </div>
            <div className="card flex-1" style={{ minWidth: 140 }}>
              <div className="text-xs text-muted">В работе</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)' }}>
                {inProgressCount}
              </div>
            </div>
            <div className="card flex-1" style={{ minWidth: 140 }}>
              <div className="text-xs text-muted">Голосов всего</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>
                {totalVotes.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Features list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : features.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-muted">Фич-реквестов пока нет. Будьте первым! 💡</p>
            </div>
          ) : (
            features.map((feature) => (
              <div
                key={feature.id}
                className="card mb-4 card--hover"
                onClick={() => navigate(`/features/${feature.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-4">
                  <FeatureVoteButton
                    featureId={feature.id}
                    initialVoteCount={feature._count.votes}
                    hasVoted={false}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FeatureStatusBadge status={feature.status} />
                      <span className="chip">{feature.category}</span>
                      {feature.priority && (
                        <span className="chip" style={{ fontSize: '9px' }}>
                          Приоритет: {feature.priority}
                        </span>
                      )}
                    </div>
                    <div className="card__title">{feature.title}</div>
                    <div className="card__body">
                      {feature.description.length > 120
                        ? feature.description.slice(0, 120) + '...'
                        : feature.description}
                    </div>
                    <div className="text-xs text-muted mt-2">
                      {feature._count.comments} комментариев · обновлено {timeAgo(feature.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                className="btn btn--secondary btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </button>
              <span className="flex items-center text-sm text-muted">
                Страница {page} из {totalPages}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-6">
            <button
              className="btn btn--secondary btn--lg"
              onClick={() => navigate('/features/create')}
            >
              💡 Предложить новую фичу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
