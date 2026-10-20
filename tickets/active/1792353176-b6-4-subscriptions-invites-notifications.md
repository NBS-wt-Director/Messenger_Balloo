# Тикет 1792353176 — B6-4: подписки, уведомления, инвайты (3 эндпоинта)

**Создан:** 19.10.2026 (unix 1792353176)
**Статус:** ✅ разблокирован 19.10.2026
**Источник:** тикет 1792335000, группа B6

## Решения владельца (19.10.2026)

1. **`GET /api/me/subscriptions`** — **а**: push-подписки (модель `PushSubscription` есть).
2. **`POST /api/invites`** — **а**: алиас на существующий контроллер `/api/chats/:id/invite`.
3. **`PUT /api/users/me/notifications`** — **б**: алиас на существующий `PATCH /api/accounts/:userId/notifications`.

## Что будет сделано

1. `GET /api/me/subscriptions` → список push-подписок текущего пользователя.
2. `POST /api/invites` → алиас на существующий inviteController.
3. `PUT /api/users/me/notifications` → алиас на существующий accountsController (userId из токена).
4. Тесты зелёные.

## Что звонит

| Вызов | Строка |
|---|---|
| `GET /api/me/subscriptions` | web/api.ts:981 |
| `POST /api/invites` | web/api.ts:945 |
| `PUT /api/users/me/notifications` | web/api.ts:834 |

## Что есть на сервере

| Эндпоинт | Есть? | Где |
|---|---|---|
| `GET /api/me/subscriptions` | ❌ | нет |
| `POST /api/invites` | ❌ | нет (есть `POST /api/invites/:id/accept`) |
| `PUT /api/users/me/notifications` | ❌ | нет (есть `PATCH /api/accounts/:userId/notifications`) |

## Что есть в Prisma

- `PushSubscription` (userId, endpoint, p256dh, auth) — **есть**
- `InviteLink` (chatId, code, maxUses, expiresAt) — **есть**
- `Notification` (userId, type, message, isRead) — **есть**

## Вопрос к владельцу

### 1. `GET /api/me/subscriptions` — что вернуть?

Модель `PushSubscription` — push-подписки для уведомлений. Что нужно:
- a) список push-подписок пользователя
- b) список подписок на каналы/блоги (нет модели, нужно создавать)
- c) что-то другое

### 2. `POST /api/invites` — создание инвайта

Модель `InviteLink` есть, но создание через `/api/chats/:id/invite` (POST в роутере чатов).
- a) алиас: `POST /api/invites` → тот же контроллер, что `/api/chats/:id/invite`
- b) отдельный контроллер

### 3. `PUT /api/users/me/notifications` — настройки уведомлений

Есть `PATCH /api/accounts/:userId/notifications` (с userId в пути).
- a) переключить клиент на `PATCH /api/accounts/:userId/notifications`
- b) создать алиас `PUT /api/users/me/notifications`

## Моя рекомендация

1. `GET /api/me/subscriptions` — уточнить (push-подписки или подписки на каналы?)
2. Алиас для invites: добавить `POST /api/invites` в роутер invites → тот же контроллер
3. Алиас для notifications: добавить `PUT /api/users/me/notifications` → тот же контроллер
