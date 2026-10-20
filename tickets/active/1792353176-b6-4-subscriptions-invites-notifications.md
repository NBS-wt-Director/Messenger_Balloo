# Тикет 1792353176 — B6-4: subscriptions / invites / notifications (3 эндпоинта)

**Создан:** 19.10.2026; **исполняемым стал:** 20.10.2026 (перенесён из `with_lord/`)
**Статус:** активен
**Решение владельца:** 19.10.2026 (§16 п.11): subscriptions — **а** (push-подписки);
invites — **а** (алиас на chats/:id/invite); notifications — **б** (алиас
`PUT /api/users/me/notifications` → существующий контроллер).

## Живые замеры (20.10.2026)

- Все 3 маршрута отсутствуют (скрипт сверки в списке).
- Prisma: `PushSubscription` есть (:1173) — читаем её.
- `POST /api/invites/:id/accept` и т.п. есть (invites.ts:12-22); создание инвайта
  живёт в `POST /api/chats/:id/invite` (chats router).
- Настройки уведомлений: `PATCH /api/accounts/:userId/notifications` существует
  (аккаунты); алиас берёт userId из токена.

## Подзадачи

- [ ] 1. Сервер: `GET /api/me/subscriptions` — список push-подписок текущего
      пользователя (endpoint, p256dh без auth-секрета, createdAt).
- [ ] 2. Сервер: `POST /api/invites` `{ chatId, ... }` — переиспользовать контроллер
      `POST /api/chats/:id/invite` (алиас-маршрут в invites.ts, та же логика и права).
- [ ] 3. Сервер: `PUT /api/users/me/notifications` — тот же контроллер, что
      `PATCH /api/accounts/:userId/notifications`, userId из req.user.
- [ ] 4. Тесты jest: 201/200, права (чужой chatId в инвайте → 403; без авторизации → 401).
- [ ] 5. Прогон: dump-routes + api-endpoints-check → строки нет; server test зелёные.

## Критерии готовности

- Web api.ts:834, :945, :983 работают против реальных маршрутов; тесты зелёные.

## Результат

(заполняется по ходу)
