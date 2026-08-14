// VersionDetailScreen — детальная страница версии с changelog
// Тикет №56 — History: changelog (узел 05)
// Макет: mockups/history-balloo-su/version-detail.html

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface ChangelogSection {
  new?: string[];
  improved?: string[];
  fixed?: string[];
  security?: string[];
  known_issues?: string[];
}

interface ChangelogData {
  title: string;
  icon: string;
  type: string;
  status: string;
  summary: string;
  expectedAt?: string;
  sections: ChangelogSection;
  stats?: Record<string, number>;
}

interface VersionDetail {
  id: string;
  version: string;
  publishedAt: number;
  isLatest: boolean;
  createdAt: number;
  changelog: ChangelogData;
}

interface Neighbors {
  prev: { id: string; version: string } | null;
  next: { id: string; version: string } | null;
}

const SECTION_CONFIG: { key: keyof ChangelogSection; title: string; icon: string }[] = [
  { key: 'new', title: 'Новое', icon: '✨' },
  { key: 'improved', title: 'Улучшения', icon: '🔧' },
  { key: 'fixed', title: 'Исправлено', icon: '🐛' },
  { key: 'security', title: 'Безопасность', icon: '🔒' },
  { key: 'known_issues', title: 'Известные проблемы', icon: '⚠️' },
];

const STATS_LABELS: Record<string, { label: string; color: string }> = {
  screens: { label: 'Экранов', color: 'var(--accent)' },
  nodes: { label: 'Узлов', color: 'var(--info)' },
  platforms: { label: 'Платформ', color: 'var(--warning)' },
  languages: { label: 'Языков', color: 'var(--accent)' },
};

export function VersionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [version, setVersion] = useState<VersionDetail | null>(null);
  const [neighbors, setNeighbors] = useState<Neighbors | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [versionRes, neighborsRes] = await Promise.all([
        api.getHistoryVersion(id),
        api.getHistoryVersionNeighbors(id),
      ]);
      setVersion(versionRes);
      setNeighbors(neighborsRes);
    } catch (error) {
      console.error('Ошибка загрузки версии:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">
            <div className="card text-center py-8">
              <p className="text-muted">Версия не найдена</p>
              <button className="btn btn--secondary btn--sm mt-4" onClick={() => navigate('/history')}>
                ← К списку версий
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ch = version.changelog;
  const isPlanned = ch.status === 'planned';

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          {/* Навигация */}
          <div className="flex justify-between mb-6">
            <button className="btn btn--tertiary btn--sm" onClick={() => navigate('/history')}>
              ← Все версии
            </button>
            <div className="flex gap-2">
              {neighbors?.prev && (
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate(`/history/version/${neighbors.prev!.id}`)}
                >
                  ← {neighbors.prev.version}
                </button>
              )}
              {neighbors?.next && (
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate(`/history/version/${neighbors.next!.id}`)}
                >
                  {neighbors.next.version} →
                </button>
              )}
            </div>
          </div>

          {/* Заголовок версии */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="chip chip--accent" style={{ fontSize: '16px', padding: '6px 14px' }}>
                  {version.version}
                </span>
                <span className="chip">
                  {ch.type === 'major' ? 'Мажорная' : ch.type === 'minor' ? 'Минорная' : 'Патч'}
                </span>
                {isPlanned ? (
                  <span
                    className="chip"
                    style={{ background: 'rgba(232,163,23,0.12)', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                  >
                    📋 В планах
                  </span>
                ) : (
                  <span className="chip chip--accent">Релиз</span>
                )}
              </div>
              <span className="text-sm text-muted">
                {version.publishedAt > 0
                  ? new Date(version.publishedAt * 1000).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ch.expectedAt
                    ? `Ожидается: ${ch.expectedAt}`
                    : ''}
              </span>
            </div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>
              {ch.icon} {ch.title}
            </h1>
            {ch.summary && <p className="page-subtitle" style={{ marginBottom: 0 }}>{ch.summary}</p>}
          </div>

          {/* Секции changelog */}
          {SECTION_CONFIG.map(({ key, title, icon }) => {
            const items = ch.sections[key];
            if (!items || items.length === 0) return null;

            return (
              <div className="card mb-6" key={key}>
                <h3 className="card__title mb-4">
                  {icon} {title}
                </h3>
                <div className="card__body">
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.8' }}>
                    {items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Статистика релиза */}
          {ch.stats && Object.keys(ch.stats).length > 0 && (
            <div className="card mb-6">
              <h3 className="card__title mb-4">📊 Статистика релиза</h3>
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                {Object.entries(ch.stats).map(([key, value]) => {
                  const config = STATS_LABELS[key] || { label: key, color: 'var(--accent)' };
                  return (
                    <div className="card flex-1" key={key} style={{ minWidth: '120px' }}>
                      <div className="text-xs text-muted">{config.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: config.color }}>
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Сравнение версий */}
          <div className="card mb-6 text-center">
            <h3 className="card__title mb-4">🔍 Сравнить версии</h3>
            <button
              className="btn btn--secondary"
              onClick={() => navigate('/history/compare')}
            >
              Открыть сравнение версий
            </button>
          </div>

          {/* Скачать */}
          {!isPlanned && (
            <div className="card text-center mb-6">
              <button
                className="btn btn--primary btn--lg"
                onClick={() => navigate('/download')}
              >
                ⬇️ Скачать {version.version}
              </button>
            </div>
          )}

          {/* Навигация снизу */}
          <div className="flex justify-between">
            {neighbors?.prev ? (
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => navigate(`/history/version/${neighbors.prev!.id}`)}
              >
                ← Предыдущая: {neighbors.prev.version}
              </button>
            ) : (
              <span />
            )}
            {neighbors?.next ? (
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => navigate(`/history/version/${neighbors.next!.id}`)}
              >
                Следующая: {neighbors.next.version} →
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
