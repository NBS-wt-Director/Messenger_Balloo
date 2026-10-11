# Тикет 1791623683 — Деплой MVP1: схема БД и seed не применяются (блокер подъёма)

**Создан:** 2026-10-10 14:14 (unix 1791623683)
**Статус:** готово (2026-10-11)
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

- [x] 1. `installService.ts`: резолвить корень монорепо по маркеру `pnpm-workspace.yaml`
      вместо фиксированной глубины. Проверка: `grep -n "pnpm-workspace" packages/server/src/services/installService.ts`.
      **Сделано (коммит 9c8f278):** строки 14-26 — `function resolveRootDir()` с поиском
      `pnpm-workspace.yaml`, `const ROOT_DIR = resolveRootDir()`.
- [x] 2. Seed исполним в prod: `tsconfig.seed.json` → `prisma/seed.js`,
      `prisma.seed = "node prisma/seed.js"`. Проверка: `ls packages/shared/prisma/seed.js`
      после сборки shared.
      **Сделано:** `packages/shared/prisma/seed.js` (15934 байт), `"seed": "node prisma/seed.js"`
      в packages/shared/package.json:21.
- [x] 3. `Dockerfile.server`: компилировать seed в builder, ставить CLI `prisma` в prod,
      `prisma/` уже содержит seed.js. Проверка: `grep -n "tsconfig.seed\|npm install -g prisma" docker/Dockerfile.server`.
      **Сделано:** строка 41 `tsc -p tsconfig.seed.json`, строка 81 `npm install -g prisma@5.18.0`.
- [x] 4. `docker/entrypoint.server.sh`: `prisma migrate deploy` перед стартом node,
      отключение через `RUN_MIGRATIONS=0`. Проверка: `sh -n docker/entrypoint.server.sh` → SYNTAX_OK (2026-10-11).
      **Сделано + поведение проверено прогоном:** дефолт `RUN_SEED=0` (seed выключен),
      `RUN_SEED=1` включает — коммит a2da2cd.
- [x] 5. Подключить entrypoint в `Dockerfile.server` (и не ломать `CMD`).
      Проверка: `grep -n "ENTRYPOINT" docker/Dockerfile.server` → строка 94, CMD строка 95.
- [x] 6. Документация: раздел «Первый запуск: схема и сиды» в `docs/06-devops-infrastructure.md`
      + примечание в `deploy/README.md`. **Сделано (коммит a2da2cd), дата правки 2026-10-11.**
- [x] 7. Отчёт владельцу строго по коду; прогоны (тесты, e2e, браузер) — после MVP1,
      по требованию владельца. **Минимальный набор исполнен 2026-10-11 (см. Результат).**

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

**Статус: готово (2026-10-11).** Доказательства — прогоны этой сессии:

1. **Entrypoint, поведение** (`sh -n` + запуск с заглушкой):
   - `RUN_MIGRATIONS=0 sh docker/entrypoint.server.sh echo APP-STARTED` →
     `Skipping seed (RUN_SEED=0, default).` + `APP-STARTED` — сид **выключен по умолчанию**;
   - `RUN_MIGRATIONS=0 RUN_SEED=1 sh ...` → ветка сида выполняется — включается явно.
2. **`prisma migrate deploy` на чистой БД** (создана `balloo_migrate_check`, прогон,
   удалена): `All migrations have been successfully applied.` — все 6 миграций
   (initial, report_target_no_fk, support_chat, features_anonymous, tasks_sprints,
   add_missing_columns).
3. **`node prisma/seed.js` на той же чистой БД**: EXIT=0, сид применён;
   повторный запуск EXIT=0 — идемпотентен. Временная БД удалена (`DROP DATABASE`).
4. **Dockerfile.server**: seed компилируется в builder (`tsconfig.seed.json`),
   CLI `prisma@5.18.0` ставится глобально, `ENTRYPOINT` подключён, `CMD` не сломан.
5. **Коммиты:** 9c8f278 (installService resolveRootDir, seed.js, Dockerfile, entrypoint),
   a2da2cd (seed по умолчанию выключен + документация), запушено в origin/main
   (`git rev-parse HEAD origin/main` — совпали, a2da2cd).

**Не проверялось:** сборка prod-образа Docker и подъём стека на сервере — нужен
доступ к серверу (руки владельца, команда «Деплой»).

**Изменение поведения относительно текста тикета:** seed в prod по умолчанию
**не** запускается (решение владельца зафиксировано в a2da2cd: тестовые данные
в проде без запроса не нужны). Включение: `RUN_SEED=1` при старте контейнера.
