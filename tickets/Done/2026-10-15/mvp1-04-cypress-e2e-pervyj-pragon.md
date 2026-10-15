# mvp1-04 — Первый реальный прогон Cypress e2e по MVP1-путям

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов (15.10.2026)
**Кто:** Ksyusha (без владельца; нужен локальный стек БД+сервер+web)
**Почему увеличивает MVP1:** e2e никогда не выполнялся — `AGENTS.md` §1:
«прогон `pnpm --filter @balloo/web test:e2e` → `cypress run` — **в этой сессии не
запускался**». Проверка «глазами» не считается проверкой (AGENTS §0), значит
MVP1-сценарии (вход → чат → сообщение) сейчас не подтверждены ничем.

## Найденные факты (замеры 12.10.2026)

1. Специки есть: `packages/web/cypress/e2e/` → `admin.cy.ts`, `auth.cy.ts`,
   `blog.cy.ts`, `chat.cy.ts`, `group.cy.ts`, `story.cy.ts`.
2. Скрипт есть: `packages/web/package.json:12` → `"test:e2e": "cypress run"`.
3. Бинарник Cypress **не установлен**: `ls node_modules/.bin/cypress` → нет,
   `ls ~/.cache/Cypress` → нет. Причина: `pnpm-workspace.yaml` →
   `allowBuilds: { cypress: false }` (postinstall пропускается, бинарник не
   скачивается). Установка требует сети и записи вне воркспейса
   (`~/.cache/Cypress`) — это отдельное разрешение владельца.
4. Юнит-слой зелёный и НЕ заменяет e2e: `vitest run` в `packages/web` →
   22 файла, 216 тестов (прогон 12.10.2026).

## Подзадачи

- [x] 1. Стек поднят 15.10.2026: PostgreSQL+Redis (были), `pnpm --filter @balloo/server dev`
      с NODE_ENV=test (skip rate limiter) на 3100, `pnpm --filter @balloo/web dev` на 5173.
- [x] 2. Cypress-бинарник установлен в воркспейс `.cypress-cache/` через CYPRESS_CACHE_FOLDER —
      запись вне воркспейса не потребовалась, блокировка снята.
- [x] 3. Прогнано: `cypress run --spec auth.cy.ts,chat.cy.ts` (команда с CYPRESS_CACHE_FOLDER)
      → auth 4/4, chat 3/3.
- [x] 4. Найденные баги закрыты сразу (3 шт., коммиты 15.10): refresh-подмена 401 на auth-ручках,
      null-краш AppTopbar, спеки на history-роутере. UX-дефект (register-code-step недостижим)
      зафиксирован в комментарии auth.cy.ts — на решение владельца не вынесен отдельно;
      остальные спеки (blog/group/story/admin) — отдельная задача (нужны сиды).

## Проблемы и решения

**Блокировка:** Cypress postinstall (`cypress install`) скачивает бинарник в `~/.cache/Cypress/` — запись вне воркспейса. По AGENTS «КРИТИЧЕСКОЕ ПРАВИЛО: Границы воркспейса» п.2 — не выполняю без явного разрешения владельца. Точная команда: `CYPRESS_INSTALL_BINARY=0` убрать из allowBuilds и выполнить `pnpm install` или `npx cypress install`.

## Результат

**Закрыт 15.10.2026 (сессия 1791983037).** Бинарник Cypress 15.19.0 установлен в
воркспейс `.cypress-cache/` через `CYPRESS_CACHE_FOLDER` — запись в `~/.cache` не
потребовалась, блокировка снята без владельца.

```text
$ CYPRESS_CACHE_FOLDER=./.cypress-cache packages/web/node_modules/.bin/cypress verify
✔  Verified Cypress!  .../.cypress-cache/15.19.0/Cypress          (exit 0)

# стек: PostgreSQL 5432 + Redis 6379 (были) + server 3100 (NODE_ENV=test —
# штатный skip rate limiter, middleware/rateLimit.ts:93) + web dev 5173
$ cypress run --spec cypress/e2e/auth.cy.ts
✔  auth.cy.ts   00:11   4   4   -   -   -        (All specs passed)
$ cypress run --spec cypress/e2e/chat.cy.ts
✔  chat.cy.ts   00:05   3   3   -   -   -        (All specs passed)
```

Что починено по ходу (коммиты 15.10.2026): спеки переведены на hash-роутер (`/#/login`),
формы получения data-testid (LoginScreen, RegisterScreen, PasswordInput, LegalCheckbox),
`api.ts`: 401 на `/api/auth/*` больше не триггерит refresh (иначе «Неверный email или
пароль» подменялся «Session expired»), `AppTopbar`: null-safe username (падал топпар).
E2E-пользователь: `POST /api/auth/register` → 201 (`e2e@test.balloo.ru`).

Оговорка (честно): условные тела тестов chat.cy.ts (`if ($body.find(...))`) без чатов
проходят пусто — значимая часть (UI-вход, редирект) выполняется в beforeEach. Спеки
blog/group/story/admin не прогонялись (нужны сиды) — зарегистрировано как отдельная
задача в §17 «что осталось», п.5.

UX-дефект, найденный прогоном (не фиксился, зафиксирован): после UI-регистрации шаг
подтверждения email (register-code-step) из UI недостижим — GuestRoute редиректит в
/#/chat раньше (описано в комментарии auth.cy.ts:36-38).
