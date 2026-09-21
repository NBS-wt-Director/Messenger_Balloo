// UI Store — Zustand (тема + язык)
// Вынесено из packages/web в @balloo/ui (тик. №1 мультитикета поддоменов):
// тема и язык — ЕДИНЫЙ контракт всех сайтов balloo.su. Cookie-persist с
// доменом .balloo.su — выбор пользователя действует на всех поддоменах.
//
// Layout-состояние конкретного сайта (sidebar/panels) сюда НЕ входит —
// оно остаётся в локальном store сайта (web: packages/web/src/store/uiStore.ts).

import { create } from 'zustand';
import {
  getCookie,
  setCookie,
  THEME_COOKIE,
  LANGUAGE_COOKIE,
} from '../utils/cookieUtils';

export type Theme = 'dark' | 'light' | 'russian';
export type Language =
  | 'ru' | 'en' | 'zh' | 'fr' | 'be' | 'hi'
  | 'tt' | 'ba' | 'ce' | 'cv' | 'av' | 'dar' | 'udm' | 'lez' | 'kbd' | 'chm' | 'os' | 'sah' | 'bua' | 'ukr';

interface UIState {
  theme: Theme;
  language: Language;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

// Supported languages list — контракт 20 языков (data_schema.json → conventions.languages)
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

// Load saved theme from cookie or use default
function getInitialTheme(): Theme {
  const saved = getCookie(THEME_COOKIE);
  if (saved && ['dark', 'light', 'russian'].includes(saved)) {
    return saved as Theme;
  }
  return DEFAULT_THEME;
}

// Load saved language from cookie or use default
function getInitialLanguage(): Language {
  const saved = getCookie(LANGUAGE_COOKIE);
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

    setTheme: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      setCookie(THEME_COOKIE, theme, 365);
      set({ theme });
    },

    setLanguage: (language) => {
      document.documentElement.setAttribute('lang', language);
      setCookie(LANGUAGE_COOKIE, language, 365);
      set({ language });
    },
  };
});
