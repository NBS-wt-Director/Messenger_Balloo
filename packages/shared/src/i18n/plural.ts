// Склонение числительных для счётчика баллов (тикет 1795686329).
//
// Русский/украинский/белорусский требуют три формы (1 балл / 2 балла /
// 5 баллов). Остальные языки используют одну форму — значение ключа
// `points.one` (в словаре для них это общая форма множественного числа).

import type { TranslationKey } from './translations';

export type PluralForm = 'one' | 'few' | 'many';

const SLAVIC_TRIPLE = new Set(['ru', 'uk', 'be']);

/**
 * Выбор формы числительного по числу и языку.
 * 1, 21, 31 → 'one'; 2–4, 22–24 → 'few'; 0, 5–20, 11–14, 25–30 → 'many'.
 */
export function pluralFormFor(n: number, language: string): PluralForm {
  const abs = Math.abs(Math.trunc(n));
  if (!SLAVIC_TRIPLE.has(language)) return 'many';
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
  return 'many';
}

/** Ключ словаря для формы числительного. */
export function pluralKeyFor(n: number, language: string): TranslationKey {
  const form = pluralFormFor(n, language);
  return `points.${form}` as TranslationKey;
}
