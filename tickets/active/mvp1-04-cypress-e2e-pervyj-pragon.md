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

- [!] 1. Поднять локальный стек: PostgreSQL запущен, сервер и web — требуют `pnpm --filter @balloo/server start` + `pnpm --filter @balloo/web dev`. Блокировано Cypress (п.2).
- [!] 2. Cypress-бинарник не установлен: `pnpm-workspace.yaml` содержит `allowBuilds: { cypress: false }`, `node_modules/.bin/cypress` → нет, `~/.cache/Cypress` → нет. Установка требует записи вне воркспейса (`~/.cache/Cypress`). Запись в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` создана.
- [ ] 3. После разрешения: `pnpm --filter @balloo/web test:e2e -- --spec "cypress/e2e/auth.cy.ts,cypress/e2e/chat.cy.ts"`.
- [ ] 4. Каждый упавший шаг → отдельный баг-тикет.

## Проблемы и решения

**Блокировка:** Cypress postinstall (`cypress install`) скачивает бинарник в `~/.cache/Cypress/` — запись вне воркспейса. По AGENTS «КРИТИЧЕСКОЕ ПРАВИЛО: Границы воркспейса» п.2 — не выполняю без явного разрешения владельца. Точная команда: `CYPRESS_INSTALL_BINARY=0` убрать из allowBuilds и выполнить `pnpm install` или `npx cypress install`.

## Результат

[!] Заблокирован. Cypress-бинарник не установлен (запись вне воркспейса). Ожидание разрешения владельца.
