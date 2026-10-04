// useAuth — авторизация через httpOnly cookie balloo.su (SSO)
// Токены не хранятся на клиенте. Состояние проверяется запросом /api/users/me.
// Вход — на balloo.su/login с redirect обратно (features — поддомен того же домена).

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

// Balloon SSO: вход на основном домене, features получает cookie автоматически
const BALLOO_ORIGIN = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://balloo.su')
  : 'https://balloo.su';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AuthUser>('/api/auth/me')
      .then((u) => { setUser(u); setIsAuthenticated(true); })
      .catch(() => { setUser(null); setIsAuthenticated(false); })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    api.post('/api/auth/clear-cookie').catch(() => {});
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Переход на balloo.su/login с redirect обратно на features
  const login = useCallback(() => {
    const back = encodeURIComponent(window.location.href);
    window.location.href = `${BALLOO_ORIGIN}/login?redirect=${back}`;
  }, []);

  const initials = user
    ? (user.displayName || user.username).slice(0, 2).toUpperCase()
    : undefined;

  return { user, isAuthenticated, loading, initials, login, logout };
}
