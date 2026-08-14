// DocsScreen — интерактивная API документация (api.balloo.su/doc)
// Тикет №58 — Docs: API документация
// Макет: mockups/docs-balloo-su/api-docs.html

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { EndpointCard, type EndpointData } from './components/EndpointCard';
import { WebSocketSection } from './components/WebSocketSection';
import { CodeBlock } from './components/CodeBlock';

// ============================================================
// Types
// ============================================================
interface ApiModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  endpointCount: number;
  endpoints: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    auth: boolean;
  }[];
}

interface EndpointDetail extends EndpointData {
  module: { id: string; name: string; icon: string };
}

interface QuickStartItem {
  title: string;
  description: string;
  code: string;
}

interface ErrorCode {
  code: number;
  name: string;
  description: string;
}

// ============================================================
// Sidebar view modes
// ============================================================
type ViewMode = 'overview' | 'module' | 'endpoint' | 'websocket' | 'quickstart' | 'errors';

// ============================================================
// Component
// ============================================================
export function DocsScreen() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [endpointDetail, setEndpointDetail] = useState<EndpointDetail | null>(null);
  const [quickStart, setQuickStart] = useState<QuickStartItem[]>([]);
  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // --- Load endpoints list ---
  useEffect(() => {
    api
      .getDocsEndpoints()
      .then((data) => {
        setModules(data.modules || []);
      })
      .catch((err) => console.error('Ошибка загрузки endpoints:', err))
      .finally(() => setLoading(false));
  }, []);

  // --- Load quick start + error codes on mount ---
  useEffect(() => {
    api.getDocsQuickStart().then(setQuickStart).catch(() => {});
    api.getDocsErrors().then(setErrorCodes).catch(() => {});
  }, []);

  // --- Load endpoint detail ---
  const loadEndpoint = useCallback(async (method: string, path: string) => {
    try {
      const detail = await api.getDocsEndpointDetail(`${method} ${path}`);
      setEndpointDetail(detail);
      setViewMode('endpoint');
    } catch (err) {
      console.error('Ошибка загрузки endpoint detail:', err);
    }
  }, []);

  // --- Filtered modules by search ---
  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.toLowerCase();
    return modules
      .map((mod) => ({
        ...mod,
        endpoints: mod.endpoints.filter(
          (ep) =>
            ep.path.toLowerCase().includes(q) ||
            ep.description.toLowerCase().includes(q) ||
            ep.method.toLowerCase().includes(q) ||
            mod.name.toLowerCase().includes(q)
        ),
      }))
      .filter((mod) => mod.endpoints.length > 0);
  }, [modules, search]);

  // --- Active module ---
  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeModuleId) || null,
    [modules, activeModuleId]
  );

  // --- Total endpoints count ---
  const totalEndpoints = useMemo(
    () => modules.reduce((sum, m) => sum + m.endpointCount, 0),
    [modules]
  );

  // ============================================================
  // Render: Sidebar
  // ============================================================
  function renderSidebar() {
    return (
      <div className="sidebar sidebar--narrow">
        {/* Search */}
        <div className="sidebar__search">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Поиск endpoint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="list">
          {/* Overview */}
          <div
            className={`list__item ${viewMode === 'overview' ? 'list__item--active' : ''}`}
            style={{ fontWeight: 700, cursor: 'pointer' }}
            onClick={() => {
              setViewMode('overview');
              setActiveModuleId(null);
            }}
          >
            📖 Обзор
          </div>

          {/* Quick start */}
          <div
            className={`list__item ${viewMode === 'quickstart' ? 'list__item--active' : ''}`}
            style={{ fontWeight: 700, cursor: 'pointer' }}
            onClick={() => {
              setViewMode('quickstart');
              setActiveModuleId(null);
            }}
          >
            ⚡ Быстрый старт
          </div>

          {/* Modules */}
          {filteredModules.map((mod) => (
            <div key={mod.id}>
              <div
                className={`list__item ${activeModuleId === mod.id && viewMode === 'module' ? 'list__item--active' : ''}`}
                style={{ fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
                onClick={() => {
                  setActiveModuleId(mod.id);
                  setViewMode('module');
                }}
              >
                {mod.icon} {mod.name} ({mod.endpointCount})
              </div>
              {mod.endpoints.map((ep, i) => (
                <div
                  key={i}
                  className="list__item"
                  style={{ paddingLeft: '32px', cursor: 'pointer', fontSize: '12px' }}
                  onClick={() => loadEndpoint(ep.method, ep.path)}
                >
                  <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{ep.method}</span>
                  {ep.path}
                </div>
              ))}
            </div>
          ))}

          {/* WebSocket */}
          <div
            className={`list__item ${viewMode === 'websocket' ? 'list__item--active' : ''}`}
            style={{ fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
            onClick={() => {
              setViewMode('websocket');
              setActiveModuleId(null);
            }}
          >
            🔌 WebSocket
          </div>

          {/* Error codes */}
          <div
            className={`list__item ${viewMode === 'errors' ? 'list__item--active' : ''}`}
            style={{ fontWeight: 700, cursor: 'pointer' }}
            onClick={() => {
              setViewMode('errors');
              setActiveModuleId(null);
            }}
          >
            ⚠️ Коды ошибок
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Overview
  // ============================================================
  function renderOverview() {
    return (
      <div className="page-container">
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 className="page-title">📖 API Documentation</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="chip chip--accent">OpenAPI 3.0</span>
            <span className="chip chip--info">v1.0.0</span>
          </div>
        </div>

        {/* Base URL */}
        <div className="card mb-6">
          <h3 className="card__title">Базовый URL</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <code
              style={{
                background: 'var(--bg-tertiary)',
                padding: '4px 12px',
                fontFamily: "'Fira Code', monospace",
                color: 'var(--accent)',
                fontSize: '14px',
              }}
            >
              https://api.balloo.su/v1
            </code>
            <span className="chip chip--accent">Production</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <code
              style={{
                background: 'var(--bg-tertiary)',
                padding: '4px 12px',
                fontFamily: "'Fira Code', monospace",
                color: 'var(--warning)',
                fontSize: '14px',
              }}
            >
              wss://balloo.su/ws
            </code>
            <span className="chip chip--info">WebSocket</span>
          </div>
        </div>

        {/* Авторизация */}
        <div className="section-title">🔐 Авторизация</div>
        <div className="card mb-6">
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
            Большинство эндпоинтов требуют JWT-авторизацию. Получите access token через <code style={{ color: 'var(--accent)' }}>POST /auth/login</code> или <code style={{ color: 'var(--accent)' }}>POST /auth/register</code>.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
            Передавайте токен в заголовке:
          </p>
          <CodeBlock code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`} language="bash" label="Header" />
        </div>

        {/* Статистика */}
        <div className="section-title">📊 Статистика API</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{totalEndpoints}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Всего эндпоинтов</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info)' }}>{modules.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Модулей API</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning)' }}>35+</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>WebSocket events</div>
          </div>
        </div>

        {/* Модули */}
        <div className="section-title">📦 Модули API</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="card"
              style={{ cursor: 'pointer', padding: '16px' }}
              onClick={() => {
                setActiveModuleId(mod.id);
                setViewMode('module');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{mod.icon}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{mod.name}</span>
                <span className="chip chip--info" style={{ marginLeft: 'auto', fontSize: '11px' }}>
                  {mod.endpointCount}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{mod.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Module (list of endpoints)
  // ============================================================
  function renderModule() {
    if (!activeModule) return null;

    // Find full endpoint details from filteredModules
    const moduleData = filteredModules.find((m) => m.id === activeModule.id);
    if (!moduleData) return null;

    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ fontSize: '24px' }}>{activeModule.icon}</span>
          <h1 className="page-title" style={{ margin: 0 }}>{activeModule.name}</h1>
          <span className="chip chip--info">{activeModule.endpointCount} endpoints</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>{activeModule.description}</p>

        {moduleData.endpoints.map((ep, i) => (
          <EndpointCard
            key={i}
            endpoint={{
              method: ep.method,
              path: ep.path,
              description: ep.description,
              auth: ep.auth,
            }}
          />
        ))}
      </div>
    );
  }

  // ============================================================
  // Render: Endpoint detail
  // ============================================================
  function renderEndpointDetail() {
    if (!endpointDetail) return null;

    return (
      <div className="page-container">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
          <span
            style={{ color: 'var(--accent)', cursor: 'pointer' }}
            onClick={() => {
              setActiveModuleId(endpointDetail.module.id);
              setViewMode('module');
            }}
          >
            {endpointDetail.module.icon} {endpointDetail.module.name}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{endpointDetail.method} {endpointDetail.path}</span>
        </div>

        <EndpointCard endpoint={endpointDetail} />
      </div>
    );
  }

  // ============================================================
  // Render: Quick start
  // ============================================================
  function renderQuickStart() {
    return (
      <div className="page-container">
        <h1 className="page-title">⚡ Быстрый старт</h1>
        <p className="page-subtitle">Примеры интеграции с API Balloo Messenger</p>

        {quickStart.map((item, i) => (
          <div className="card mb-4" key={i}>
            <h3 className="card__title">{item.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
              {item.description}
            </p>
            <CodeBlock code={item.code} language="bash" />
          </div>
        ))}

        {/* SDK */}
        <div className="section-title">📦 SDK и библиотеки</div>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
            Используйте официальные SDK для интеграции:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span className="chip chip--accent">@balloo/shared — TypeScript типы и утилиты</span>
            <span className="chip chip--info">@balloo/web — React компоненты</span>
            <span className="chip chip--info">@balloo/server — Express middleware</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Error codes
  // ============================================================
  function renderErrors() {
    return (
      <div className="page-container">
        <h1 className="page-title">⚠️ Коды ошибок</h1>
        <p className="page-subtitle">HTTP коды ответов, возвращаемые API</p>

        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Код</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Название</th>
                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Описание</th>
              </tr>
            </thead>
            <tbody>
              {errorCodes.map((err, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                  <td style={{ padding: '12px', fontFamily: "'Fira Code', monospace", fontWeight: 700, color: err.code >= 500 ? 'var(--danger)' : err.code >= 400 ? 'var(--warning)' : 'var(--accent)' }}>
                    {err.code}
                  </td>
                  <td style={{ padding: '12px', fontFamily: "'Fira Code', monospace", color: 'var(--text-secondary)' }}>
                    {err.name}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{err.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Content area
  // ============================================================
  function renderContent() {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div className="spinner" />
        </div>
      );
    }

    switch (viewMode) {
      case 'overview':
        return renderOverview();
      case 'module':
        return renderModule();
      case 'endpoint':
        return renderEndpointDetail();
      case 'websocket':
        return (
          <div className="page-container">
            <h1 className="page-title">🔌 WebSocket API</h1>
            <p className="page-subtitle">Realtime события через WebSocket</p>
            <WebSocketSection />
          </div>
        );
      case 'quickstart':
        return renderQuickStart();
      case 'errors':
        return renderErrors();
      default:
        return renderOverview();
    }
  }

  // ============================================================
  // Main render
  // ============================================================
  return (
    <div className="main">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar__logo">
          <div className="topbar__logo-icon" style={{ background: 'var(--info)' }}>D</div>
          <span>API Docs</span>
        </div>
        <div className="topbar__title">API Documentation</div>
        <div className="topbar__right">
          <span className="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
          <span className="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
        </div>
      </div>

      {/* Sidebar + Content */}
      {renderSidebar()}
      <div className="content overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
