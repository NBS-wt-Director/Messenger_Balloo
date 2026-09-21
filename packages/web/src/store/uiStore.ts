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

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (isOpen: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
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
}));
