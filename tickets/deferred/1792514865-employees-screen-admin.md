# Тикет 1792514865 — EmployeesScreen («Сотрудники» в админке)

**Создан:** 20.10.2026 (unix 1792514865)
**status:** deferred
**trigger:** начало v2 (появление модели `Employee` в Prisma — отдельное решение)
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
