# Тикет 1792353171 — B2: 6 админ-эндпоинтов — закрыт (работа в тикете -05)

**Создан:** 19.10.2026 · **Закрыт:** 20.10.2026
**Статус:** готов (решение «в» принято, исполнение перенесено)

## Результат

Решение владельца 19.10.2026 (§16 п.4): **в** — 4 экрана на существующие
`/api/knowledge/*` + `/api/features`; `EmployeesScreen` отложен (модели `Employee`
в Prisma нет — замер `grep -n "model Employee" schema.prisma` → 0).

Исполнение не дублируется: работа включена в подзадачу 6 тикета
`tickets/active/1792395490-05-admin-in-mvp1.md` (там же вынос 24 экранов и guard).
Живая проверка 20.10.2026: 6 вызовов `/api/admin/*` остаются в списке расхождений
`scripts/api-endpoints-check.py` (строки DepartmentsScreen/EmployeesScreen/
TextsScreen/VacanciesScreen/FeaturesMgmtScreen) — закроются тикетом -05.
