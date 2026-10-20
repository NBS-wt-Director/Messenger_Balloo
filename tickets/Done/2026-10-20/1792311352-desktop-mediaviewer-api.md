# Тикет 1792311352 — Desktop: DesktopMediaViewerScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311352)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API просмотра медиа.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopMediaViewerScreen.tsx` (198 строк)
- Текущий код: `useState<MediaItem[]>([])` — пустой
- API из web: `grep "api.*media\|getMedia" packages/web/src/`

## Подзадачи
- [x] 1. API: `api.getChatAttachments(chatId, 'media')` (image + video)
- [x] 2. Импорт `import { api } from '@balloo/web/services/api'`
- [x] 3. Проп `items` стал необязательным: при пустом списке и переданном `chatId`
      галерея грузится с сервера; синхронизация с `items` из пропсов сохранена
- [x] 4. Ошибка загрузки показывается вместо чёрного экрана (`if (!current) return null`
      больше не глушит сбой), кнопка «Повторить»
- [x] 5. `pnpm --filter @balloo/desktop build` — зелёный

## Критерии готовности
- API-вызов
- build зелёный


## Проблемы и решения

- Экраны `packages/desktop/src/renderer/src/screens/*` экспортируются только из
  `screens/index.ts` и **нигде не монтируются**: `DesktopApp.tsx` рендерит
  `router` из `@balloo/web/router`, собственных роутов у desktop-пакета нет
  (`grep -rn "Route|createHashRouter" packages/desktop/src/renderer/src/*.tsx`
  даёт только `RouterProvider router={router}`). Поэтому правки этого тикета
  видны в сборке и типах, но в интерфейсе приложения экран пока не открывается —
  для показа нужен роут (отдельная задача, не входила в тикет).

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
