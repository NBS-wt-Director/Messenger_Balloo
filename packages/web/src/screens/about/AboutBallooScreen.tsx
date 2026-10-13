// AboutBallooScreen — экран «О Balloo» (1_01_17)
// Версия, технологии, лицензии, ссылки, дорожная карта
// Статичная страница по образцу legal-экранов (Rules/Privacy)

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

const APP_VERSION = '1.0.0';

const TECHS = [
  'React 19', 'Vite 6', 'Node.js 22', 'Hono 4', 'PostgreSQL 16',
  'Prisma 6', 'Redis 7', 'WebSocket (uWebSockets)', 'Expo (React Native)',
  'Electron', 'Docker', 'Nginx', 'TypeScript 5',
];

const LICENSES = [
  'MIT License — Balloo',
  'MIT License — React',
  'MIT License — Vite',
  'MIT License — Hono',
  'MIT License — Prisma',
  'Apache 2.0 — Node.js',
  'BSD 3-Clause — PostgreSQL',
  'Open Font License — Inter, Manrope',
];

const LINKS = [
  { icon: '⬇️', label: 'Скачать приложение', href: '/download' },
  { icon: '📜', label: 'История версий', href: '/changelog' },
  { icon: '📚', label: 'API документация', href: '/docs' },
  { icon: '💡', label: 'Предложить функцию', href: '/features' },
  { icon: '📋', label: 'Правила', href: '/rules' },
  { icon: '🏢', label: 'О компании', href: '/about-company' },
];

export function AboutBallooScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, Manrope, sans-serif' }}>
      <AppTopbar title="О Balloo" />
      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/assets/logos/mascot.png" alt="Маскот Balloo — медведь Борис" style={{ width: 80, height: 80, marginBottom: 16, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>О Balloo Messenger</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            Кроссплатформенный российский мессенджер: Web, Desktop, Android
          </p>
        </div>

        {/* Version */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>Версия</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700 }}>v{APP_VERSION}</span>
            <span style={{
              background: 'var(--accent)', color: 'var(--text-inverse)', padding: '2px 10px',
              borderRadius: 12, fontSize: 11, fontWeight: 600,
            }}>Актуальная</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
            Кроссплатформенный: Web (SPA), Desktop (Linux/Windows), Android (Expo)
          </p>
        </div>

        {/* Tech */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>Технологии</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TECHS.map((tech) => (
              <span key={tech} style={{
                background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 6,
                fontSize: 12, color: 'var(--text-primary)',
              }}>{tech}</span>
            ))}
          </div>
        </div>

        {/* Licenses */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>Лицензии</h2>
          <ul style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
            {LICENSES.map((lic) => <li key={lic}>{lic}</li>)}
          </ul>
        </div>

        {/* Links */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>Ссылки</h2>
          {LINKS.map((link) => (
            <a key={link.href} href={`/#${link.href}`} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0',
              color: 'var(--text-primary)', textDecoration: 'none',
              borderBottom: '1px solid var(--border-light)', fontSize: 14,
            }}>
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </div>

        {/* Roadmap */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: 12 }}>Дорожная карта</h2>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>v1 — Текущая</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Чаты, группы, звонки, OAuth, мультиязычность (20 языков), 3 темы оформления
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>v2 — План</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Госуслуги, SMS-верификация, E2EE-шифрование, подразделы чатов, Premium
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
