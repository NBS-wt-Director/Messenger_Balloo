// App.tsx — history.balloo.su: история версий Balloo.
//
// Тик. 1795683301 (U1/U2/U3): единая шапка/подвал из @balloo/ui, прокрутка
// внутри контейнера, горизонтальные отступы. Узел больше не заглушка.
//
// Данные — `GET /api/history/versions` (реальный ответ:
// `{ items: [...], total, page, limit, totalPages }`).
// U6: показываем опубликованные версии; черновики и запланированные не выводим.

import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import { StandaloneChrome } from '@balloo/ui';

const API_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3100';

interface VersionItem {
  id: string;
  version: string;
  publishedAt: number | string;
  isLatest: boolean;
  title?: string;
  icon?: string;
  status?: string;
  summary?: string;
  expectedAt?: string;
}

/** Секунды → «ДД.ММ.ГГГГ». 0 — версия ещё не выпущена. */
function formatDate(publishedAt: number | string | undefined): string {
  const n = Number(publishedAt ?? 0);
  if (!n) return 'не выпущена';
  return new Date(n * 1000).toLocaleDateString('ru-RU');
}

async function loadVersions(): Promise<VersionItem[]> {
  const res = await fetch(`${API_BASE}/api/history/versions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { items?: VersionItem[] } | VersionItem[];
  const list = Array.isArray(data) ? data : data.items ?? [];
  // U6: только выпущенные версии (publishedAt > 0)
  return list.filter((v) => Number(v.publishedAt) > 0);
}

function HistoryList() {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadVersions()
      .then((list) => {
        if (!cancelled) setVersions(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">История версий Balloo</h1>
      <p className="page-subtitle">Что изменилось в каждой версии мессенджера</p>

      {loading && <p className="muted">Загрузка версий…</p>}

      {!loading && error && (
        <div className="empty-state">
          <p style={{ margin: '0 0 8px' }}>Не удалось загрузить список версий.</p>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Проверьте соединение и обновите страницу — данные не потеряны.
          </p>
        </div>
      )}

      {!loading && !error && versions.length === 0 && (
        <div className="empty-state">
          <p style={{ margin: '0 0 8px' }}>Опубликованных версий пока нет.</p>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Как только выйдет обновление, оно появится здесь.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {versions.map((v) => (
          <Link
            key={v.id}
            to={`/version/${v.id}`}
            style={{
              display: 'block',
              padding: 16,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong>
                {v.icon ? `${v.icon} ` : ''}
                {v.version}
                {v.isLatest && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    текущая
                  </span>
                )}
              </strong>
              <span className="muted" style={{ fontSize: 13 }}>
                {formatDate(v.publishedAt)}
              </span>
            </div>
            {v.title && (
              <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 14 }}>{v.title}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function VersionDetail() {
  const { id = '' } = useParams();
  const [version, setVersion] = useState<VersionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadVersions()
      .then((list) => {
        if (!cancelled) setVersion(list.find((v) => v.id === id || v.version === id) ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="page-container page-container--narrow">
      <Link to="/" style={{ fontSize: 14 }}>
        ← Все версии
      </Link>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>
          Загрузка…
        </p>
      ) : !version ? (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <p style={{ margin: 0 }}>Версия не найдена — возможно, ссылка устарела.</p>
        </div>
      ) : (
        <>
          <h1 className="page-title" style={{ marginTop: 12 }}>
            {version.icon ? `${version.icon} ` : ''}
            {version.version}
          </h1>
          <p className="page-subtitle">{version.title ?? ''}</p>
          <p className="muted" style={{ fontSize: 13, marginTop: -16 }}>
            Выпущена: {formatDate(version.publishedAt)}
          </p>
          {version.summary && (
            <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{version.summary}</p>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <StandaloneChrome title="История версий">
        <Routes>
          <Route path="/" element={<HistoryList />} />
          <Route path="/version/:id" element={<VersionDetail />} />
          <Route path="/:id" element={<VersionDetail />} />
        </Routes>
      </StandaloneChrome>
    </HashRouter>
  );
}
