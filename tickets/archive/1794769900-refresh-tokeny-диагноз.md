# Тикет 1794769900 — refresh-токены не сохраняются: family-revocation (А-02) не работает никогда

**Создан:** 16.11.2026 00:09 (unix 1794769900)
**Статус:** объединён в `tickets/active/1794831100-browserpush-i-refresh-tokeny.md`
(часть B) решением владельца 16.11.2026 — **не выполнять отдельно**, файл оставлен
как источник диагноза
**Источник запроса:** лог локального сервера во время приёмки «два окна» (`1794769745`)

## Цель

Заставить `refresh_tokens` реально писаться, чтобы отзыв семьи refresh-токенов
(требование А-02) работал, а не молча падал в `try/catch`.

## Диагноз (доказан исполнением, не чтением)

Логи сервера при каждом входе (`/tmp/balloo-server.log`, 15–16.11.2026):

```
[auth] Failed to persist refresh token to DB:
Invalid `prisma.refreshToken.create()` invocation in
packages/server/src/services/authService.ts:94:31
→ 94   await prisma.refreshToken.create(
The provided value for the column is too long for the column's type. Column: (not available)
```

Причина:

| Что | Значение |
|---|---|
| `authService.ts:89` | `const fid = familyId \|\| crypto.randomUUID()` → **36 символов** |
| `packages/shared/prisma/schema.prisma:1338` | `familyId String @db.VarChar(25)` |

36 > 25 → Postgres отвергает вставку. Ошибка проглочена `try/catch` с
`console.warn`, поэтому вход выглядит успешным.

**Следствие:** в таблицу `refresh_tokens` не записывается ни одна строка →
`family-revocation` (отзыв всех токенов семьи при компрометации) не срабатывает
никогда. Проверить можно так: после любого входа `SELECT count(*) FROM refresh_tokens`
не растёт.

## Подзадачи

- [x] 1. Подтвердить пустоту таблицы на живой БД (16.11.2026 00:12):
      ```
      $ PGPASSWORD=balloo123 psql -h localhost -U balloo -d balloo -tAc \
          "select count(*) from refresh_tokens;"
      0
      $ ... "select count(*) from users;"
      81550
      ```
      0 строк при 81 550 пользователей и десятках входов этой ночью — таблица
      не заполнялась никогда.
- [ ] 2. Выбрать вариант и записать решение:
      (а) миграция `familyId` → `@db.VarChar(64)` (uuid-совместимо, чинит причину);
      (б) генерировать короткий familyId (cuid, 25) — чинит без миграции, но
      трогает формат токенов;
      рекомендация — (а), формат `familyId` в JWT остаётся прежним.
- [ ] 3. Миграция + `prisma generate`; прогон миграций на прод-подобной БД
      (см. порядок в `Done/2026-11-05/1793564758.md`).
- [ ] 4. Тест: после `POST /api/auth/login` в `refresh_tokens` есть строка с
      `jti` из выданного refresh-токена и `familyId` длиной 36.
- [ ] 5. Тест отзыва: отзыв по `familyId` гасит все строки семьи, вход с
      отозванным refresh → 401.
- [ ] 6. `pnpm --filter @balloo/server test` и `pnpm build` зелёные (прогоны
      последовательно — общая тестовая БД, `max_connections=100`).

## Критерии готовности

- `console.warn('[auth] Failed to persist refresh token…')` исчезает из логов.
- `refresh_tokens` содержит строку на каждый выданный refresh-токен.
- Тесты 4–5 зелёные и краснеют без миграции (доказательство вывода прогона).

## Проблемы и решения

- Правка — миграция схемы, а не точечная: в прод-контейнере миграции применяются
  на старте сервера, поэтому нужен отдельный батч владельца и проверка
  `finished/failed` из лога (порядок — `1793564758`).
- В этот тикет не входит: пересборка `server`/`web` для приёмки «два окна»
  (`1794769745`) — её блокировать не должно, дефект на доставку сообщений не влияет.

## Результат

(заполняется по мере выполнения)
