// Тесты самовосстановления после деплоя (тик. 1795292000).
// Проверяем: событие vite:preloadError → перезагрузка; кулдаун против цикла.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installPreloadErrorGuard } from '@/utils/preloadErrorGuard';

/** Фейковое окно: подписки на события, sessionStorage и reload — под контролем. */
function makeWindow(storageThrows = false) {
  const listeners = new Map<string, EventListener[]>();
  const store = new Map<string, string>();
  const win = {
    addEventListener: (type: string, fn: EventListener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
    sessionStorage: {
      getItem: (k: string) => {
        if (storageThrows) throw new Error('storage disabled');
        return store.get(k) ?? null;
      },
      setItem: (k: string, v: string) => {
        if (storageThrows) throw new Error('storage disabled');
        store.set(k, v);
      },
    },
    location: { reload: vi.fn() },
  };
  const dispatch = (type: string) =>
    (listeners.get(type) ?? []).forEach((fn) => fn(new Event(type)));
  return { win: win as unknown as Window, dispatch, reload: win.location.reload };
}

describe('installPreloadErrorGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('перезагружает вкладку по событию vite:preloadError', () => {
    const { win, dispatch, reload } = makeWindow();
    installPreloadErrorGuard(win);

    dispatch('vite:preloadError');

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('не перезагружает повторно в пределах кулдауна (защита от цикла)', () => {
    const { win, dispatch, reload } = makeWindow();
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    installPreloadErrorGuard(win);

    dispatch('vite:preloadError');
    expect(reload).toHaveBeenCalledTimes(1);

    // Через 3 секунды — всё ещё в кулдауне (10 с)
    now.mockReturnValue(1_003_000);
    dispatch('vite:preloadError');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('перезагружает снова после истечения кулдауна (новый деплой)', () => {
    const { win, dispatch, reload } = makeWindow();
    const now = vi.spyOn(Date, 'now').mockReturnValue(2_000_000);
    installPreloadErrorGuard(win);

    dispatch('vite:preloadError');
    now.mockReturnValue(2_020_000); // +20 с
    dispatch('vite:preloadError');

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('перезагружает, даже если sessionStorage недоступен', () => {
    const { win, dispatch, reload } = makeWindow(true);
    installPreloadErrorGuard(win);

    dispatch('vite:preloadError');

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
