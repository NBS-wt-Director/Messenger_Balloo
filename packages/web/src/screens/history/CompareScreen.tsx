// CompareScreen — сравнение двух версий (side-by-side diff)
// Тикет №56 — History: changelog (узел 05)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';

interface VersionSummary {
  id: string;
  version: string;
  publishedAt: number;
  title: string;
}

interface CompareResult {
  v1: VersionSummary;
  v2: VersionSummary;
  diff: Record<string, { added: string[]; removed: string[] }>;
}

interface VersionOption {
  id: string;
  version: string;
}

const SECTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  new: { label: 'Новое', icon: '✨', color: 'var(--accent)' },
  improved: { label: 'Улучшения', icon: '🔧', color: 'var(--info)' },
  fixed: { label: 'Исправлено', icon: '🐛', color: 'var(--warning)' },
  security: { label: 'Безопасность', icon: '🔒', color: 'var(--accent)' },
  known_issues: { label: 'Известные проблемы', icon: '⚠️', color: 'var(--danger, #e53935)' },
};

export function CompareScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [allVersions, setAllVersions] = useState<VersionOption[]>([]);
  const [v1, setV1] = useState(searchParams.get('v1') || '');
  const [v2, setV2] = useState(searchParams.get('v2') || '');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка списка всех версий для селекторов
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getHistoryVersions();
        setAllVersions((res.items || []).map((v: any) => ({ id: v.id, version: v.version })));
      } catch (err) {
        console.error('Ошибка загрузки версий:', err);
      }
    })();
  }, []);

  // Сравнение
  const runCompare = useCallback(async () => {
    if (!v1 || !v2) {
      setError('Выберите обе версии для сравнения');
      return;
    }
    if (v1 === v2) {
      setError('Выберите разные версии');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.compareHistoryVersions(v1, v2);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Ошибка сравнения');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [v1, v2]);

  // Авто-сравнение если параметры в URL
  useEffect(() => {
    if (v1 && v2 && allVersions.length > 0) {
      runCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVersions.length]);

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          {/* Навигация */}
          <div className="flex justify-between mb-6">
            <button className="btn btn--tertiary btn--sm" onClick={() => navigate('/history')}>
              ← Все версии
            </button>
          </div>

          <h1 className="page-title">🔍 Сравнение версий</h1>
          <p className="page-subtitle mb-6">Выберите две версии, чтобы увидеть различия в changelog</p>

          {/* Селекторы версий */}
          <div className="card mb-6">
            <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
              <div className="flex-1" style={{ minWidth: '200px' }}>
                <label className="text-xs text-muted block mb-2">Версия 1 (старая)</label>
                <select
                  className="search-input"
                  style={{ width: '100%' }}
                  value={v1}
                  onChange={(e) => setV1(e.target.value)}
                >
                  <option value="">— выберите —</option>
                  {allVersions.map((v) => (
                    <option key={v.id} value={v.version}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '24px', color: 'var(--text-muted)', alignSelf: 'flex-end', paddingBottom: '8px' }}>
                ⇄
              </div>

              <div className="flex-1" style={{ minWidth: '200px' }}>
                <label className="text-xs text-muted block mb-2">Версия 2 (новая)</label>
                <select
                  className="search-input"
                  style={{ width: '100%' }}
                  value={v2}
                  onChange={(e) => setV2(e.target.value)}
                >
                  <option value="">— выберите —</option>
                  {allVersions.map((v) => (
                    <option key={v.id} value={v.version}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn--primary"
                style={{ alignSelf: 'flex-end' }}
                onClick={runCompare}
                disabled={loading || !v1 || !v2}
              >
                {loading ? 'Сравнение...' : 'Сравнить'}
              </button>
            </div>

            {error && (
              <div className="mt-4" style={{ color: 'var(--danger, #e53935)', fontSize: '14px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Результат сравнения */}
          {result && (
            <>
              {/* Заголовки версий */}
              <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
                <div className="card flex-1" style={{ minWidth: '200px' }}>
                  <div className="text-xs text-muted">Версия 1</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    <span className="chip chip--info">{result.v1.version}</span>
                  </div>
                  <div className="text-sm mt-2">{result.v1.title}</div>
                  <div className="text-xs text-muted mt-1">
                    {result.v1.publishedAt > 0
                      ? new Date(result.v1.publishedAt * 1000).toLocaleDateString('ru-RU')
                      : 'В планах'}
                  </div>
                </div>
                <div className="card flex-1" style={{ minWidth: '200px' }}>
                  <div className="text-xs text-muted">Версия 2</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    <span className="chip chip--accent">{result.v2.version}</span>
                  </div>
                  <div className="text-sm mt-2">{result.v2.title}</div>
                  <div className="text-xs text-muted mt-1">
                    {result.v2.publishedAt > 0
                      ? new Date(result.v2.publishedAt * 1000).toLocaleDateString('ru-RU')
                      : 'В планах'}
                  </div>
                </div>
              </div>

              {/* Diff по секциям */}
              {Object.keys(result.diff).length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Различий между версиями не найдено</p>
                </div>
              ) : (
                Object.entries(result.diff).map(([sectionKey, sectionDiff]) => {
                  const config = SECTION_LABELS[sectionKey] || {
                    label: sectionKey,
                    icon: '📝',
                    color: 'var(--text-primary)',
                  };

                  return (
                    <div className="card mb-6" key={sectionKey}>
                      <h3 className="card__title mb-4">
                        {config.icon} {config.label}
                      </h3>

                      {/* Добавленные (в новой версии) */}
                      {sectionDiff.added.length > 0 && (
                        <div className="mb-4">
                          <div
                            className="text-xs font-semibold mb-2"
                            style={{ color: 'var(--accent)' }}
                          >
                            ➕ Добавлено в {result.v2.version}
                          </div>
                          <ul style={{ listStyle: 'none', paddingLeft: '20px', lineHeight: '1.8' }}>
                            {sectionDiff.added.map((item, idx) => (
                              <li key={`add-${idx}`} style={{ color: 'var(--accent)' }}>
                                <span style={{ marginRight: '8px' }}>+</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Удалённые (были в старой, нет в новой) */}
                      {sectionDiff.removed.length > 0 && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-2"
                            style={{ color: 'var(--danger, #e53935)' }}
                          >
                            ➖ Удалено из {result.v2.version}
                          </div>
                          <ul style={{ listStyle: 'none', paddingLeft: '20px', lineHeight: '1.8' }}>
                            {sectionDiff.removed.map((item, idx) => (
                              <li
                                key={`rem-${idx}`}
                                style={{ color: 'var(--danger, #e53935)', textDecoration: 'line-through', opacity: 0.7 }}
                              >
                                <span style={{ marginRight: '8px' }}>−</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {sectionDiff.added.length === 0 && sectionDiff.removed.length === 0 && (
                        <p className="text-muted text-sm">Изменений нет</p>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {!result && !loading && !error && (
            <div className="card text-center py-8">
              <p className="text-muted">
                Выберите две версии выше и нажмите «Сравнить», чтобы увидеть различия
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
