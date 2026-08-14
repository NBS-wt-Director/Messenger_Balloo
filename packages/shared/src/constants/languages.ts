// Supported languages for Balloo Messenger

// Total: 20 languages in 3 groups
// Group 1: Russian languages (RU + 14 native languages of Russian Federation)
// Group 2: Friendly languages (ZH, HI, BE)
// Group 3: Other languages (EN, FR)

export interface Language {
  code: string;
  name: string; // native name
  nativeName: string; // name in native language
  group: 'russian' | 'friendly' | 'other';
  flag?: string; // emoji flag for russian group
}

export const LANGUAGES: Language[] = [
  // Group 1: Russian languages
  { code: 'ru', name: 'Русский', nativeName: 'Русский', group: 'russian', flag: '🇷🇺' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татарча', group: 'russian' },
  { code: 'ba', name: 'Bashkir', nativeName: 'Башҡортса', group: 'russian' },
  { code: 'ce', name: 'Chechen', nativeName: 'Нохчийн', group: 'russian' },
  { code: 'cv', name: 'Chuvash', nativeName: 'Чӑвашла', group: 'russian' },
  { code: 'av', name: 'Avar', nativeName: 'Магӏарул мацӏ', group: 'russian' },
  { code: 'dar', name: 'Dargwa', nativeName: 'Дарги мацӏ', group: 'russian' },
  { code: 'udm', name: 'Udmurt', nativeName: 'Удмурт кылын', group: 'russian' },
  { code: 'lez', name: 'Lezgian', nativeName: 'Лезги чӏал', group: 'russian' },
  { code: 'kbd', name: 'Kabardian', nativeName: 'Къэбэрдей адыгэбзэ', group: 'russian' },
  { code: 'chm', name: 'Mari', nativeName: 'Олык марий йылме', group: 'russian' },
  { code: 'os', name: 'Ossetian', nativeName: 'Ирон ӕвзаг', group: 'russian' },
  { code: 'sah', name: 'Yakut', nativeName: 'Саха тыла', group: 'russian' },
  { code: 'bua', name: 'Buryat', nativeName: 'Хальмг келн', group: 'russian' },
  { code: 'ukr', name: 'Ukrainian', nativeName: 'Українська', group: 'russian', flag: '🇺🇦' },
  // Group 2: Friendly languages
  { code: 'zh', name: 'Chinese', nativeName: '中文', group: 'friendly' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', group: 'friendly' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', group: 'friendly' },
  // Group 3: Other languages
  { code: 'en', name: 'English', nativeName: 'English', group: 'other' },
  { code: 'fr', name: 'French', nativeName: 'Français', group: 'other' },
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all languages in a group
 */
export function getLanguagesByGroup(group: 'russian' | 'friendly' | 'other'): Language[] {
  return LANGUAGES.filter(lang => lang.group === group);
}

/**
 * Default language (Russian)
 */
export const DEFAULT_LANGUAGE = 'ru';

/**
 * All language codes as array
 */
export const LANGUAGE_CODES = LANGUAGES.map(lang => lang.code);
