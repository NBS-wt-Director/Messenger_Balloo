# Тикет 1792514865 — EmployeesScreen («Сотрудники» в админке)

**Создан:** 20.10.2026 (unix 1792514865)
**status:** готов (закрыт 16.11.2026 — проверено запуском, см. «Результат»)
**Источник:** решение владельца 20.10.2026 в чате: «вопрос 1 — это не из mvp1. отложим»
(предыдущее решение 5.5.2 от 19.10: «EmployeesScreen отложить, модели Employee
в Prisma нет» — подтверждено и оформлено отсрочкой)

## Что отложено

Экран `packages/web-admin/src/screens/EmployeesScreen.tsx` вызывает
`GET /api/admin/employees` — маршрута на сервере нет, модели `Employee`
в `packages/server/prisma/schema.prisma` нет (замер 20.10.2026:
`grep "^model Employee"` → пусто). Экран уходит в 404.

## Объём работ при наступлении триггера

1. Модель `Employee` в Prisma (+ миграция) — поля определить по макету
   `mockups/admin-balloo-su/employees.html`.
2. `GET /api/admin/employees` (controller + route в `routes/admin.ts` + тесты).
3. Подключение экрана (путь вызова уже верный — менять не нужно).

## Связанные

- Тикет аудита: `Done/2026-10-20/1792335000-api-endpoints-audit.md`
  (единственный реальный остаток сверки — этот эндпоинт).
- Решение владельца: `with_lord/РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §19.

## Результат (закрыт 16.11.2026, проверено запуском)

| Шаг | Доказательство (прогон 16.11.2026) |
|---|---|
| 1. Модель `Employee` + миграция | `grep "^model Employee" packages/shared/prisma/schema.prisma` → есть (`@@map("employees")`); в БД: `SELECT migration_name FROM _prisma_migrations WHERE migration_name LIKE '%employee%'` → `20261021000000_add_employees`; таблица `employees` существует |
| 2. `GET /api/admin/employees` | контроллер `adminController.listEmployees` + роут `routes/admin.ts:113` (`authRequired, adminOnly`) |
| 3. Тесты эндпоинта | **добавлены этим закрытием** (раньше не было ни одного теста на employees): `admin.test.ts` +describe `GET /api/admin/employees` — 401 без auth, 403 не-админ, 200 + сид строки + проверка поля `name`. Прогон: `pnpm --filter @balloo/server test -- admin.test` → **16 passed** (было 13) |
| 4. Экран подключён | `web-admin/App.tsx:135` роут `employees`; `EmployeesScreen.tsx:22` вызывает `/api/admin/employees`; сборка: `pnpm --filter @balloo/web-admin build` → exit 0 |

Остаток (не блокер): браузерная приёмка экрана на проде — за владельцем
(см. `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`, блок 3).
