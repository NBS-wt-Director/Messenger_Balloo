// Самовосстановление после деплоя в открытой вкладке (тик. 1795292000).
//
// Сценарий сбоя: вкладка получила index.html прежней сборки (например,
// Service Worker отдал кэш в момент перезапуска контейнера), index.js тянет
// динамический импорт экрана — а чанк старой сборки с сервера уже удалён.
// Итог: «Failed to fetch dynamically imported module» → ErrorBoundary
// «Что-то пошло не так», и без перезагрузки экран не восстанавливается.
//
// Vite при ошибке динамического импорта шлёт на window событие
// `vite:preloadError`. Перезагружаем вкладку — она получает свежий index.html
// и актуальные чанки. Кулдаун защищает от цикла перезагрузок, если чанк
// отсутствует по-настоящему (тогда показываем ErrorBoundary как раньше).

/** Метка времени последней авто-перезагрузки (sessionStorage). */
const RELOAD_KEY = 'balloo:preload-reload-at';

/** Не перезагружаем чаще одного раза в 10 секунд — защита от цикла. */
const RELOAD_COOLDOWN_MS = 10_000;

export function installPreloadErrorGuard(win: Window = window): void {
  win.addEventListener('vite:preloadError', () => {
    try {
      const last = Number(win.sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
      win.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // sessionStorage недоступен (приватный режим) — перезагружаем один раз
    }
    win.location.reload();
  });
}
