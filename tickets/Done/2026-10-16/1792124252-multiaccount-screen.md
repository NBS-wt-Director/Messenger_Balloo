# Тикет 1792124252 — Экран «Мультиаккаунт» (приёмка 1.1.9 → 6.33)

**Создан:** 16.10.2026 (unix 1792124252)
**Статус:** готов
**Источник запроса:** приёмка владельца 1.1.9 (16.10.2026) + правило 21

## Цель

Реализовать экран `1_01_22` «Мультиаккаунт» по принятому макету
`mockups/balloo-su/accounts.html` (задание — создать `mockups/balloo-su/accounts.md`
по образцу, если отсутствует): список аккаунтов пользователя, переключение,
добавление аккаунта.

## Живое состояние на момент создания (проверено командами)

- Веб: экрана нет, маршрута нет — `grep -n "accounts" packages/web/src/router/index.tsx`
  → пусто; `ls packages/web/src/screens/` — профиля-под-мультиаккаунт нет;
- API-клиент: `grep "accounts" packages/web/src/services/api.ts` → пусто;
- Сервер: роута `accounts` нет — `ls packages/server/src/routes/` (есть только
  `devices.ts`);
- Схема данных (`mockups/data_schema.json`, группы→tables): таблицы
  `accounts` (поля: id, userId, provider, providerAccountId, refresh_token,
  access_token, expires_at, token_type, scope), `devices`,
  `account_device_links` — ЕСТЬ.

## Подзадачи

- [ ] 1. Прочитать макет `mockups/balloo-su/accounts.html`; создать/прочитать
      `mockups/balloo-su/accounts.md` (если нет — создать по шаблону архива).
- [ ] 2. Спроектировать серверную часть по схеме `accounts`: роут
      `packages/server/src/routes/accounts.ts` (GET список, POST добавить,
      DELETE отключить) + controller + service; подключить в `routes/index.ts`.
      Проверка: jest-тест роута зелёный.
- [ ] 3. API-клиент: добавить `accounts` в `packages/web/src/services/api.ts`.
- [ ] 4. Экран `packages/web/src/screens/profile/AccountsScreen.tsx` по макету +
      маршрут в `router/index.tsx` (lazy, по образцу строки 24).
- [ ] 5. Тесты vitest (рендер списка, пустое состояние, вызовы API).
      Проверка: `pnpm --filter @balloo/web test`, `pnpm --filter @balloo/server test`.
- [ ] 6. `pnpm --filter @balloo/web build` → exit 0.

## Критерии готовности

- Экран доступен по маршруту, данные с реального API (не моки в компоненте);
- Тесты server + web зелёные, build exit 0;
- В «Результат» записаны выводы команд.

## Проблемы и решения (если возникли)

1. **Серверного роута аккаунтов не было, сущность в Prisma отсутствовала** — но
   `mockups/data_schema.json` уже содержит `account_device_links`
   (userId, deviceId, isActive, pushEnabled) → модель взята из схемы данных,
   ничего не выдумывается.
2. **`prisma migrate dev` потребовал reset БД**: в дев-БД дрейф
   (`refresh_tokens` FK) и зависшая миграция
   `20261010000000_add_missing_columns` (failed с 11.10, 0 применённых шагов).
   Reset отвергнут (губит дев-данные). Разбор: из объектов зависшей миграции в
   БД не хватало только таблицы `feedbacks` (+индексы/FK) и FK
   `reports_targetId_fkey`. Причина исходного падения найдена: 747 строк
   `reports.targetId` ссылаются на несуществующих пользователей (seed-мусор
   `chat-123` и т.п.). Решение: объекты созданы вручную идемпотентным SQL, FK
   reports добавлен `NOT VALID` (битые дев-строки не трогает), миграция
   помечена `migrate resolve --applied`, моя миграция применена
   `migrate deploy` (не проверяет дрейф) → «All migrations have been
   successfully applied».
3. **Web-аутентификация — одиночный httpOnly cookie** (`authStore.ts:3`,
   `setAuthCookies` в `middleware/auth.ts:314`). Переключение аккаунта
   реализуемо перевыпуском cookie через существующий `generateTokens` +
   `setAuthCookies` — без смены архитектуры cookies.

## Подзадачи (уточнённые по фактам)

- [x] 1. Прочитать макет `accounts.html` (194 строки) и `accounts.md` (97
      строк) — структура, API, WS-события, «сессии на устройстве».
- [x] 2a. Prisma-модель `AccountDeviceLink` (поля ровно из data_schema.json) +
      связь `User.accountDeviceLinks` + миграция
      `20261016000000_account_device_links` применена (`migrate deploy` →
      «All migrations have been successfully applied»), таблица проверена
      psql (7 колонок), `prisma generate` зелёный.
- [x] 2b. Сервис `accountsService.ts`: list по deviceId (+счётчики чатов/
      непрочитано через groupBy), switch (перевыпуск токенов цели через
      `generateTokens` + `setAuthCookies`, isActive-флаг), link-on-login upsert
      (по header `X-Device-Id`), remove (активный нельзя — 400), notifications
      toggle. Доказательство: jest 11/11 (ниже).
- [x] 2c. Роуты `routes/accounts.ts` + регистрация `/api/accounts` в
      `routes/index.ts`; хук `linkIfDeviceHeader` в 7 точках входа
      (register, login, verify2FA, yandex/vk/mailru callback, oauthLogin —
      `grep -c linkIfDeviceHeader(req → 7); `TokenPair` экспортирован.
- [x] 2d. Jest `accounts.test.ts` — 11 тестов (список/активность/400/403/401,
      switch+cookie/404/400, notifications/400, delete активного 400,
      delete неактивного). Полный сервер: **35 наборов, 627 тестов зелёные**.
- [!] 2e. Попутно найден и исправлен реальный баг (не выдуманный — 3 падения
      `desktop.test.ts` POST /api/reports → 500): миграция 20261010000000
      пыталась повесить FK `reports_targetId_fkey` на users для **полиморфного**
      `targetId` (user|message|chat|post) — из-за этого она и упала 11.10
      (747 seed-строк с targetId вне users), а мой временный FK NOT VALID
      (шаг 2a) сломал вставку репортов на сообщения/чаты. Решение: FK удалён из
      БД, миграция `20261016000100_drop_reports_target_fk` фиксирует это в
      истории, relation `ReportTarget` удалён из Prisma-модели (в запросах не
      использовался — проверено grep). После: 627/627 зелёные.
- [x] 3. Web: `packages/web/src/utils/deviceId.ts` (UUID в localStorage,
      формат сервера ^[A-Za-z0-9_-]{8,64}$); заголовок `X-Device-Id` в
      `api.ts:request` для всех запросов; методы `getAccounts`,
      `switchAccount`, `unlinkAccount`, `setAccountNotifications`; в CORS
      `allowedHeaders` добавлен `X-Device-Id` (иначе preflight с api.balloo.su
      падает).
- [x] 4. `packages/web/src/screens/profile/AccountsScreen.tsx` по макету
      (чипы переключения, статистика, карточка активного, карточки других,
      «Добавить аккаунт» → /login, обе инфо-карточки текстом из макета) +
      маршрут `/accounts` (lazy). Профиль: карточка «👥 Аккаунты» переведена на
      реальный `GET /api/accounts` (моки удалены), «Управлять →» и чипы ведут
      на `/accounts`, панель-заглушка удалена.
      Примечание: метрика «Контактов» из макета не выводится — сущности
      контактов в Prisma-схеме нет (проверено списком моделей), выдуманное
      число не показывается.
- [x] 5. Тесты `packages/web/src/__tests__/screens/accounts.test.tsx` — 5
      тестов зелёные (чипы/статистика, switch→setUser, PATCH уведомлений +
      смена иконки, отключение убирает карточку, ошибка API).
- [x] 6. Финальные прогоны 16.10.2026: `pnpm test` → **exit 0**
      (shared 4/76, server 35 наборов/627, web 26/229);
      `pnpm --filter @balloo/web build` → exit 0 (vite 7.51s).

## Проблемы и решения — дополнение

- Первый `pnpm test` после правок дал падение `ws-room.test.ts`
  (RoomManager.setTyping) при **параллельном** прогоне workspaces; изолированно
  25/25 зелёный и повторный полный прогон зелёный — тайминг-флук под нагрузкой,
  не регрессия этой задачи (ws-код не трогался). Записано как есть.

## Результат

Мультиаккаунт реализован end-to-end по принятому макету `1_01_22`:

**Сервер** (тесты 11 новых + 627 всего зелёные):
- `packages/shared/prisma/schema.prisma` — модель `AccountDeviceLink`
  (поля из `mockups/data_schema.json`) + миграции
  `20261016000000_account_device_links`,
  `20261016000100_drop_reports_target_fk` (применены, «All migrations have
  been successfully applied»);
- `services/accountsService.ts`, `controllers/accountsController.ts`,
  `routes/accounts.ts` (`/api/accounts`), хук привязки в 7 точках входа по
  `X-Device-Id`, CORS `X-Device-Id`;
- попутно исправлен реальный баг POST /api/reports → 500 (полиморфный
  `targetId` и неверный FK на users; см. 2e).

**Web** (тесты 5 новых + 229 всего зелёные, build exit 0):
- `utils/deviceId.ts`, `X-Device-Id` во всех запросах, 4 метода API;
- `screens/profile/AccountsScreen.tsx` + маршрут `/accounts`;
- `ProfileScreen`: реальный список аккаунтов вместо моков, вход на `/accounts`.

```text
$ pnpm test
packages/shared test:  Test Files  4 passed (4) / Tests  76 passed (76)
packages/server test: Test Suites: 35 passed / Tests: 627 passed
packages/web test:    Test Files  26 passed (26) / Tests  229 passed (229)
EXIT=0
```

Не сделано сознательно (зафиксировано): WS-события `account:switch/added/
removed/notification` и метка аккаунта в push (accounts.md §WebSocket/Push) —
это отдельная работа в WS-слое и push-рассылке, в тикет экрана не входила;
метрика «Контактов» — нет сущности.

