# Отложено 1795343620 — Настройка лимитов запросов из админки (mvp2)

**trigger:** начало mvp2
**Отложено:** 2026-11-22 по решению владельца («mvp2»)
**Источник:** обсуждение тикета `tickets/active/1795343610-rate-limits-per-client.md`

## Что отложено

Сделать значения лимитов запросов редактируемыми из админ-панели
(`admin.balloo.su`), а не зашитыми в код.

Сейчас (`middleware/rateLimit.ts`) лимиты — константы: 6 лимитеров
(api/auth/message/upload/service/oauth) × `RATE_LIMIT_MAX = 3000` за
`RATE_LIMIT_WINDOW_MS = 15 мин`, ключ «на каждого» (userId/IP).

## Что нужно сделать (при возврате)

1. **Хранение** — таблица настроек в БД (например, `SystemSetting` ключ→JSON
   или отдельная `RateLimitConfig`) + миграция в `packages/shared/prisma/migrations`.
   Общей таблицы настроек в схеме нет; рабочий образец «настройка из админки в
   БД» — только `PaymentConfig` (`packages/shared/prisma/schema.prisma:1013`).
2. **Сервер** — `GET/PUT /api/admin/settings/rate-limits`
   (`authRequired + adminOnly`, по образцу `routes/payments.ts:44-48`).
   Применение без перезапуска: `express-rate-limit` поддерживает динамический
   `limit` (функция). Для смены **окна** — пересборка лимитеров со сбросом
   счётчиков при сохранении.
3. **Админка** — экран/секция. `packages/web-admin/src/screens/SystemSettingsScreen.tsx`
   сейчас чистый мок (maintenance mode в `useState`, ENV — хардкод), реальных
   настроек не читает и не пишет. Либо расширить его, либо завести отдельный
   пункт меню «Лимиты» (`AdminLayout.tsx` NAV_ITEMS).
4. **Тесты** — покрытие нового эндпоинта и чтения настроек лимитерами.

## Открытые вопросы (решить при возврате)

- Меняется ли вместе с лимитом окно (сейчас 15 мин) или только число запросов.
- Что делать с nginx `limit_req` (`docker/prod/nginx/nginx-production.conf`:
  `auth 5r/m`, `api 30r/s`) — админка их менять не сможет, только express-лимитеры.

## Триггер и порядок возврата

Наступит «начало mvp2» → `git mv` в `tickets/active/`, шапка `status: active`,
проектирование по порядку `AGENTS.md`: функция → узел → ситуации → экраны →
эндпоинты/компоненты → сущности.
