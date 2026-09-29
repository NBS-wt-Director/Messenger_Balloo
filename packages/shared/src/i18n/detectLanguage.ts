// Определение языка интерфейса по списку тегов браузера.
//
// Чистая функция (без navigator/document): вызывающий код сам решает, откуда
// брать теги, — так это работает и в браузере, и в тестах, и в SSR.
//
// Коды берём из LANGUAGES (constants/languages.ts) — одного источника истины
// для списка поддерживаемых языков.

import { LANGUAGE_CODES } from '../constants/languages';

/**
 * Теги BCP-47, которые браузеры отдают вместо кодов из LANGUAGES.
 *
 * Замечание по украинскому: контракт (mockups/data_schema.json →
 * conventions.languages) требует код 'uk', он же в LANGUAGES и в словаре,
 * поэтому алиас для 'uk' больше не нужен. Пустая таблица оставлена намеренно —
 * через неё добавляются будущие расхождения тега браузера и кода контракта.
 */
const TAG_ALIASES: Record<string, string> = {};

/** Поддерживается ли код языком интерфейса. */
export function isSupportedLanguageCode(code: string): boolean {
  return (LANGUAGE_CODES as string[]).includes(code);
}

/**
 * Тег → код из LANGUAGE_CODES, либо null.
 *
 * 'ru-RU' → 'ru', 'en-US' → 'en', 'zh-Hans' → 'zh', 'uk-UA' → 'uk'.
 * Регистр и разделитель ('-' / '_') не важны.
 */
export function normalizeLanguageTag(tag: string): string | null {
  if (typeof tag !== 'string') return null;

  const trimmed = tag.trim().toLowerCase().replace(/_/g, '-');
  if (!trimmed) return null;

  if (isSupportedLanguageCode(trimmed)) return trimmed;

  const alias = TAG_ALIASES[trimmed];
  if (alias && isSupportedLanguageCode(alias)) return alias;

  const base = trimmed.split('-')[0];
  if (isSupportedLanguageCode(base)) return base;

  const baseAlias = TAG_ALIASES[base];
  if (baseAlias && isSupportedLanguageCode(baseAlias)) return baseAlias;

  return null;
}

/**
 * Первый распознанный язык из списка (порядок = приоритет, как в
 * navigator.languages). null — если ни один тег не поддерживается.
 */
export function detectLanguage(tags: readonly string[] | undefined | null): string | null {
  if (!tags || tags.length === 0) return null;

  for (const tag of tags) {
    const code = normalizeLanguageTag(tag);
    if (code) return code;
  }

  return null;
}
