# Тикет 1794831100 — Браузерный push + refresh-токены (объединено)

**Создан:** 16.11.2026 17:12 (unix 1794831100)
**Статус:** в работе
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
- [ ] B.2 Решение: вариант **(а)** — миграция `familyId` → `@db.VarChar(64)`
      (рекомендация записана в `1794769900`; формат `familyId` в JWT не меняется).
- [ ] B.3 Миграция + `prisma generate`; прогон миграций на локальной прод-подобной
      БД (порядок — `tickets/Done/2026-11-05/1793564758.md`).
- [ ] B.4 Тест: после `POST /api/auth/login` в `refresh_tokens` есть строка с `jti`
      из выданного refresh-токена и `familyId` длиной 36.
- [ ] B.5 Тест отзыва: отзыв по `familyId` гасит все строки семьи; вход с отозванным
      refresh → 401.
- [ ] B.6 Доказательство красноты тестов B.4–B.5 без миграции (git stash / откат
      schema) — иначе тест фиктивный (§0.1 п.4 AGENTS.md).

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

- [ ] A.1 `main.tsx`: включить регистрацию SW (условие: не dev-хост, чтобы не
      кэшировать hot-reload).
- [ ] A.2 Вызвать `subscribeToPushNotifications()` после входа + POST подписки на
      сервер.
- [ ] A.3 Сервер: `POST /api/devices/browser-push` (authRequired) →
      `saveBrowserPushSubscription`; идемпотентность по `endpoint`
      (`@@unique([userId, endpoint])` + миграция, либо upsert в сервисе).
- [ ] A.4 Сервер: вызов `sendVapidPushToUsers` при новом сообщении **только** для
      получателей без активного WS-соединения (данные в room-manager) — чтобы push
      не дублировал in-app.
- [ ] A.5 Тесты: сервер — контроллер browser-push (201/401/400); web — subscribe
      вызывается после логина (jsdom mock `pushManager`).
- [ ] A.6 `pnpm --filter @balloo/server test`, `pnpm --filter @balloo/web test`,
      `pnpm build` зелёные (прогоны **последовательно** — общая тестовая БД,
      `max_connections=100`); `applicationServerKey` найден grep'ом в `packages/web/dist`.

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

(заполняется по мере выполнения)
