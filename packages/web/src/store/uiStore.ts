// UI Store (web) — Zustand
// Layout-состояние ЭТОГО сайта: sidebar, right panel, settings, search.
// Функциональные настройки (тема, язык) с тикета №1 мультитикета поддоменов
// живут в @balloo/ui (единый контракт всех сайтов balloo.su) — реэкспорт ниже.
// Cookie-persist с доменом .balloo.su — читается всеми поддоменами.

import { create } from 'zustand';
import { getCookie, setCookie, SIDEBAR_COOKIE } from '../utils/cookieUtils';

// Тема/язык — единый контракт из @balloo/ui (для совместимости импортов в web)
export { useUIStore as useThemeLanguageStore } from '@balloo/ui';
export type { Theme, Language } from '@balloo/ui';
export { SUPPORTED_LANGUAGES } from '@balloo/ui';

interface UIState {
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  isSettingsOpen: boolean;
  isSearchOpen: boolean;

  /**
   * Режим обучения (тик. 1795292000): активируется кликом по заголовку в шапке.
   * Пока включён — показываем панель подсказок по текущему экрану.
   */
  learningMode: boolean;
  /**
   * Бегущая строка уведомления в шапке (тик. 1795292000): пока строка показывается,
   * она заменяет заголовок раздела; по окончании заголовок возвращается.
   */
  notice: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (isOpen: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
  toggleLearningMode: () => void;
  setLearningMode: (isOpen: boolean) => void;
  setNotice: (message: string | null) => void;
  /** Показать бегущую строку на `durationMs` мс, затем вернуть заголовок */
  showNotice: (message: string, durationMs?: number) => void;
}

// Load saved sidebar state from cookie (default: open)
function getInitialSidebarOpen(): boolean {
  const saved = getCookie(SIDEBAR_COOKIE);
  return saved !== 'closed';
}

// Persist sidebar state to cookie ('open' | 'closed')
function persistSidebar(isOpen: boolean): void {
  setCookie(SIDEBAR_COOKIE, isOpen ? 'open' : 'closed', 365);
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: getInitialSidebarOpen(),
  isRightPanelOpen: false,
  isSettingsOpen: false,
  isSearchOpen: false,
  learningMode: false,
  notice: null,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.isSidebarOpen;
      persistSidebar(next);
      return { isSidebarOpen: next };
    }),
  setSidebarOpen: (isOpen: boolean) => {
    persistSidebar(isOpen);
    set({ isSidebarOpen: isOpen });
  },

  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (isOpen: boolean) => set({ isRightPanelOpen: isOpen }),

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSettingsOpen: (isOpen: boolean) => set({ isSettingsOpen: isOpen }),

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchOpen: (isOpen: boolean) => set({ isSearchOpen: isOpen }),

  toggleLearningMode: () => set((state) => ({ learningMode: !state.learningMode })),
  setLearningMode: (isOpen: boolean) => set({ learningMode: isOpen }),

  setNotice: (message: string | null) => set({ notice: message }),
  showNotice: (message: string, durationMs = 6000) => {
    set({ notice: message });
    // По окончании показа возвращаем заголовок (тик. 1795292000).
    setTimeout(() => set({ notice: null }), durationMs);
  },
}));
