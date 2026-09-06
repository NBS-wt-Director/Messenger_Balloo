// Auth Store — Zustand
// Token, user, auth state
// JWT tokens stored in httpOnly cookies (not localStorage)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStatus } from '@balloo/shared';
import { setCookie, THEME_COOKIE, LANGUAGE_COOKIE } from '../utils/cookieUtils';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: UserStatus;
  language: string;
  theme: string;
  isAdmin: boolean;
  isTwoFAEnabled: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setTheme: (theme: string) => void;
  setLanguage: (language: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        // Очищаем cookie через сервер
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100';
          await fetch(`${API_BASE}/api/auth/clear-cookie`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // Ignore errors during logout cleanup
        }

        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        setCookie(THEME_COOKIE, theme, 365);
        const user = get().user;
        if (user) {
          set({ user: { ...user, theme } });
        }
      },

      setLanguage: (language) => {
        document.documentElement.setAttribute('lang', language);
        setCookie(LANGUAGE_COOKIE, language, 365);
        const user = get().user;
        if (user) {
          set({ user: { ...user, language } });
        }
      },
    }),
    {
      name: 'balloo-auth',
      partialize: (state) => ({
        user: state.user,
        // Токены в httpOnly cookie — в persist попадает только user-кэш
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);