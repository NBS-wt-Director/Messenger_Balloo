// Theme definitions for Balloo Messenger

// 3 themes: dark (default), light, russian

export type ThemeId = 'dark' | 'light' | 'russian';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeId, Theme> = {
  dark: {
    id: 'dark',
    name: 'Тёмная',
    description: 'Тёмная тема по умолчанию',
    isDark: true,
  },
  light: {
    id: 'light',
    name: 'Светлая',
    description: 'Светлая тема',
    isDark: false,
  },
  russian: {
    id: 'russian',
    name: 'Российская',
    description: 'Тема с флагом РФ и драгметаллами',
    isDark: true,
  },
};

/**
 * Default theme
 */
export const DEFAULT_THEME: ThemeId = 'dark';

/**
 * All theme IDs
 */
export const THEME_IDS: ThemeId[] = ['dark', 'light', 'russian'];

/**
 * Get theme by ID
 */
export function getThemeById(id: ThemeId): Theme {
  return THEMES[id];
}

/**
 * Get all themes as array
 */
export function getAllThemes(): Theme[] {
  return THEME_IDS.map(id => THEMES[id]);
}
