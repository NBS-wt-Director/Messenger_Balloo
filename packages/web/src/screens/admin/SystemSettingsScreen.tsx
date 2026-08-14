// SystemSettingsScreen — общие настройки системы
// Maintenance mode, ENV-переменные (read-only), системная информация

import { useState } from 'react';

export function SystemSettingsScreen() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    '🛠 Система на техническом обслуживании. Пожалуйста, попробуйте позже.'
  );
  const [showEnv, setShowEnv] = useState(false);

  // Mock ENV variables (read-only)
  const ENV_SECTIONS = [
    {
      title: '🗄️ База данных',
      vars: [
        { key: 'DATABASE_URL', value: 'postgresql://balloo:***@localhost:5432/balloo?schema=public' },
        { key: 'DB_HOST', value: 'localhost' },
        { key: 'DB_PORT', value: '5432' },
        { key: 'DB_NAME', value: 'balloo' },
      ],
    },
    {
      title: '⚡ Redis',
      vars: [
        { key: 'REDIS_HOST', value: 'localhost' },
        { key: 'REDIS_PORT', value: '6379' },
      ],
    },
    {
      title: '🔐 Безопасность',
      vars: [
        { key: 'JWT_SECRET', value: '*** (скрыто)' },
        { key: 'JWT_ACCESS_TTL', value: '900' },
        { key: 'JWT_REFRESH_TTL', value: '2592000' },
        { key: 'CORS_ORIGINS', value: '*' },
      ],
    },
    {
      title: '🌐 Домены',
      vars: [
        { key: 'DOMAIN_BALLOO', value: 'https://balloo.su' },
        { key: 'DOMAIN_ADMIN', value: 'https://admin.balloo.su' },
        { key: 'DOMAIN_API', value: 'https://api.balloo.su' },
        { key: 'DOMAIN_CDN', value: 'https://cdn.balloo.su' },
      ],
    },
    {
      title: '📧 Email & Push',
      vars: [
        { key: 'SMTP_HOST', value: 'localhost' },
        { key: 'SMTP_PORT', value: '587' },
        { key: 'PUSH_SUBJECT', value: 'mailto:admin@balloo.su' },
      ],
    },
  ];

  // System info
  const systemInfo = {
    version: '1.0.0',
    node: process.env.NODE_ENV || 'production',
    uptime: '7 дней',
    db: 'PostgreSQL 16',
    redis: 'Redis 7',
    prisma: 'Prisma 5.0',
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <h1 className="admin-page__title">⚙️ Настройки системы</h1>
        <p className="admin-page__subtitle">
          Глобальные настройки Balloo Messenger
        </p>
      </div>

      {/* System Info */}
      <div className="admin-section">
        <h2 className="admin-section__title">📊 Информация о системе</h2>
        <div className="system-info-grid">
          <div className="info-card">
            <div className="info-card__label">Версия</div>
            <div className="info-card__value">{systemInfo.version}</div>
          </div>
          <div className="info-card">
            <div className="info-card__label">Окружение</div>
            <div className="info-card__value">{systemInfo.node}</div>
          </div>
          <div className="info-card">
            <div className="info-card__label">Аптайм</div>
            <div className="info-card__value">{systemInfo.uptime}</div>
          </div>
          <div className="info-card">
            <div className="info-card__label">База данных</div>
            <div className="info-card__value">{systemInfo.db}</div>
          </div>
          <div className="info-card">
            <div className="info-card__label">Redis</div>
            <div className="info-card__value">{systemInfo.redis}</div>
          </div>
          <div className="info-card">
            <div className="info-card__label">Prisma</div>
            <div className="info-card__value">{systemInfo.prisma}</div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="admin-section">
        <h2 className="admin-section__title">🛠 Режим обслуживания</h2>
        <div className="admin-card">
          <div className="admin-card__body">
            <div className="toggle-row">
              <div className="toggle-row__info">
                <div className="toggle-row__label">Включить режим обслуживания</div>
                <div className="toggle-row__desc">
                  Пользователи увидят страницу с сообщением при включении
                </div>
              </div>
              <button
                className={`toggle-btn ${maintenanceMode ? 'toggle-btn--active' : ''}`}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                <span className="toggle-btn__indicator" />
              </button>
            </div>

            {maintenanceMode && (
              <div className="admin-section" style={{ marginTop: 16 }}>
                <label className="admin-label">Сообщение для пользователей</label>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Сообщение о технических работах..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ENV Variables */}
      <div className="admin-section">
        <h2 className="admin-section__title">
          🔑 ENV-переменные <span className="admin-badge" style={{ background: '#6b7280' }}>Read-only</span>
        </h2>
        <div className="admin-card">
          <div className="admin-card__body">
            <button
              className="admin-btn admin-btn--outline"
              onClick={() => setShowEnv(!showEnv)}
              style={{ marginBottom: 16 }}
            >
              {showEnv ? 'Скрыть' : 'Показать'} ENV-переменные
            </button>

            {showEnv &&
              ENV_SECTIONS.map((section) => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 8,
                    }}
                  >
                    {section.title}
                  </h3>
                  {section.vars.map((env) => (
                    <div
                      key={env.key}
                      className="env-var-row"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 6,
                        marginBottom: 4,
                        fontFamily: 'monospace',
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {env.key}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                        {env.value}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="admin-section">
        <h2 className="admin-section__title">⚠️ Опасная зона</h2>
        <div className="admin-card" style={{ borderColor: '#ef4444' }}>
          <div className="admin-card__body">
            <div className="toggle-row">
              <div className="toggle-row__info">
                <div className="toggle-row__label" style={{ color: '#ef4444', fontWeight: 600 }}>
                  Сбросить все настройки
                </div>
                <div className="toggle-row__desc">
                  Удалит все пользовательские данные и вернёт систему к заводским настройкам
                </div>
              </div>
              <button
                className="admin-btn admin-btn--danger"
                onClick={() => {
                  if (window.confirm('Вы уверены? Это действие необратимо!')) {
                    alert('Функция в разработке');
                  }
                }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
