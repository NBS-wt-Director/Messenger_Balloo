// Auth Provider — контекст авторизации
// Аутентификация через httpOnly cookie (тикет №2 deploy-ready.md):
// - Токены НЕ хранятся на клиенте (ни localStorage, ни состояние)
// - Браузер сам отправляет cookie с каждым запросом (credentials: 'include')
// - Все запросы идут через services/api.ts (единая точка с авто-refresh при 401)

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import { api } from '@/services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberDevice?: boolean) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshToken: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [initialLoad, setInitialLoad] = useState(true);

  // Restore session on mount: проверяем httpOnly cookie запросом /users/me.
  // При 401 api.ts сам попробует /refresh-cookie и повторит запрос.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const me = await api.getMe();
        setUser(me as AuthUser);
      } catch {
        // Cookie нет / refresh не удался — пользователь не авторизован
        setUser(null);
      } finally {
        setInitialLoad(false);
      }
    };

    restoreSession();
  }, [setUser]);

  const login = useCallback(
    async (email: string, password: string, _rememberDevice?: boolean) => {
      const store = useAuthStore.getState();
      store.setLoading(true);

      try {
        // Сервер устанавливает httpOnly cookie; в body приходит user
        const response = await api.login(email, password);
        setUser(response.user as AuthUser);
      } catch (error) {
        throw error;
      } finally {
        store.setLoading(false);
      }
    },
    [setUser]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const store = useAuthStore.getState();
      store.setLoading(true);

      try {
        // Сервер устанавливает httpOnly cookie; в body приходит user
        const response = await api.register({ email, username, password });
        setUser(response.user as AuthUser);
      } catch (error) {
        throw error;
      } finally {
        store.setLoading(false);
      }
    },
    [setUser]
  );

  const handleLogout = useCallback(() => {
    // logout в authStore вызывает POST /clear-cookie (очистка httpOnly cookie)
    logout();
    window.location.hash = '#/login';
  }, [logout]);

  const refreshTokenFn = useCallback(async () => {
    try {
      // Обновляем cookie; при неудаче api.ts уже редиректит на /login
      await api.post('/api/auth/refresh-cookie');
    } catch {
      setUser(null);
    }
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading: initialLoad || isLoading,
        login,
        register,
        logout: handleLogout,
        refreshToken: refreshTokenFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

