# исправить: rate limit не покрывает refresh и logout

**Слой:** 4 (доступ к действиям) / перебор. **Найдено:** 08.10.2026, аудит по сессии.

## Что найдено

`packages/server/src/app.ts:169-172` — лимит висит только на
`/api/auth/login|register|forgot-password|reset-password`.
`/api/auth/refresh` и `/api/auth/logout` — без лимита.

## Риск

Бесплатный брутфорс refresh-строк (30 суток живучести, см.
`исправить-отзыв-refresh-токенов.md`) и мусорные вызовы logout без ограничения.

## Что сделать

Добавить `/api/auth/refresh` в ту же группу лимита (или отдельную, по IP+user,
например 30/мин), logout — мягкий лимит.

## Как проверить

Тест: 31-й запрос refresh за минуту → 429. `pnpm -F server test`.

## Закрыт 09.10.2026 — неактуален (проверено по коду, Ksyusha)

- `packages/server/src/app.ts` = 125 строк, указанной строки 169-172 в файле нет
  (`wc -l packages/server/src/app.ts`).
- Лимитер монтируется глобально: `app.ts:44` `app.use(applyRateLimit)`.
- `packages/server/src/middleware/rateLimit.ts:111-112` — ветка
  `req.path.startsWith('/api/auth/')` -> `authLimiter` (5/мин, `:31-33`).
  В неё попадают `refresh`, `refresh-cookie`, `logout`, `clear-cookie` —
  все маршруты `packages/server/src/routes/auth.ts:46-55`.

Требуемое «добавить /api/auth/refresh в группу лимита» уже выполняется кодом.
