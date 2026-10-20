# Тикет 1792311345 — Mobile: MediaViewerScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311345)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API просмотра медиа.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/MediaViewerScreen.tsx`
- Текущий код: `const items: MediaItem[] = route?.params?.items || []` — данные приходят через params, нет загрузки по ID
- API из web: `grep "api.*media\|getMedia" packages/web/src/`

## Подзадачи
- [x] 1. API: `api.getChatAttachments(chatId, 'media')` (медиа-вкладка = image+video, `messageService.ts:722`)
- [x] 2. Импорт `api` добавлен
- [x] 3. Если `items` не переданы через params, но передан `chatId` — галерея грузится с сервера
- [x] 4. loading + текст ошибки вместо «Нет медиа»; счётчик показывается только при непустой галерее
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов
- build зелёный

## Проблемы и решения

Основной путь (открытие из чата с готовым списком) сохранён без регресса:
запрос уходит только при пустом `items`.

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
