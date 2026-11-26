// Склонение числительных «балл» (тикет 1795686329).

import { describe, it, expect } from 'vitest';
import { pluralFormFor, pluralKeyFor } from '../i18n/plural';

describe('pluralFormFor — русский', () => {
  it.each([
    [0, 'many'],
    [1, 'one'],
    [2, 'few'],
    [3, 'few'],
    [4, 'few'],
    [5, 'many'],
    [10, 'many'],
    [11, 'many'],
    [12, 'many'],
    [14, 'many'],
    [15, 'many'],
    [20, 'many'],
    [21, 'one'],
    [22, 'few'],
    [24, 'few'],
    [25, 'many'],
    [111, 'many'],
    [555, 'many'],
  ] as const)('%i → %s', (n, expected) => {
    expect(pluralFormFor(n, 'ru')).toBe(expected);
  });
});

describe('pluralFormFor — другие языки', () => {
  it('украинский/белорусский — тройная форма', () => {
    expect(pluralFormFor(1, 'uk')).toBe('one');
    expect(pluralFormFor(2, 'uk')).toBe('few');
    expect(pluralFormFor(5, 'uk')).toBe('many');
    expect(pluralFormFor(21, 'be')).toBe('one');
    expect(pluralFormFor(22, 'be')).toBe('few');
  });

  it('неславянские — единая форма many', () => {
    for (const lang of ['en', 'tt', 'ba', 'zh', 'hi', 'fr']) {
      expect(pluralFormFor(1, lang)).toBe('many');
      expect(pluralFormFor(2, lang)).toBe('many');
      expect(pluralFormFor(555, lang)).toBe('many');
    }
  });
});

describe('pluralKeyFor', () => {
  it('возвращает ключ словаря нужной формы', () => {
    expect(pluralKeyFor(1, 'ru')).toBe('points.one');
    expect(pluralKeyFor(2, 'ru')).toBe('points.few');
    expect(pluralKeyFor(555, 'ru')).toBe('points.many');
    expect(pluralKeyFor(1, 'en')).toBe('points.many');
  });
});
