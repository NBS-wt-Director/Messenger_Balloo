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
  t: (key: TranslationKey) => string;
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
    (key: TranslationKey): string => {
      const translation = translations[key];
      if (!translation) return key;
      return translation[currentLocale] || translation['en'] || translation['ru'] || key;
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
