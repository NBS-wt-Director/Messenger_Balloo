// Автоопределение языка по тегам браузера (контракт — 20 языков).
import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  normalizeLanguageTag,
  isSupportedLanguageCode,
} from '../i18n/detectLanguage';
import { LANGUAGE_CODES } from '../constants/languages';

describe('normalizeLanguageTag', () => {
  it('снимает региональную часть', () => {
    expect(normalizeLanguageTag('ru-RU')).toBe('ru');
    expect(normalizeLanguageTag('en-US')).toBe('en');
    expect(normalizeLanguageTag('fr-CA')).toBe('fr');
  });

  it('терпит подчёркивание и любой регистр', () => {
    expect(normalizeLanguageTag('ru_RU')).toBe('ru');
    expect(normalizeLanguageTag('EN-gb')).toBe('en');
    expect(normalizeLanguageTag('  tt  ')).toBe('tt');
  });

  it('украинский тег браузера (' + 'uk) мапит на код контракта (ukr)', () => {
    expect(normalizeLanguageTag('uk')).toBe('ukr');
    expect(normalizeLanguageTag('uk-UA')).toBe('ukr');
  });

  it('языки народов РФ распознаются сами, а не через «ru»', () => {
    for (const code of ['tt', 'ba', 'ce', 'cv', 'av', 'dar', 'udm', 'lez', 'kbd', 'chm', 'os', 'sah', 'bua']) {
      expect(normalizeLanguageTag(code)).toBe(code);
      expect(normalizeLanguageTag(`${code}-RU`)).toBe(code);
    }
  });

  it('неподдерживаемый язык → null', () => {
    expect(normalizeLanguageTag('de')).toBeNull();
    expect(normalizeLanguageTag('de-DE')).toBeNull();
    expect(normalizeLanguageTag('')).toBeNull();
    expect(normalizeLanguageTag('   ')).toBeNull();
  });
});

describe('detectLanguage', () => {
  it('берёт первый поддерживаемый тег с учётом приоритета', () => {
    expect(detectLanguage(['tt-RU', 'ru-RU', 'en'])).toBe('tt');
    expect(detectLanguage(['de', 'en-US'])).toBe('en');
  });

  it('каждый код контракта определяется из одноимённого тега', () => {
    for (const code of LANGUAGE_CODES) {
      expect(detectLanguage([code])).toBe(code);
    }
  });

  it('ничего поддерживаемого → null (решение о дефолте принимает вызывающий)', () => {
    expect(detectLanguage(['de', 'es', 'it'])).toBeNull();
    expect(detectLanguage([])).toBeNull();
    expect(detectLanguage(undefined)).toBeNull();
    expect(detectLanguage(null)).toBeNull();
  });

  it('не падает на мусоре в списке', () => {
    expect(detectLanguage([undefined as unknown as string, '', 'ru'])).toBe('ru');
  });
});

describe('isSupportedLanguageCode', () => {
  it('принимает только коды контракта', () => {
    expect(isSupportedLanguageCode('ru')).toBe(true);
    expect(isSupportedLanguageCode('ukr')).toBe(true);
    expect(isSupportedLanguageCode('uk')).toBe(false);
    expect(isSupportedLanguageCode('ru-RU')).toBe(false);
  });
});
