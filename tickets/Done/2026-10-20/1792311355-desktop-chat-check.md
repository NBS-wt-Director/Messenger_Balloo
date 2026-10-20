# Тикет 1792311355 — Desktop: DesktopChatScreen — проверить обёртку

**Создан:** 18.10.2026 (unix 1792311355)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
DesktopChatScreen — обёртка ChatView. Проверить что контент рендерится корректно.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopChatScreen.tsx` (46 строк)
- Текущий код: показывает placeholder "Выберите чат", нет реального ChatView
- API: ChatViewScreen из web роутера

## Подзадачи
- [x] 1. `ChatViewScreen` доступен через роутер web-пакета:
      `packages/web/src/router/index.tsx:508,512` (lazy-импорт строка 35);
      desktop рендерит именно этот роутер (`DesktopApp.tsx:6,18`)
- [~] 2. Вопрос «обёртка или ChatView напрямую» закрыт в пользу «напрямую»:
      `DesktopChatScreen` в приложении не используется (см. «Проблемы и решения»),
      контент чата отдаёт web `ChatViewScreen`. Окончательное решение о судьбе
      файла (удалить как мёртвый код или подключать) — за владельцем
- [x] 3. `pnpm --filter @balloo/desktop build` — зелёный

## Критерии готовности
- ChatView рендерится
- build зелёный


## Проблемы и решения

- Экраны `packages/desktop/src/renderer/src/screens/*` экспортируются только из
  `screens/index.ts` и **нигде не монтируются**: `DesktopApp.tsx` рендерит
  `router` из `@balloo/web/router`, собственных роутов у desktop-пакета нет
  (`grep -rn "Route|createHashRouter" packages/desktop/src/renderer/src/*.tsx`
  даёт только `RouterProvider router={router}`). Поэтому правки этого тикета
  видны в сборке и типах, но в интерфейсе приложения экран пока не открывается —
  для показа нужен роут (отдельная задача, не входила в тикет).

- В файле 46 строк: toolbar с состоянием фокуса окна и заглушка «Выберите чат из
  списка слева». Реального `ChatView` внутри нет и быть не может — sidebar и
  контент рисует web-роутер. То есть экран сейчас — мёртвый код.

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
