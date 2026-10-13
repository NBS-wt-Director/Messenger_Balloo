# mvp1-01 — Вернуть корневой `pnpm install`/`pnpm test` в рабочее состояние

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов к работе
**Кто:** Ksyusha (без владельца)
**Почему увеличивает MVP1:** красный `pnpm install` валит ЛЮБУЮ проверку монорепо —
`pnpm test`, `pnpm build`, CI-шаг «Install dependencies». Пока он красный, ни один
процент готовности нельзя подтвердить прогоном (AGENTS §0).

## Найденные факты (замеры 12.10.2026)

1. `pnpm test` в корне падает до запуска тестов:
   `[ERR_PNPM_WORKSPACE_PKG_NOT_FOUND] In ../web-admin: "@balloo/api-client@workspace:*"
   is in the dependencies but no package named "@balloo/api-client" is present in the
   workspace` (вывод этой сессии).
2. `packages/web-admin/package.json:12` — `"@balloo/api-client": "workspace:*"`.
3. Пакета `@balloo/api-client` в репозитории нет: `find packages -maxdepth 2
   -name package.json -exec grep -l '"name": "@balloo/api-client"' {} \;` → пусто.
4. `packages/web-admin` — **untracked** (`git ls-files packages/web-admin` → 0 строк,
   `git status --porcelain` → `?? packages/web-admin/`), файлов кода 0
   (`find packages/web-admin -name "*.ts*" | wc -l` → 0). Лежит только
   `package.json` + пустые `src`/`tsconfig.json`.
5. Вне пакета на него нет ни одной ссылки: `grep -rn "web-admin" .github docker
   package.json scripts` → 0 совпадений. CI (`ci.yml:64`) делает `pnpm install`,
   то есть CI на этом же состоянии lockfile тоже красный.
6. admin.balloo.su **вне MVP1** (`PROJECT_DOCUMENTATION.md` §17, макеты узел `у_02`)
   — чинить саму админку для MVP1 не нужно, нужно перестать падать на install.

## Подзадачи

- [x] 1. Выбран вариант А: `pnpm-workspace.yaml` → добавлена строка `'!packages/web-admin'` (заглушка untracked, 0 кода, admin вне MVP1).
- [x] 2. Применён.
- [x] 3. `pnpm install` → exit 0; `pnpm test` → exit 0 (shared 76, web 216, server Done).

## Критерии готовности

- Вывод `pnpm install` с кодом возврата 0 в «Результат». ✓
- Вывод `pnpm --filter @balloo/web test` (зелёный) в «Результат». ✓ 22 files, 216 tests.
- Никаких удалённых файлов без разрешения владельца. ✓ (только строка в workspace.yaml)

## Результат

Выбран вариант А (исключение заглушки из workspace). Правка: `pnpm-workspace.yaml`,
добавлена строка `- '!packages/web-admin'`.

Доказательства (прогон 13.10.2026):
```
$ pnpm install
Scope: all 9 workspace projects
Done in 2.6s using pnpm v11.17.0
(exit 0)

$ pnpm test
packages/shared test:  Test Files  4 passed (4), Tests  76 passed (76)
packages/web test:     Test Files  22 passed (22), Tests  216 passed (216)
packages/server test: Done
EXIT_CODE=0
```
