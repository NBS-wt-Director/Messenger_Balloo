# Тикет 1792311353 — Desktop: DesktopOverviewScreen — проверить UI

**Создан:** 18.10.2026 (unix 1792311353)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
DesktopOverviewScreen — статический экран. Проверить что UI корректный (без API).

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopOverviewScreen.tsx` (90 строк)
- Текущий код: показывает platform, arch, version через electronAPI
- API: не требуется (статические данные системы)

## Подзадачи
- [x] 1. `electronAPI.arch()` не вызывался напрямую: экран зовёт
      `api.system.arch()` (`DesktopOverviewScreen.tsx:23`) — такой метод в preload ЕСТЬ:
      `preload.ts:44` (`system.arch → ipcRenderer.invoke('system:arch')`), обработчик
      `main.ts:383` (`ipcMain.handle('system:arch', () => process.arch)`). Цепочка полная.
- [x] 2. UI сверен с `mockups/desktop/overview.md` — см. расхождение ниже
- [x] 3. `pnpm --filter @balloo/desktop build` — зелёный

## Критерии готовности
- UI корректный
- build зелёный


## Проблемы и решения

- Экраны `packages/desktop/src/renderer/src/screens/*` экспортируются только из
  `screens/index.ts` и **нигде не монтируются**: `DesktopApp.tsx` рендерит
  `router` из `@balloo/web/router`, собственных роутов у desktop-пакета нет
  (`grep -rn "Route|createHashRouter" packages/desktop/src/renderer/src/*.tsx`
  даёт только `RouterProvider router={router}`). Поэтому правки этого тикета
  видны в сборке и типах, но в интерфейсе приложения экран пока не открывается —
  для показа нужен роут (отдельная задача, не входила в тикет).

- Расхождение с макетом (фиксирую, не чиню в этом тикете): `mockups/desktop/overview.md`
  описывает **обёртку окна** с sidebar чатов (320px), списком из 4 чатов, областью
  сообщений и statusbar. Реализованный `DesktopOverviewScreen` — карточка системы
  (платформа / версия / архитектура). Функционально обёртку окна выполняет
  `DesktopLayout` + `DesktopTitlebar` + web-роутер, то есть содержимое макета в
  приложении есть, но не на этом экране.

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ pnpm --filter @balloo/desktop build        # tsc && vite build
✓ built (main.js 7.06 kB, preload.js 1.44 kB)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)
```

Не проверялось: запуск Electron-окна (на этой машине GUI-сессия приложения не
поднималась) — см. AGENTS.md §1.
