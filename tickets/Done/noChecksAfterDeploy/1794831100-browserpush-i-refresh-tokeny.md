# Тикет 1794831100 — Браузерный push + refresh-токены (объединено)

**Создан:** 16.11.2026 17:12 (unix 1794831100)
**Статус:** готов (локально); после деплоя — пункты 7–8 в «Не входит»
**Источник запроса:** решение владельца 16.11.2026 (п.1 отчёта к уборке `6f76d00`):
«объедини и начни выполнение как приведёшь в исполнение остальные решения»
**Объединяет:** `1794740665` (браузерный push) и `1794769900` (refresh-токены) —
исходные файлы в `tickets/archive/`

## Цель

Два дефекта, из-за которых функции не работают **никогда** (с initial-коммита /
с момента появления схемы):

- **A. Браузерный push:** цепочка разорвана в четырёх местах — подписка не
  создаётся, сервер её не принимает, отправка не вызывается.
- **B. Refresh-токены:** `refresh_tokens` не заполняется → family-revocation
  (требование А-02) не срабатывает.

Порядок выполнения: **сначала B** (меньше кода, развязывает тесты входа), **затем A**.

---

## Часть B — refresh-токены (диагноз доказан исполнением)

Логи сервера при каждом входе (`/tmp/balloo-server.log`, 15–16.11.2026):

```
[auth] Failed to persist refresh token to DB:
Invalid `prisma.refreshToken.create()` invocation in
packages/server/src/services/authService.ts:94:31
The provided value for the column is too long for the column's type. Column: (not available)
```

| Что | Значение |
|---|---|
| `authService.ts:89` | `const fid = familyId \|\| crypto.randomUUID()` → **36 символов** |
| `packages/shared/prisma/schema.prisma` (`RefreshToken.familyId`) | `String @db.VarChar(25)` |

36 > 25 → Postgres отвергает вставку; ошибка проглочена `try/catch` +
`console.warn`, вход выглядит успешным.

- [x] B.1 Пустота таблицы на живой БД (замер 16.11 00:12): `count(refresh_tokens)=0`
      при `count(users)=81550`.
- [x] B.2 Решение: вариант **(а)** — миграция `familyId` → `@db.VarChar(64)`
      (рекомендация записана в `1794769900`; формат `familyId` в JWT не меняется).
      **Сделано 16.11:** `20261116000000_refresh_token_family_varchar64`.
- [x] B.3 Миграция + `prisma generate`; прогон миграций на локальной прод-подобной
      БД (порядок — `tickets/Done/2026-11-05/1793564758.md`).
      **Сделано 16.11:** applied на `balloo` и `balloo_migcheck` (чистая, 79
      таблиц, `migrate diff` exit 0); prisma generate OK.
- [x] B.4 Тест: после `POST /api/auth/login` в `refresh_tokens` есть строка с `jti`
      из выданного refresh-токена и `familyId` длиной 36.
      **Сделано:** `refresh-token-persist.test.ts` — PASS (familyId=36, jti, userId).
- [x] B.5 Тест отзыва: отзыв по `familyId` гасит все строки семьи; вход с отозванным
      refresh → 401.
      **Сделано:** PASS — reuse → all revoked → HTTP 401.
- [x] B.6 Доказательство красноты тестов B.4–B.5 без миграции (git stash / откат
      schema) — иначе тест фиктивный (§0.1 п.4 AGENTS.md).
      **Сделано 16.11:** ALTER → VARCHAR(25) → 3/3 FAIL (`Received: null`,
      `[auth] Failed to persist refresh token`); ALTER → VARCHAR(64) → 3/3 PASS.

**Критерий:** `console.warn('[auth] Failed to persist refresh token…')` исчез из
лога локального сервера; `refresh_tokens` непустая после входа.

---

## Часть A — браузерный push (диагноз по 4 точкам, замеры 14–15.11)

| # | Место | Факт | Чем доказано |
|---|---|---|---|
| 1 | `packages/web/src/main.tsx:16` | регистрация SW закомментирована с initial-коммита `ccb6f1e` | `grep -n serviceWorker packages/web/src/main.tsx` |
| 2 | `service-worker-registration.ts` `subscribeToPushNotifications()` | не вызывается нигде | `grep -rn subscribeToPushNotifications packages/web/src/` |
| 3 | Сервер | `saveBrowserPushSubscription` (pushService.ts:243) не вызывается ни одним роутом | `grep -rn saveBrowserPushSubscription packages/server/src/ \| grep -v pushService` → пусто |
| 4 | Сервер | `sendVapidPush`/`sendVapidPushToUsers` не вызываются из messageService/WS | `grep -rn sendVapidPush packages/server/src/ \| grep -v pushService \| grep -v __tests__` → пусто |

VAPID-ключей в prod-бандле нет **не** из-за env (цепочка env → compose → Dockerfile
исправна, `6e55590`), а потому что мёртвый код вырезан tree-shaking'ом.
In-app уведомления по WS (`1793791062`) работают — эту часть не трогать.

- [x] A.1 `main.tsx`: включить регистрацию SW (условие: не dev-хост, чтобы не
      кэшировать hot-reload).
      **Сделано 16.11:** hostname !== localhost/127.0.0.1 → register('/sw.js').
- [x] A.2 Вызвать `subscribeToPushNotifications()` после входа + POST подписки на
      сервер.
      **Сделано:** `subscribeAndRegisterPush(api.post)` — helper в
      service-worker-registration.ts; вызывается в AuthProvider после login,
      register и restoreSession.
- [x] A.3 Сервер: `POST /api/devices/browser-push` (authRequired) →
      `saveBrowserPushSubscription`; идемпотентность по `endpoint`
      (`@@unique([userId, endpoint])` + миграция, либо upsert в сервисе).
      **Сделано:** миграция `20261116000001` (unique index); upsert в pushService;
      контроллер+роут (POST/DELETE); порядок роутов исправлен (конкретный до `:id`).
- [x] A.4 Сервер: вызов `sendVapidPushToUsers` при новом сообщении **только** для
      получателей без активного WS-соединения (данные в room-manager) — чтобы push
      не дублировал in-app.
      **Сделано:** messageService.sendMessage — fire-and-forget после broadcast,
      фильтр `!roomManager.isUserOnline(id)`.
- [x] A.5 Тесты: сервер — контроллер browser-push (201/401/400); web — subscribe
      вызывается после логина (jsdom mock pushManager).
      **Сделано:** `browser-push.test.ts` 8/8 PASS; `push-subscribe.test.ts` 3/3 PASS.
- [x] A.6 `pnpm --filter @balloo/server test`, `pnpm --filter @balloo/web test`,
      `pnpm build` зелёные (прогоны **последовательно** — общая тестовая БД,
      `max_connections=100`); `applicationServerKey` найден grep'ом в `packages/web/dist`.
      **Сделано 16.11:** server 50/746; web 37/296; build 9 пакетов Done;
      `grep -c applicationServerKey dist/index-*.js` = 1.

**Критерии:** `applicationServerKey` ≥ 1 в собранном бандле; роут виден в
dump-routes; тесты зелёные и краснеют без правок.

---

## Не входит в тикет (после деплоя, `with_lord/together.md` п.5)

- Наружный маркер `applicationServerKey` в prod-бандле.
- Браузерная приёмка: разрешение → подписка в БД → сообщение при закрытой вкладке
  → системное уведомление; рост `refresh_tokens` после входа.
- Пересборка `server`+`web` (W-проход).

## Проблемы и решения

- У модели `PushSubscription` (`schema.prisma`) нет unique на `endpoint` → дубли
  подписок и двойные уведомления. Решение на A.3.
- Миграция B.3 на проде применяется на старте сервера → нужен отдельный батч
  владельца с проверкой `finished/failed` в логе (порядок `1793564758`).
- `VAPID_SUBJECT` в env присутствует, формат `mailto:` не проверялся — подтвердить
  прогоном отправки на A.4.

## Результат

**Коммит:** `5a3c675` (38 файлов, 1018 вставок).

### Часть B — refresh-токены

| Проверка | Вывод |
|---|---|
| Миграция applied (balloo) | `psql -tAc "select character_maximum_length ... familyId"` → **64** |
| Прод-подобный прогон (balloo_migcheck, чистая) | `migrate deploy` → `All migrations have been successfully applied`; **79 таблиц**, `migrate diff` exit 0 |
| Тесты B.4–B.5 | `jest refresh-token-persist` → **3/3 PASS** |
| B.6 (краснота без миграции) | ALTER→VARCHAR(25) → **3/3 FAIL** (`Received: null`); ALTER→VARCHAR(64) → 3/3 PASS |

### Часть A — браузерный push

| Проверка | Вывод |
|---|---|
| Сервер tsc --noEmit | 0 ошибок |
| `browser-push.test.ts` | **8/8 PASS** (401/400×3/201/upsert/DELETE 401/DELETE ok) |
| `push-subscribe.test.ts` (web) | **3/3 PASS** (prod→POST, localhost→skip, empty key→skip) |
| `pnpm --filter @balloo/server test` | 50 наборов, **746 тестов** зелёные |
| `pnpm --filter @balloo/web test` | 37 файлов, **296 тестов** зелёные |
| `pnpm build` (монорепо) | 9 пакетов Done, 0 ошибок |
| Маркер в dist | `grep -c applicationServerKey packages/web/dist/assets/index-*.js` → **1**; `browser-push` → **1** |
| Роуты | `POST /api/devices/browser-push` + `DELETE` зарегистрированы (между `/push-token` и `/:id`) |

### Не подтверждено (ждёт W-прохода)

- `applicationServerKey` в **prod**-бандле (наружный замер после деплоя).
- Браузерная приёмка: разрешение → подписка в БД → тестовое сообщение при
  закрытой вкладке → системное уведомление.
- Рост `refresh_tokens` на проде после входа (миграция применится при старте
  сервера — проверка `finished/failed` в логе).
