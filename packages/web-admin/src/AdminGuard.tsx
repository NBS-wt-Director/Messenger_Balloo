// AdminGuard — доступ в админ-панель (тик. 1795888510, переписан с 1793259599).
//
// Решение владельца 28.11.2026: НЕ перенаправляем. Неавторизованный или
// пользователь без прав видит экран с объяснением и кнопками (заявка в команду,
// поддержать, общаться) — см. AccessDeniedScreen.
//
// Авторизация переносится с основного домена: cookie с domain=.balloo.su,
// сессия проверяется запросом GET /api/users/me (sessionStore).
// Права: сервер отдаёт isAdmin для ролей admin/superadmin.

import { useEffect } from 'react';
import { useSessionStore } from './sessionStore';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const status = useSessionStore((s) => s.status);
  const loadSession = useSessionStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Пока сессия проверяется — спиннер, без мигания чужого контента.
  if (status === 'idle' || status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--app-bg)',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <AccessDeniedScreen reason="guest" user={null} />;
  }

  if (!user.isAdmin) {
    return <AccessDeniedScreen reason="no-access" user={user} />;
  }

  return <>{children}</>;
}
