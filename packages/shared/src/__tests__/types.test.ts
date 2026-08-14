import { describe, it, expect } from 'vitest';
import {
  LANGUAGES,
  LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  getLanguageByCode,
  getLanguagesByGroup,
} from '../constants/languages';
import { THEMES, THEME_IDS, getAllThemes } from '../constants/themes';

describe('languages constants', () => {
  it('has exactly 20 languages', () => {
    expect(LANGUAGES).toHaveLength(20);
  });

  it('has 20 language codes', () => {
    expect(LANGUAGE_CODES).toHaveLength(20);
  });

  it('default language is ru', () => {
    expect(DEFAULT_LANGUAGE).toBe('ru');
  });

  it('all language codes are unique', () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('each language has required fields', () => {
    LANGUAGES.forEach((lang) => {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
      expect(['russian', 'friendly', 'other']).toContain(lang.group);
    });
  });

  it('russian group has 15 languages (RU + 14)', () => {
    const russian = getLanguagesByGroup('russian');
    expect(russian).toHaveLength(15);
  });

  it('friendly group has 3 languages', () => {
    const friendly = getLanguagesByGroup('friendly');
    expect(friendly).toHaveLength(3);
  });

  it('other group has 2 languages', () => {
    const other = getLanguagesByGroup('other');
    expect(other).toHaveLength(2);
  });

  it('getLanguageByCode returns correct language', () => {
    const lang = getLanguageByCode('ru');
    expect(lang).toBeDefined();
    expect(lang!.name).toBe('Русский');
  });

  it('getLanguageByCode returns undefined for unknown code', () => {
    expect(getLanguageByCode('xx')).toBeUndefined();
  });
});

describe('themes constants', () => {
  it('has exactly 3 themes', () => {
    expect(THEME_IDS).toHaveLength(3);
  });

  it('has dark, light, russian themes', () => {
    expect(THEME_IDS).toContain('dark');
    expect(THEME_IDS).toContain('light');
    expect(THEME_IDS).toContain('russian');
  });

  it('getAllThemes returns array of 3 themes', () => {
    const all = getAllThemes();
    expect(all).toHaveLength(3);
  });
});
