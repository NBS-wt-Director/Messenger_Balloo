# Тикет 1792311357 — Desktop: DesktopNotificationSettingsScreen — проверить UI

**Создан:** 18.10.2026 (unix 1792311357)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
DesktopNotificationSettingsScreen — локальные настройки. UI без API.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopNotificationSettingsScreen.tsx` (66 строк)
- Текущий код: локальные useState, нет API
- API: не требуется

## Подзадачи
- [x] 1. UI сверен с `mockups/desktop/notification-settings.md` — см. расхождение ниже
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

- Расхождение с макетом: макет задаёт sidebar из 8 разделов уведомлений
  (Общие, Каналы, Чаты, Не беспокоить, Звуки, Превью, Системная интеграция,
  Отложенные) + titlebar и системные кнопки. В экране все группы идут одним
  списком без sidebar, раздела «Отложенные» нет, значения живут только в
  `useState` и не сохраняются.

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
