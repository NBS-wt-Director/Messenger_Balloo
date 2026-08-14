// Auth Provider — контекст авторизации
// Wraps app with auth state and token management

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import axios from 'axios';

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
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [initialLoad, setInitialLoad] = useState(true);

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor — attach token
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor — handle 401
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip retry for logout, refresh, and already retried requests
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const store = useAuthStore.getState();
            if (store.refreshToken) {
              await axios.post('/api/auth/refresh', {
                refreshToken: store.refreshToken,
              });
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed — logout
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const store = useAuthStore.getState();
      if (store.accessToken && store.user) {
        try {
          // Verify token is still valid
          const response = await axios.get('/api/users/me');
          setUser(response.data);
        } catch {
          // Token invalid — try refresh
          if (store.refreshToken) {
            try {
              await axios.post('/api/auth/refresh', {
                refreshToken: store.refreshToken,
              });
            } catch {
              store.logout();
            }
          } else {
            store.logout();
          }
        }
      }
      setInitialLoad(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string, _rememberDevice?: boolean) => {
      const store = useAuthStore.getState();
      store.setLoading(true);

      try {
        const response = await axios.post('/api/auth/login', {
          email,
          password,
          rememberDevice: _rememberDevice,
        });

        const { user, accessToken, refreshToken } = response.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      } catch (error) {
        throw error;
      } finally {
        store.setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const store = useAuthStore.getState();
      store.setLoading(true);

      try {
        const response = await axios.post('/api/auth/register', {
          email,
          username,
          password,
        });

        const { user, accessToken, refreshToken } = response.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      } catch (error) {
        throw error;
      } finally {
        store.setLoading(false);
      }
    },
    []
  );

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const refreshTokenFn = useCallback(async () => {
    const store = useAuthStore.getState();
    if (!store.refreshToken) return;

    try {
      const response = await axios.post('/api/auth/refresh', {
        refreshToken: store.refreshToken,
      });
      setTokens(response.data.accessToken, response.data.refreshToken);
    } catch {
      store.logout();
      window.location.href = '/login';
    }
  }, []);

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
