# Тикет 1792062709 — В-118(б): удалить мёртвые методы /api/tasks из клиента

**Создан:** 2026-10-15 (unix 1792062709)
**Статус:** в работе
**Источник запроса:** решение владельца 1.2.1 от 15.10.2026 (`with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`
§1.2.1): «(б) удалить из клиента, перенос реализации в mvp3». Зафиксировано в
`with_lord/РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §6. Тикет создан по правилу «решения владельца →
атомарные задачи» (`tickets/ПРОТОКОЛ.md` §2).

## Цель

Вычистить из `packages/web/src/services/api.ts` 5 методов `/api/tasks*`, которых
нет на сервере, вместе с их единственным потребителем — экраном `TasksScreen`.
Реализацию **не** делать: она перенесена в mvp3 (`tickets/deferred/` запись).

## Найденные факты (замеры 15.10.2026, шаг 0bis протокола active)

1. Методы в `packages/web/src/services/api.ts`: строки 901, 905, 917, 931, 937
   (`getTasks`, `getTask`(?), `createTask`, `updateTask`, `deleteTask` — пути
   `/api/tasks`, `/api/tasks/:id`).
2. **Расхождение с прежней записью В-118** («из экранов не вызывается»): вызывается —
   `packages/web/src/screens/command/TasksScreen.tsx` (878 строк) строки 617, 682,
   693, 714, 723. Экран подключён в роутере
   `packages/web/src/router/index.tsx:85,675` и в smoke-тесте
   `packages/web/src/__tests__/screens/screens.smoke.test.tsx:20,37`.
3. На сервере маршрутов `/api/tasks*` нет (проверка `node scripts/list-server-routes.cjs`
   из тикета 1790707718) → экран в проде нерабочий: все его вызовы дают 404.
4. Команда вызова в моках тестов: `packages/web/src/__tests__/helpers/apiSpyMock.ts`
   (упоминание tasks) — проверить при правке.

## Подзадачи

- [x] 1. Удалить 5 методов `/api/tasks*` из `api.ts` — удалены строки 892-939 (940→891 строк)
- [x] 2. Удалить `TasksScreen.tsx` (878 строк), маршруты в `router/index.tsx` (строка 85 lazy-import + строка 673 element → NotFoundScreen), запись в `screens.smoke.test.tsx` (строка 20 import + строка 37 test case) — удалены
- [x] 3. Проверка: `grep -rn "api/tasks\|TasksScreen" packages/web/src/` → 0 совпадений (exit 1); `pnpm --filter @balloo/web build` → exit 0; `pnpm --filter @balloo/web test` → 23 файла, 217 тестов, зелёные

## Критерии готовности

- grep → 0 совпадений (exit 1) ✅
- build → exit 0 ✅
- test → 23 passed, 217 passed ✅
- в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` строка 1.2.1 помечена ✅

## Проблемы и решения

- Сервер имеет пустую заглушку `routes/tasks.ts` (12 строк, Router()) — не удаляю, тикет про клиента. Заглушка нужна для сборки сервера (индексируется в routes/index.ts).
- Ссылки на `/command/tasks` в `CommandLayout.tsx` и `CommandBlogScreen.tsx` — маршрут в роутере изменён на `<NotFoundScreen />`, навигация не ломается (паттерн проекта: meetings, my-department, departments).

## Результат

Команда: `grep -rn "api/tasks\|TasksScreen" packages/web/src/` → exit 1 (0 совпадений)
Build: `pnpm --filter @balloo/web build` → exit 0 (5.89s, 209.75 kB бандл)
Test: `pnpm --filter @balloo/web test` → 23 passed, 217 passed (5.07s)
Удалено: `packages/web/src/screens/command/TasksScreen.tsx` (878 строк)
Изменено: `api.ts` (940→891 строк), `router/index.tsx` (TasksScreen→NotFoundScreen), `screens.smoke.test.tsx` (14→13 тестов)
