// UI Store — Zustand
// Theme, language, sidebar state

import { create } from 'zustand';

export type Theme = 'dark' | 'light' | 'russian';
export type Language = 'ru' | 'en' | 'zh' | 'fr' | 'be' | 'hi' | 'tt' | 'ba' | 'ce' | 'cv' | 'av' | 'dar' | 'udm' | 'lez' | 'kbd' | 'chm' | 'os' | 'sah' | 'bua' | 'ukr';

interface UIState {
  theme: Theme;
  language: Language;
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  isSettingsOpen: boolean;
  isSearchOpen: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (isOpen: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
}

// Supported languages list
export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татарча' },
  { code: 'ba', name: 'Bashkir', nativeName: 'Башҡортса' },
  { code: 'ce', name: 'Chechen', nativeName: 'Нохчийн' },
  { code: 'cv', name: 'Chuvash', nativeName: 'Чӑвашла' },
  { code: 'av', name: 'Avar', nativeName: 'Магӏарул' },
  { code: 'dar', name: 'Dargwa', nativeName: 'Дарган' },
  { code: 'udm', name: 'Udmurt', nativeName: 'Удмурт' },
  { code: 'lez', name: 'Lezgian', nativeName: 'Лезги' },
  { code: 'kbd', name: 'Kabardian', nativeName: 'Адыга' },
  { code: 'chm', name: 'Mari', nativeName: 'Марий' },
  { code: 'os', name: 'Ossetian', nativeName: 'Ирон' },
  { code: 'sah', name: 'Yakut', nativeName: 'Саха' },
  { code: 'bua', name: 'Buryat', nativeName: 'Буряад' },
  { code: 'ukr', name: 'Ukrainian', nativeName: 'Українська' },
];

// Default theme
const DEFAULT_THEME: Theme = 'dark';

// Load saved theme or use default
function getInitialTheme(): Theme {
  const saved = localStorage.getItem('balloo-theme');
  if (saved && ['dark', 'light', 'russian'].includes(saved)) {
    return saved as Theme;
  }
  return DEFAULT_THEME;
}

// Load saved language or use default
function getInitialLanguage(): Language {
  const saved = localStorage.getItem('balloo-language');
  if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
    return saved as Language;
  }
  // Detect browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ru')) return 'ru';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('be')) return 'be';
  if (browserLang.startsWith('hi')) return 'hi';
  return 'en';
}

export const useUIStore = create<UIState>()((set) => {
  const theme = getInitialTheme();
  const language = getInitialLanguage();

  // Apply theme to document
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('lang', language);

  return {
    theme,
    language,
    isSidebarOpen: true,
    isRightPanelOpen: false,
    isSettingsOpen: false,
    isSearchOpen: false,

    setTheme: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('balloo-theme', theme);
      set({ theme });
    },

    setLanguage: (language) => {
      document.documentElement.setAttribute('lang', language);
      localStorage.setItem('balloo-language', language);
      set({ language });
    },

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
    setRightPanelOpen: (isOpen) => set({ isRightPanelOpen: isOpen }),

    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

    toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  };
});
