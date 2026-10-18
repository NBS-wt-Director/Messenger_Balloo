# Тикет 1792351894 — Группа B API Endpoints Audit: 29 недостающих серверных маршрутов

**Создан:** 19.10.2026 (unix 1792351894)
**Статус:** заблокирован (нужно решение владельца)
**Источник:** тикет 1792335000, подзадача 5

## Цель

Зафиксировать решение владельца по 29 эндпоинтам группы B (маршруты отсутствуют на сервере),
после чего создать недостающие контроллеры + роуты + тесты.

## Что требуется от владельца

### Вопрос 1: Админ-экраны (B2) — 5 эндпоинтов

Админ-экраны `DepartmentsScreen`, `EmployeesScreen`, `TextsScreen`, `VacanciesScreen`,
`FeaturesMgmtScreen` (монтированы в роутере) вызывают `/api/admin/*` — маршрутов нет.
Существующие `/api/hiring/*` и `/api/knowledge/*` уже содержат departments, vacancies,
pages, texts.

**Варианты:**

| Вариант | Суть | Плюсы | Минусы |
|---|---|---|---|
| **A** | Переключить админ-экраны на существующие `/api/hiring/*`, `/api/knowledge/*` | Не плодить роуты, код уже есть, тесты есть | Нужны правки в экранах (5 файлов) |
| **B** | Создать `/api/admin/departments`, `/api/admin/employees`, `/api/admin/texts`, `/api/admin/vacancies`, `/api/admin/features` | Экраны не трогаем | Дублирование логики, двойной учёт |

**Моя рекомендация:** Вариант A — переключить на существующие.

### Вопрос 2: Боты (B1) — 3 эндпоинта

`GET /api/bots`, `POST /api/bots`, `DELETE /api/bots/:id` — бэкенда нет.

**Варианты:**

| Вариант | Суть |
|---|---|
| **A** | Создать сейчас (таблица `bot` в Prisma уже спроектирована в data_schema.json) |
| **B** | Отложить до v2 (боты — не MVP) |

### Вопрос 3: Прочие (B3–B6) — 21 эндпоинт

| Категория | Эндпоинты | Приоритет |
|---|---|---|
| **B3.** Роли участников/админов чата | `PUT /api/chats/:id/members/:userId/role`, `DELETE /api/chats/:id/admins/:adminId`, `PUT /api/chats/:id/admins/:adminId/role` | Средний (UI есть) |
| **B4.** Истории | `GET /api/stories/feed`, `GET /api/stories/:id` | Средний (mobile StoriesScreen) |
| **B5.** Каналы (подписка/блок) | `GET /api/channels/:id`, `POST /api/channels/:id/subscribe`, `POST /api/channels/:id/unsubscribe`, `POST /api/blog/channels/:id/follow`, `DELETE /api/blog/channels/:id/follow`, `DELETE /api/blocked/channels/:id` | Средний |
| **B6.** Прочее | `GET /api/search`, `GET /api/chats/:id/export`, `GET /api/messages/:id/history`, `GET /api/onboarding/steps`, `PATCH /api/users/me/onboarding`, `GET /api/me/subscriptions`, `PATCH /api/devices/:id`, `POST /api/invites`, `PUT /api/users/me/notifications` | Низкий–средний |

**Вопрос:** создавать все 21, или выбрать MVP-набор?

## Критерии разблокировки

- [ ] Решение по B2 (вариант A или B)
- [ ] Решение по B1 (сейчас или v2)
- [ ] По B3–B6: полный список или MVP-подмножество

## Что будет сделано после решения

1. Создать недостающие контроллеры + роуты + тесты (B1–B6).
2. Переключить админ-экраны на выбранные эндпоинты.
3. Финальный прогон: `python3 scripts/api-endpoints-check.py` → 0, тесты зелёные.
