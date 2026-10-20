# Тикет 1792311340 — Mobile: ChatAttachmentsScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311340)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API вложений чата.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/ChatAttachmentsScreen.tsx`
- Текущий код: `attachments: Record<Tab, Att[]> = { images: [], ... }` — статические данные
- API из web: `grep "api.*attachments\|getChatFiles" packages/web/src/screens/chat-attachments/`

## Подзадачи
- [x] 1. API: `api.getChatAttachments(chatId, type)` → `GET /api/chats/:id/attachments?type=`
- [x] 2. Импорт `api` добавлен
- [x] 3. Статический `attachments: Record<Tab, Att[]>` заменён на загрузку по вкладке
- [x] 4. loading + error + «Повторить»
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Проблемы и решения

Вкладка «Ссылки» заведомо пуста: на сервере `links` не хранятся в таблице вложений
(`messageService.ts:727`), запрос уходит и возвращает `[]`.
Размер (`size` в байтах) форматируется в Б/КБ/МБ, дата берётся из `createdAt`.

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ cd packages/mobile-android && ./node_modules/.bin/tsc --noEmit --pretty false
0 ошибок (до правок в пакете — 77 строк ошибок)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)

$ pnpm --filter @balloo/desktop build
✓ built (tsc && vite build)

$ python3 scripts/api-endpoints-check.py
Клиентских путей: 184 / Серверных маршрутов: 250 / НЕ СОВПАДАЕТ: 18 (группа B, ждёт владельца)
```

Не проверялось: реальный прогон экранов в браузере/эмуляторе (нет запущенного
бэкенда с БД и нет Android-устройства на этой машине) — см. AGENTS.md §1.
