# mvp1-04 — Первый реальный прогон Cypress e2e по MVP1-путям

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов к работе
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

- [ ] 1. Поднять локальный стек: PostgreSQL (`AGENTS.md` §Системные данные),
      сервер (`pnpm --filter @balloo/server start` или dev), web
      (`pnpm --filter @balloo/web dev`). Проверка: `curl -s -o /dev/null -w "%{http_code}"
      http://localhost:3100/health`, `curl -s -o /dev/null -w "%{http_code}"
      http://localhost:5173`.
- [ ] 2. Спросить владельца на установку бинарника Cypress (п.3) — запись в
      `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` с точной командой. До разрешения тикет
      остаётся в `active/` с `[!]`, молча не скачивать.
- [ ] 3. После разрешения: `pnpm --filter @balloo/web test:e2e -- --spec
      "cypress/e2e/auth.cy.ts,cypress/e2e/chat.cy.ts"` (MVP1-ядро сначала).
- [ ] 4. Каждый упавший шаг → отдельный баг-тикет `mvp1-04-bN-<кратко>.md`,
      правка в коде, повторный прогон. Не править ожидаение под факт без
      разбора причины.

## Критерии готовности

- В «Результат»: полный вывод `cypress run` по auth+chat (pass/fail по каждому
  `it`), список заведённых баг-тикетов.
- Если бинарник не установлен — статус `[!]` с цитатой вывода `ls node_modules/.bin/cypress`.

## Результат

(по ходу)
