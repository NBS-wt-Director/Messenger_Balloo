# Тикет 1792311354 — Desktop: DesktopModesScreen — проверить UI

**Создан:** 18.10.2026 (unix 1792311354)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
DesktopModesScreen — настройки режимов окна. Проверить UI (без API).

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopModesScreen.tsx` (86 строк)
- Текущий код: локальные настройки, нет API
- API: не требуется

## Подзадачи
- [x] 1. UI сверен с `mockups/desktop/modes.md` — см. расхождение ниже;
      вызов `electronAPI.presence.set(modeId)` подтверждён цепочкой
      `preload.ts:49` → `main.ts:386` (`ipcMain.on('presence:set', …)`)
- [x] 2. `pnpm --filter @balloo/desktop build` — зелёный

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

- Расхождение с макетом: `mockups/desktop/modes.md` описывает **режимы окна**
  (развёрнутый / компактный 380px / tray) с хоткеями `Ctrl+Shift+F`,
  `Ctrl+Shift+C`, `Alt+Space`. Реализованный `DesktopModesScreen` — переключатель
  **присутствия** (онлайн/отошёл/DND/невидимка/работа/на встрече). Это разные
  сущности: экран не реализует макет, а режимы окна в Electron-части не реализованы.

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
