# Тикет 1792160027 — Admin: 5 экранов без кода

**Создан:** 16.10.2026 (unix 1792160027)
**Статус:** в работе
**Источник:** аудит → Н-46

## Цель

Реализовать 5 admin-экранов, отсутствующих в коде.

## Живое состояние

- `packages/web/src/screens/admin/` — 19 экранов.
- Макетов admin: 24.
- 5 без кода: по аудиту. Нужно проверить на месте (комментарии к аудиту — 19 code vs 24 mockup = 5, но live-сравнение требует уточнения имён).

## Подзадачи

- [x] 1. Live-сверка: 24 макета vs 19 кодов → 5 маршрутов admin в роутере вели на NotFoundScreen.
- [x] 2. Создано 5 экранов: DepartmentsScreen, EmployeesScreen, VacanciesScreen, TextsScreen, FeaturesMgmtScreen.
- [x] 3. Зарегистрированы в роутере admin (lazy import + replacement NotFoundScreen).
- [x] 4. `pnpm --filter @balloo/web build` — зелёный.

**Команда проверки:**
```bash
cd packages/web && npm run build && echo "✅ build OK"
```

## Критерии готовности

- 5 экранов созданы.
- Сборка проходит.

## Проблемы и решения

_Заполняется по ходу._

## Результат

5 admin-экранов созданы и подключены в роутере: DepartmentsScreen, EmployeesScreen, VacanciesScreen, TextsScreen, FeaturesMgmtScreen.

```
pnpm --filter @balloo/web build → ✓ built in 7.60s (exit 0)
```
