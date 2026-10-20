# Тикет 1792353171 — B2: 6 админ-эндпоинтов (кабинет сотрудников / контент)

**Создан:** 19.10.2026 (unix 1792353171)
**Статус:** ✅ разблокирован 19.10.2026 — решение **в**
**Источник:** тикет 1792335000, группа B2

## Решение владельца (19.10.2026)

**Вариант В:** переключить 4 экрана на `/api/knowledge/*` + `/api/features`:
- DepartmentsScreen → `/api/knowledge/departments`
- VacanciesScreen → `/api/knowledge/vacancies`
- TextsScreen → `/api/knowledge/pages`
- FeaturesMgmtScreen → `/api/features`

`EmployeesScreen` — **отложить** (модели `Employee` в Prisma нет, нет источника данных).

## Что будет сделано

1. Переключить 4 вызова в экранах на существующие эндпоинты.
2. `EmployeesScreen` — не трогать (отложен).
3. `python3 scripts/api-endpoints-check.py` → 0 (для 4 из 6), тесты зелёные.

## Что звонит

| Экран | Вызов | Строка |
|---|---|---|
| `DepartmentsScreen.tsx` | `GET /api/admin/departments` | 22 |
| `DepartmentsScreen.tsx` | `POST /api/admin/departments` | 31 |
| `EmployeesScreen.tsx` | `GET /api/admin/employees` | 22 |
| `TextsScreen.tsx` | `GET /api/admin/texts` | 21 |
| `VacanciesScreen.tsx` | `GET /api/admin/vacancies` | 21 |
| `FeaturesMgmtScreen.tsx` | `GET /api/admin/features` | 22 |

## Что есть на сервере

| Эндпоинт | Есть? | Где |
|---|---|---|
| `GET /api/knowledge/departments` | ✅ | knowledge.ts:69 |
| `POST /api/knowledge/departments` | ✅ | knowledge.ts:66 |
| `GET /api/knowledge/vacancies` | ✅ | knowledge.ts:88 |
| `GET /api/knowledge/pages` | ✅ | knowledge.ts:37 |
| `GET /api/features` | ✅ | features.ts:17 |
| `GET /api/admin/employees` | ❌ | нет |

> Примечание: `GET /api/admin/vacancies` → 404, но есть `GET /api/knowledge/vacancies` и `GET /api/hiring/vacancies` (knowledgeRouter смонтирован по обоим путям, routes/index.ts:54-55).

## Варианты решения

### Вариант A — переключить экраны на существующие роуты

| Экран | Было | Стало | Правки |
|---|---|---|---|
| DepartmentsScreen | `/api/admin/departments` | `/api/knowledge/departments` | 2 вызова |
| VacanciesScreen | `/api/admin/vacancies` | `/api/knowledge/vacancies` | 1 вызов |
| TextsScreen | `/api/admin/texts` | `/api/knowledge/pages` | 1 вызов |
| FeaturesMgmtScreen | `/api/admin/features` | `/api/features` | 1 вызов |
| EmployeesScreen | `/api/admin/employees` | **нет аналога** | ❌ |

**Плюсы:** не плодить роуты, код уже есть, тесты есть.
**Минусы:** `EmployeesScreen` не закроется (нет `/api/admin/employees` и аналога).

### Вариант B — создать отдельные admin-роуты

Создать `GET/POST /api/admin/departments`, `GET /api/admin/employees`, `GET /api/admin/texts`, `GET /api/admin/vacancies`, `GET /api/admin/features` в новом контроллере `adminContentController.ts`.

**Плюсы:** экраны не трогаем.
**Минусы:** дублирование логики, двойной учёт данных (два пути к одним данным).

## Вопрос к владельцу

1. **A** — переключить 4 экрана на `/api/knowledge/*` + `/api/features`, а `EmployeesScreen` — отдельно (см. тикет B2-employees)
2. **B** — создать все 6 admin-роутов (дублирование логики)
3. **C** — `EmployeesScreen` отложить (нет модели `Employee` в Prisma), остальные 4 — по варианту A

## Замечание

Модели `Employee` в Prisma **нет**. `EmployeesScreen` не может работать без модели сотрудников. Если вариант C — `EmployeesScreen` нужно отложить до v2 (или создать модель Employee).
