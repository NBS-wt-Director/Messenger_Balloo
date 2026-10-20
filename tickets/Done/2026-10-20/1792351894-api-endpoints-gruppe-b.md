# Тикет 1792351894 — Группа B API Endpoints Audit: 29 недостающих серверных маршрутов

**Создан:** 19.10.2026 · **Закрыт:** 20.10.2026
**Статус:** готов (решения владельца получены, работа распределена по исполняемым тикетам)

## Результат

Решения владельца зафиксированы 19–20.10.2026 (`РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §16, п.3–11).
Повторная проверка живым прогоном 20.10.2026 (`python3 scripts/api-endpoints-check.py`
→ 18 расхождений вместо 29): **B3 (роли чатов, 3), B4 (stories feed/:id, 2),
B6-остаток (PATCH /api/devices/:id, GET /api/messages/:id/history), GET
/api/onboarding/steps — уже реализованы** (внедрялись по тикету 1792335000).

Распределение остатка:

| Группа | Куда |
|---|---|
| B1 боты (3) | `tickets/deferred/1792395490-bots-v2.md` (trigger: начало v2) |
| B2 admin (6) | `tickets/active/1792395490-05-admin-in-mvp1.md` подзадача 6 (решение «в»: 4 экрана на существующие роуты; EmployeesScreen отложен) |
| B5 каналы (6) | `tickets/active/1792353172-b5-channels-subscribe-block.md` |
| B6-1 поиск (1) | `tickets/active/1792353173-b6-1-global-search.md` |
| B6-2 экспорт (1) | `tickets/active/1792353174-b6-2-chat-export.md` |
| B6-3 онбординг (1) | `tickets/active/1792353175-b6-3-onboarding.md` |
| B6-4 subs/invites/notif (3) | `tickets/active/1792353176-b6-4-subscriptions-invites-notifications.md` |

Финальная проверка после исполнения всех перечисленных:
`cd packages/server && npx jest dump-routes --forceExit --runInBand &&
python3 scripts/api-endpoints-check.py` → `НЕ СОВПАДАЕТ: 0`.
