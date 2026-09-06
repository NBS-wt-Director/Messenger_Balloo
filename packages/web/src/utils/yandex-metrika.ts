/**
 * yandex-metrika.ts — утилита lazy-load Яндекс.Метрики (consent-based).
 *
 * Принципы (152-ФЗ):
 * - Метрика НЕ загружается, пока пользователь не дал согласие в CookieBanner
 *   («Принять все»). При выборе «Только необходимые» скрипт не подключается.
 * - Анонимизация IP: параметр `ip: true` в init — IP усекается на стороне Яндекса.
 * - Cookie Метрики (_ym_uid, _ym_isad, _ym_d) ставятся только после загрузки скрипта.
 * - ID счётчика передаётся через env: VITE_YM_METRIKA_ID (см. .env.example).
 */

const METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js';

type YmQueue = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: YmQueue;
    yaCounter?: Record<string, unknown>;
    // Флаг, что слушатели history уже установлены
    __ballooMetrikaHistoryHooked?: boolean;
  }
}

let counterId: number | null = null;
let loadPromise: Promise<void> | null = null;

/** Читает ID счётчика из env. Возвращает null, если не задан/некорректен. */
export function getMetrikaId(): number | null {
  const raw = import.meta.env.VITE_YM_METRIKA_ID as string | undefined;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Загружен ли скрипт Метрики (счётчик инициализирован). */
export function isMetrikaLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.ym === 'function' && counterId !== null;
}

/**
 * Загружает скрипт Метрики и инициализирует счётчик.
 * Вызывается ТОЛЬКО после согласия на аналитические cookie (CookieBanner → «Принять все»)
 * либо при старте приложения, если согласие уже дано ранее.
 * Идемпотентна: повторные вызовы не дублируют скрипт.
 */
export function initYandexMetrika(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const id = getMetrikaId();
  if (!id) {
    // Ключ не настроен — Метрика просто не подключается (dev / ключ не выдан)
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  counterId = id;
  loadPromise = new Promise<void>((resolve) => {
    // Стандартный сниппет Метрики: очередь ym(...) до загрузки tag.js
    const ym: YmQueue =
      window.ym ||
      function (...args: unknown[]) {
        (ym.a = ym.a || []).push(args);
      };
    ym.a = ym.a || [];
    ym.l = Date.now();
    window.ym = ym;

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${METRIKA_SRC}"]`);

    const init = () => {
      window.ym!(counterId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: false,
        // Анонимизация IP (требование 152-ФЗ)
        ip: true,
      });
      hookHistoryTracking();
      resolve();
    };

    if (existing) {
      // Скрипт уже есть на странице (например, добавлен ранее) — ждём его загрузки
      if (existing.dataset.loaded === 'true') {
        init();
      } else {
        existing.addEventListener('load', init, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = METRIKA_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      init();
    };
    script.onerror = () => {
      // Ошибка загрузки (сеть/блокировщик) — не ломаем приложение
      console.warn('[metrika] failed to load script');
      resolve();
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Отправить hit при смене маршрута (для SPA). */
export function trackPageview(path: string): void {
  if (!isMetrikaLoaded() || !counterId) return;
  try {
    window.ym!(counterId, 'hit', path);
  } catch {
    // не критично
  }
}

/**
 * Слежение за сменой маршрута в SPA: патчим pushState/replaceState + popstate.
 * Устанавливается один раз после инициализации Метрики.
 */
function hookHistoryTracking(): void {
  if (window.__ballooMetrikaHistoryHooked) return;
  window.__ballooMetrikaHistoryHooked = true;

  const send = () => trackPageview(window.location.pathname + window.location.search);

  const wrap = (name: 'pushState' | 'replaceState') => {
    const original = history[name].bind(history);
    history[name] = function (...args: Parameters<History['pushState']>) {
      const result = original(...args);
      send();
      return result;
    } as typeof history.pushState;
  };

  wrap('pushState');
  wrap('replaceState');
  window.addEventListener('popstate', send);
}
