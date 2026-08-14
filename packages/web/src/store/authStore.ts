// Auth Store — Zustand
// Token, user, auth state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStatus } from '@balloo/shared';

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
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
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
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        // Clear tokens from storage
        localStorage.removeItem('balloo-refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
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
        localStorage.setItem('balloo-theme', theme);
        const user = get().user;
        if (user) {
          set({ user: { ...user, theme } });
        }
      },

      setLanguage: (language) => {
        document.documentElement.setAttribute('lang', language);
        localStorage.setItem('balloo-language', language);
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
