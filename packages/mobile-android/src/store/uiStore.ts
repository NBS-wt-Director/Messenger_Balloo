// UI Store — Zustand (Mobile)
// Theme, language, sidebar state

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light' | 'russian';

export type Language =
  | 'ru' | 'en' | 'zh' | 'fr' | 'be' | 'hi'
  | 'tt' | 'ba' | 'ce' | 'cv' | 'av' | 'dar' | 'udm' | 'lez'
  | 'kbd' | 'chm' | 'os' | 'sah' | 'bua' | 'ukr';

interface UIState {
  theme: Theme;
  language: Language;
  isSidebarOpen: boolean;

  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
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

const DEFAULT_THEME: Theme = 'dark';
const DEFAULT_LANGUAGE: Language = 'ru';

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      language: DEFAULT_LANGUAGE,
      isSidebarOpen: true,

      setTheme: (theme) => {
        set({ theme });
      },

      setLanguage: (language) => {
        set({ language });
      },

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    }),
    {
      name: 'balloo-ui',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);