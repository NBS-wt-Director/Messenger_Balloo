// Автоопределение языка при старте: настройки браузера → useUIStore.language.
// Стор создаётся при импорте, поэтому каждый кейс — со сброшенными модулями.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LANGUAGE_COOKIE } from '@/utils/cookieUtils';

async function languageForBrowser(languages: string[], cookie?: string): Promise<string> {
  Object.defineProperty(window.navigator, 'languages', {
    value: languages,
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'language', {
    value: languages[0] ?? 'en-US',
    configurable: true,
  });

  document.cookie = cookie
    ? `${LANGUAGE_COOKIE}=${cookie};path=/`
    : `${LANGUAGE_COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  vi.resetModules();
  const { useUIStore } = await import('@balloo/ui');
  return useUIStore.getState().language;
}

afterEach(() => {
  document.cookie = `${LANGUAGE_COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
});

describe('автоопределение языка (@balloo/ui getInitialLanguage)', () => {
  it('английский браузер → en', async () => {
    expect(await languageForBrowser(['en-US'])).toBe('en');
  });

  it('татарский браузер получает татарский, а не английский', async () => {
    expect(await languageForBrowser(['tt-RU', 'ru-RU'])).toBe('tt');
  });

  it('украинский тег браузера (uk) совпадает с кодом контракта (uk)', async () => {
    expect(await languageForBrowser(['uk-UA'])).toBe('uk');
  });

  it('из navigator.languages берётся первый поддерживаемый', async () => {
    expect(await languageForBrowser(['de-DE', 'fr-FR', 'ru-RU'])).toBe('fr');
  });

  it('неподдерживаемые языки → запасной en', async () => {
    expect(await languageForBrowser(['de-DE', 'nl-NL'])).toBe('en');
  });

  it('сохранённый выбор пользователя важнее браузера', async () => {
    expect(await languageForBrowser(['de-DE'], 'ba')).toBe('ba');
  });

  it('мусор в cookie не ломает язык — определяем по браузеру', async () => {
    expect(await languageForBrowser(['sah'], 'klingon')).toBe('sah');
  });
});
