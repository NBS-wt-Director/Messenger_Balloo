# 1795343610 — Лимиты запросов: 3000/15мин и ключ «на каждого свой»

## Симптом (со слов владельца + read-only прод)

После последнего деплоя при холодном обновлении вкладку выбрасывает на экран входа,
вход через Яндекс «возвращает обратно без уведомлений», а после полного обновления
на секунду виден интерфейс и затем — снова регистрация.

Замер прода (`curl`, read-only):

```text
POST https://api.balloo.su/api/auth/refresh-cookie → HTTP/2 429
ratelimit-policy: 100;w=900
ratelimit-limit: 100
ratelimit-remaining: 0
retry-after: 506
{"error":"Слишком много запросов, попробуйте позже"}
```

## Причина

1. **`trust proxy` не задан** (`packages/server/src/index.ts`, `app.ts`). nginx шлёт
   `X-Forwarded-For` (`docker/prod/nginx/balloo-docker.conf:33,42`), но Express его
   игнорирует → `req.ip` = адрес прокси-контейнера, **одинаковый для всех**.
2. **Общий лимит 100/15мин** (`apiLimiter`) выжигается одним активным клиентом:
   чаты, сообщения, `ws-token`, `refresh-cookie` каждые 15 минут и т.д.
3. **429 клиент трактует как «сессия недействительна»**: `services/api.ts:57`
   обрабатывает только `401`; `429` уходит в `throw` → `AuthProvider.restoreSession`
   (`:61`) делает `setUser(null)` → `ProtectedRoute` (`router/index.tsx:161`)
   редиректит на `/login`. Отсюда «выбросило на вход» и «мелькнул интерфейс».

## Решение (решение владельца 22.11.2026)

- **Все лимитеры: 3000 запросов / 15 минут** (единое окно и потолок).
- **Ключ лимита — на каждого свой:** `userId` (из `req.user` или из подписанного
  access-cookie JWT), иначе реальный IP клиента.
- **`app.set('trust proxy', 1)`** — один прокси-хоп (хостовый nginx → 127.0.0.1:3100),
  поэтому `req.ip` становится адресом клиента. Число `1`, а не `true`:
  express-rate-limit падает на `trust proxy === true` (`ERR_ERL_PERMISSIVE_TRUST_PROXY`),
  а `true` доверял бы подделанному `X-Forwarded-For`.

## Шаги

- [x] 1. Тикет создан
- [x] 2. `app.ts`: `app.set('trust proxy', 1)` с комментарием
- [x] 3. `rateLimit.ts`: единые константы `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX = 3000`;
      `getClientId` — `user:` (req.user → подписанный JWT-cookie) иначе `ip:`; экспорт `pickLimiter`
- [x] 4. `middleware-ratelimit.test.ts` переписан под новое поведение;
      покрыты все ветки `getClientId` и `pickLimiter` (покрытие `rateLimit.ts` = 100%)
- [x] 5. Клиент: `429`/`5xx`/сеть не должны сбрасывать сессию —
      `services/api.ts` (класс `ApiError` с флагом `transient`),
      `AuthProvider.tsx` (сбрасывает user только при не-transient ошибке)
- [x] 6. Проверки: tsc + тесты server/web + vite build (вывод приложен)
- [ ] 7. Деплой — батчами, команды владельца

## Вне области

- **Настройка лимитов из админки — отложена в MVP2** (решение владельца
  22.11.2026). Тикет: `tickets/deferred/1795343620-rate-limits-admin-mvp2.md`.
  В текущем объёме значения зашиты в `rateLimit.ts` (3000/15мин).
- nginx `limit_req` (`docker/prod/nginx/nginx-production.conf`) — на проде TLS
  терминирует хостовый `balloo-docker.conf`, где `limit_req` нет. Проверяется
  read-only на сервере.

## Проверки

```text
# server
pnpm --filter @balloo/server exec tsc --noEmit              → exit 0
pnpm --filter @balloo/server exec jest src/__tests__/middleware-ratelimit.test.ts
                                                            → 24 passed
  (покрытие src/middleware/rateLimit.ts → 100% stmts/branch/funcs/lines)
pnpm --filter @balloo/server test                           → Test Suites: 53 passed,
                                                              Tests: 800 passed

# web
pnpm --filter @balloo/web exec tsc --noEmit                 → exit 0
pnpm --filter @balloo/web exec vitest run                   → Test Files 49 passed,
                                                              Tests 367 passed
pnpm --filter @balloo/web exec vite build                   → ✓ built in 6.83s
```

## Что меняет для прода

- `api.balloo.su` перестаёт отдавать `429` на нормальной нагрузке: лимит
  «на каждого» (userId/IP) вместо «одного на всех» 100/15мин.
- `429`/`5xx` больше не выкидывают авторизованного на `/login`.
- Требуется пересборка **server** и **web** (затронуты оба пакета).
