# Тикет 1792311350 — Desktop: DesktopChatAttachmentsScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311350)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API вложений чата.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopChatAttachmentsScreen.tsx` (126 строк)
- Текущий код: `useState<Attachment[]>([])` — пустой
- API из web: `grep "api.*attachments\|getChatFiles" packages/web/src/screens/chat-attachments/`

## Подзадачи
- [x] 1. API: `api.getChatAttachments(chatId, type)` → `GET /api/chats/:id/attachments?type=`
- [x] 2. Импорт `import { api } from '@balloo/web/services/api'`
- [x] 3. Моки из 4 строк (`photo_2026.jpg`, `document.pdf`, …) удалены; загрузка по
      вкладке, «Все» = `media` + `files` (отдельной вкладки «все» на сервере нет,
      `messageService.ts:721`)
- [x] 4. loading / error + «Повторить» / пустое состояние
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
