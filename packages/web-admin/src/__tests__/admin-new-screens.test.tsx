// Тест роутера админки: 4 новых экрана (тик. 1794892004)
// боты, группы, файлы (статистика), статус сервиса.
// Рендер идут через App → lazy: проверяет, что lazy-обёртка с `.then(m => ({default: m.X}))`
// не сломана (иначе вместо экрана — ErrorBoundary). См. app-routing.test.tsx.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('@/services/api', async () => {
  const { createUniversalApiMock } = await import(
    '../../../web/src/__tests__/helpers/apiSpyMock'
  );
  return { api: createUniversalApiMock() };
});

import App from '../App';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '../sessionStore';

const adminUser = {
  id: 'u-admin',
  email: 'admin@balloo.su',
  username: 'admin',
  displayName: 'Админ',
  status: 'active' as const,
  language: 'ru',
  theme: 'dark',
  isAdmin: true,
  isTwoFAEnabled: false,
};

describe('App (роутер админки): новые экраны модерации', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, isLoading: false });
    // Тик. 1795888510: AdminGuard читает сессию из sessionStore (GET /api/users/me).
    useSessionStore.setState({
      user: { ...adminUser, role: 'superadmin', isAdmin: true },
      status: 'ready',
      error: null,
    });
  });

  const routes: [string, string][] = [
    ['/bots', 'Управление ботами'],
    ['/groups', 'Модерация групп'],
    ['/files-stats', 'Файлы (статистика)'],
    ['/service-status', 'Статус сервиса'],
  ];

  for (const [path, marker] of routes) {
    it(`${path} рендерит экран (${marker}) через lazy, а не ErrorBoundary`, async () => {
      window.history.pushState({}, '', path);
      const { container } = render(<App />);

      await waitFor(
        () => {
          const text = container.textContent || '';
          expect(text).not.toContain('Что-то пошло не так');
          expect(text).toContain(marker);
        },
        { timeout: 4000 }
      );
    });
  }
});
