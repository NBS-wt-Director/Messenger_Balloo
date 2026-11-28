// sessionStore — сессия админ-панели (тик. 1795888510).
//
// Загружается один раз при старте (AdminGuard → loadSession) запросом
// GET /api/users/me. Cookie сессии выставлена основным доменом с
// domain=.balloo.su, поэтому авторизация «переносится» без повторного входа.
//
// Отдельный от web-стора: localStorage у admin.balloo.su свой, и полагаться на
// кэш прошлых сессий здесь нельзя — источник правды только ответ сервера.

import { create } from 'zustand';
import { adminApi, AdminApiError, type AdminUser } from './api';

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error';

interface SessionState {
  user: AdminUser | null;
  status: SessionStatus;
  error: string | null;
  /** Один запрос на всё приложение: повторные вызовы переиспользуют результат. */
  loadSession: (force?: boolean) => Promise<void>;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  status: 'idle',
  error: null,

  loadSession: async (force = false) => {
    const { status } = get();
    if (!force && (status === 'loading' || status === 'ready')) return;

    set({ status: 'loading', error: null });
    try {
      const me = await adminApi.getMe();
      set({ user: me, status: 'ready', error: null });
    } catch (e) {
      if (e instanceof AdminApiError && e.status === 401) {
        // Сессии нет — это гость, а не сбой: экран отказа покажет вход.
        set({ user: null, status: 'ready', error: null });
        return;
      }
      if (e instanceof AdminApiError && e.transient) {
        // API недоступен: сессию не считаем потерянной, но и в панель не пускаем.
        set({ user: null, status: 'error', error: e.message });
        return;
      }
      set({ user: null, status: 'ready', error: null });
    }
  },

  logout: () => set({ user: null, status: 'ready', error: null }),
}));
