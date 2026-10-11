# Тикет 1791623683 — Деплой MVP1: схема БД и seed не применяются (блокер подъёма)

**Создан:** 2026-10-10 14:14 (unix 1791623683)
**Статус:** в работе
**Источник запроса:** владелец, работа по `tickets/active` в режиме «один тикет за раз»

## Цель

После `docker compose up -d --build` на чистом сервере Balloo поднимается с рабочей
схемой БД и seed-данными без ручных шагов. Сейчас не поднимается: миграции и seed
в prod-пути не исполняются нигде.

## Найденные факты (подтверждены чтением файлов в этой сессии)

1. `docker/Dockerfile.server:29,72` — только `prisma generate`. Ни `migrate deploy`,
   ни `db seed` нет ни в образе, ни в `docker/prod/docker-compose.local.yml`
   (`grep -n "entrypoint\|command"` по сервису `server` — совпадений нет).
   Итог: чистый прод = пустая БД.
2. `packages/shared/package.json` — `prisma.seed = "ts-node prisma/seed.ts"`,
   `ts-node` в `devDependencies`; prod-стадия ставит `pnpm install --prod`,
   то есть seed в prod-образе неисполним в принципе.
3. `packages/server/src/services/installService.ts:10` —
   `ROOT_DIR = join(__dirname, '../../..')`. В образе файл лежит в
   `packages/server/dist/services/` (tsconfig: `rootDir=./src`, `outDir=./dist`,
   `packages/server/tsconfig.json:6-7`), значит `../../..` = `/app/packages/server`,
   а корень монорепо — `/app`. Строки 175/227/239 (`join(ROOT_DIR, 'packages/shared')`)
   указывают на несуществующий путь → миграции и seed внутри install-wizard падают.
4. `prisma migrate deploy` требует CLI `prisma`, которого в prod-зависимостях нет
   (только `@prisma/client`), а `npx` в рантайме = сеть на сервере при каждом старте.

## Подзадачи

- [ ] 1. `installService.ts`: резолвить корень монорепо по маркеру `pnpm-workspace.yaml`
      вместо фиксированной глубины. Проверка: `grep -n "pnpm-workspace" packages/server/src/services/installService.ts`.
- [ ] 2. Seed исполним в prod: `tsconfig.seed.json` → `prisma/seed.js`,
      `prisma.seed = "node prisma/seed.js"`. Проверка: `ls packages/shared/prisma/seed.js`
      после сборки shared.
- [ ] 3. `Dockerfile.server`: компилировать seed в builder, ставить CLI `prisma` в prod,
      копи`prisma/` уже содержит seed.js. Проверка: `grep -n "tsconfig.seed\|npm ci -g\|npm install -g prisma" docker/Dockerfile.server`.
- [ ] 4. `docker/entrypoint.server.sh`: `prisma migrate deploy` перед стартом node,
      отключение через `RUN_MIGRATIONS=0`. Проверка: `bash -n docker/entrypoint.server.sh`.
- [ ] 5. Подключить entrypoint в `Dockerfile.server` (и не ломать `CMD`).
      Проверка: `grep -n "ENTRYPOINT" docker/Dockerfile.server`.
- [ ] 6. Документация: раздел «Первый запуск: схема и seed» в `docs/06-devops-infrastructure.md`
      + примечание в `deploy/README.md`. Проверка: `grep -n "migrate deploy" docs/06-devops-infrastructure.md`.
- [ ] 7. Отчёт владельцу строго по коду; прогоны (тесты, e2e, браузер) — после MVP1,
      по требованию владельца.

## Критерии готовности

- В prod-образе есть CLI `prisma` и скомпилированный `prisma/seed.js`.
- Контейнер `server` применяет миграции до прослушивания порта.
- `installService` больше не зависит от глубины `../../..`.
- Документация описывает первый запуск без ручных шагов.

## Проблемы и решения (если возникли)

- `edit_file` в этом монорепо ломается на кириллических путях (см. AGENTS.md
  «Хаки и обходные пути») — правки файлов вложенных пакетов делаю через
  `create_new_file` + `mv`, содержимое переносится полностью.

## Результат

(заполняется по ходу)
