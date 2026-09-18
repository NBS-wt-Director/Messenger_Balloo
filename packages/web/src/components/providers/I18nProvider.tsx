// I18n Provider — переводы (20 языков)
// Uses translations from @balloo/shared

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUIStore, type Language } from '@/store/uiStore';
import {
  translations,
  type TranslationKey,
  type Translations,
  isLocaleSupported,
} from '@balloo/shared';

interface I18nContextValue {
  locale: Language;
  setLocale: (locale: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  translations: Translations;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'ru',
  setLocale: () => {},
  t: (key: TranslationKey) => key,
  translations,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useUIStore((s) => s.language);
  const setLocale = useUIStore((s) => s.setLanguage);

  // Local state for t function to avoid re-renders on locale change
  const [currentLocale, setCurrentLocale] = useState<Language>(locale);

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const translation = translations[key];
      if (!translation) return key;
      let str = translation[currentLocale] || translation['en'] || translation['ru'] || key;
      // Подстановка переменных: {n}, {provider} и т.п. (P22)
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          str = str.split(`{${name}}`).join(String(value));
        }
      }
      return str;
    },
    [currentLocale]
  );

  const handleSetLocale = useCallback(
    (newLocale: Language) => {
      if (isLocaleSupported(newLocale)) {
        setLocale(newLocale);
        setCurrentLocale(newLocale);
      }
    },
    [setLocale]
  );

  return (
    <I18nContext.Provider value={{ locale: currentLocale, setLocale: handleSetLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
}
