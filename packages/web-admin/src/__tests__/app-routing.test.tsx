// Тест роутера админки (тикет 1793259599).
// Ловит регресс, который не видели smoke-тесты экранов: экраны админки —
// именованные экспорты, а App грузит их через lazy(). Если lazy вызван без
// `.then((m) => ({ default: m.X }))`, React 18 падает при монтировании и
// вместо страницы рисуется ErrorBoundary. Smoke-тесты этого не замечали,
// потому что импортировали экраны напрямую, минуя lazy.
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

describe('App (роутер админки)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, isLoading: false });
    window.history.pushState({}, '', '/admin');
  });

  it('/admin рендерит дашборд через lazy-обёртку, а не ErrorBoundary', async () => {
    const { container } = render(<App />);

    await waitFor(
      () => {
        const text = container.textContent || '';
        expect(text).not.toContain('Что-то пошло не так');
        expect(text).toContain('Дашборд');
      },
      { timeout: 4000 }
    );
  });

  it('/admin/employees рендерит экран сотрудников', async () => {
    window.history.pushState({}, '', '/admin/employees');
    const { container } = render(<App />);

    await waitFor(
      () => {
        expect(container.textContent || '').toContain('Сотрудники');
      },
      { timeout: 4000 }
    );
  });

  it('/install доступен без авторизации', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    window.history.pushState({}, '', '/install');
    const { container } = render(<App />);

    await waitFor(
      () => {
        expect(container.textContent || '').toContain('Установка Balloo');
      },
      { timeout: 4000 }
    );
  });
});
