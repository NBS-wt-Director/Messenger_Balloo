/**
 * Тик. 1795343610: холодное обновление вкладки при 429 выбрасывало
 * авторизованного на /login — AuthProvider сбрасывал user на ЛЮБОЙ ошибке
 * restoreSession. Теперь сбрасываем только при явной потере сессии
 * (не-transient), а 429/5xx/сеть (transient) сохраняют пользователя.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import { api, ApiError } from '@/services/api';

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return { ...actual, api: { ...actual.api, getMe: vi.fn() } };
});

const user: AuthUser = {
  id: 'u1',
  email: 'edb@balloo.su',
  username: 'edb',
  status: 'active',
  language: 'ru',
  theme: 'dark',
  isAdmin: false,
  isTwoFAEnabled: false,
};

/** Читает состояние контекста: loading → user/guest. */
function Probe() {
  const { isLoading, user: current } = useAuth();
  return <span data-testid="probe">{isLoading ? 'loading' : current ? 'user' : 'guest'}</span>;
}

describe('AuthProvider.restoreSession — transient-ошибки (тик. 1795343610)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('429 (transient): пользователь НЕ сбрасывается', async () => {
    useAuthStore.setState({ user, isAuthenticated: true });
    vi.mocked(api.getMe).mockRejectedValue(new ApiError('Слишком много запросов', 429, true));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('user'));
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('401 (не transient): пользователь сбрасывается', async () => {
    useAuthStore.setState({ user, isAuthenticated: true });
    vi.mocked(api.getMe).mockRejectedValue(new ApiError('Session expired', 401, false));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('guest'));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('успешный getMe: пользователь восстанавливается', async () => {
    vi.mocked(api.getMe).mockResolvedValue(user);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('user'));
  });
});
