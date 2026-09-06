import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('starts with null user and not authenticated', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setUser sets user and isAuthenticated', () => {
    const testUser = {
      id: 'test-id',
      email: 'test@test.ru',
      username: 'testuser',
      status: 'active' as const,
      language: 'ru',
      theme: 'dark',
      isAdmin: false,
      isTwoFAEnabled: false,
    };
    useAuthStore.getState().setUser(testUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(testUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('setUser with null clears auth', () => {
    useAuthStore.getState().setUser({
      id: 'test-id',
      email: 'test@test.ru',
      username: 'testuser',
      status: 'active',
      language: 'ru',
      theme: 'dark',
      isAdmin: false,
      isTwoFAEnabled: false,
    });
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('setAuthenticated updates isAuthenticated', () => {
    useAuthStore.getState().setAuthenticated(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    useAuthStore.getState().setAuthenticated(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('logout clears all auth state', async () => {
    useAuthStore.getState().setUser({
      id: 'test-id',
      email: 'test@test.ru',
      username: 'testuser',
      status: 'active',
      language: 'ru',
      theme: 'dark',
      isAdmin: false,
      isTwoFAEnabled: false,
    });
    // logout асинхронный (очищает httpOnly cookie через сервер) — ждём завершения
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updateUser updates user fields', () => {
    useAuthStore.getState().setUser({
      id: 'test-id',
      email: 'test@test.ru',
      username: 'testuser',
      status: 'active',
      language: 'ru',
      theme: 'dark',
      isAdmin: false,
      isTwoFAEnabled: false,
    });
    useAuthStore.getState().updateUser({ username: 'newusername' });
    expect(useAuthStore.getState().user?.username).toBe('newusername');
  });

  it('updateUser does nothing when user is null', () => {
    useAuthStore.getState().updateUser({ username: 'newusername' });
    expect(useAuthStore.getState().user).toBeNull();
  });
});
