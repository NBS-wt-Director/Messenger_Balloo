# Тикет 1792311341 — Mobile: ReportMessageScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311341)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API отправки жалобы.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/ReportMessageScreen.tsx`
- Текущий код: `setSubmitted(true)` — фейк, нет API
- API из web: `grep "api.*report\|createReport" packages/web/src/screens/report-message/`

## Подзадачи
- [x] 1. API: `api.createReport({ messageId, reportedUserId, chatId, reason, comment })` → `POST /api/reports`
- [x] 2. Импорт `api` добавлен
- [x] 3. `setSubmitted(true)` заменён на API-вызов, экран успеха — только после 201
- [x] 4. loading + инлайн-ошибка
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Проблемы и решения

Важно: список причин переведён на коды сервера. Экран отправлял русские подписи
(«Спам», «Домогательство» …), сервер принимает только `VALID_REASONS`
(`reportService.ts:9`: spam, harassment, hate_speech, violence, pornography,
copyright, other) и иначе отвечает 400 «Неверная причина жалобы».

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
