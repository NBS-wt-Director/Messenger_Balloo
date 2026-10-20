# Тикет 1792311343 — Mobile: ArchiveScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311343)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API архива чатов.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/ArchiveScreen.tsx`
- Текущий код: `useState<ArchChat[]>([])`, `useEffect(() => {}, [])` — пустой
- API из web: `grep "api.*archive\|getArchived" packages/web/src/screens/`

## Подзадачи
- [x] 1. API: `api.getArchived(page?, limit?)` → `GET /api/archive`
- [x] 2. Импорт `api` добавлен
- [x] 3. Пустой `useEffect` → загрузка; маппинг `{ chats: [...] }` (`archiveService.ts:39`)
- [x] 4. loading + error + «Повторить», счётчик непрочитанных
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Проблемы и решения

Поля сервера: `id, name, lastMessage, lastMessageTime, unreadCount` → `lastMsg`, `time`, `unread`.

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
