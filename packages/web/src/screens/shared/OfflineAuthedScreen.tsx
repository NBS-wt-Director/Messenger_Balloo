// Offline Authed Screen — страница «Нет соединения» (авторизованный)
// Shared error screen (1_00_05) — макет mockups/shared/offline-authed.html

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

const cachedChats = [
  { icon: '💬', name: 'Команда Balloo', msg: 'Релиз v2.0 готов к тестированию', time: '2 мин' },
  { icon: '🦊', name: 'Иван Петров', msg: 'Привет! Видел новый дизайн?', time: '15 мин' },
  { icon: '📱', name: 'Группа разработки', msg: 'Аня: баг с аватаркой пофикшен', time: '1 ч' },
];

function OfflineAuthedScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppTopbar title="Офлайн" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🦊📡</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Нет соединения с интернетом</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 24 }}>
          Похоже, вы офлайн. Последние сообщения доступны для чтения из кэша. Новые сообщения будут отправлены автоматически при восстановлении соединения.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#fff', fontWeight: 600, borderRadius: 0, border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 28 }}
        >
          Попробовать снова
        </button>

        {/* Cached chats */}
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>Кэшированные чаты</div>
          {cachedChats.map((chat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-glass)', backdropFilter: 'blur(var(--blur))', border: '1px solid var(--border-color)', marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, clipPath: 'var(--octagon-clip)', background: 'var(--bg-tertiary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{chat.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{chat.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.msg}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{chat.time}</div>
            </div>
          ))}
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

export default OfflineAuthedScreen;
