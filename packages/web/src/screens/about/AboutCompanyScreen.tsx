// AboutCompanyScreen — экран «О компании» (1_01_16)
// Описание, контакты, команда, юридическая информация
// Статичная страница по образцу legal-экранов (Rules/Privacy)

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

export function AboutCompanyScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, Manrope, sans-serif' }}>
      <AppTopbar title="О компании" />
      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>О компании</h1>
        </div>

        {/* Description */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 8, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: 'var(--text-inverse)', flexShrink: 0,
            }}>B</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Balloo</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Российская технологическая компания</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Balloo — разработчик кроссплатформенного мессенджера. Мы создаём инструменты для
            общения, работы и бизнеса: чаты, группы, каналы, звонки, боты и интеграции.
            Приложение доступно на Web, Desktop (Linux) и Android.
          </p>
        </div>

        {/* Contacts */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>Контакты</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <span>📧</span>
              <span>Email: <a href="mailto:info@balloo.su" style={{ color: 'var(--accent)' }}>info@balloo.su</a></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <span>💬</span>
              <span>Поддержка: <a href="/#/support" style={{ color: 'var(--accent)' }}>Чат с поддержкой</a></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <span>✈️</span>
              <span>Telegram: <a href="https://t.me/balloo_support" style={{ color: 'var(--accent)' }}>@balloo_support</a></span>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>Команда</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
            Balloo создаётся небольшой командой разработчиков, дизайнеров и специалистов
            технической поддержки. Мы открыты к фидбеку и предложениям.
          </p>
          <a href="/#/command" style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none' }}>
            → Портал сотрудников
          </a>
        </div>

        {/* Legal */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: 12 }}>Юридическая информация</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>ИНН: <span style={{ fontStyle: 'italic', opacity: 0.7 }}>данные уточняются</span></div>
            <div style={{ marginBottom: 6 }}>ОГРН: <span style={{ fontStyle: 'italic', opacity: 0.7 }}>данные уточняются</span></div>
            <div>© 2026 Balloo. Все права защищены.</div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
