# Тикет 1792353172 — B5: 6 эндпоинтов каналов (подписка/блок)

**Создан:** 19.10.2026 (unix 1792353172)
**Статус:** заблокирован (нужно решение владельца)
**Источник:** тикет 1792335000, группа B5

## Что звонит

| Вызов | Строка |
|---|---|
| `GET /api/channels/:id` | mobile/api.ts:522 |
| `POST /api/channels/:id/subscribe` | mobile/api.ts:525 |
| `POST /api/channels/:id/unsubscribe` | mobile/api.ts:530 |
| `POST /api/blog/channels/:id/follow` | mobile/api.ts:380 |
| `DELETE /api/blog/channels/:id/follow` | mobile/api.ts:385 |
| `DELETE /api/blocked/channels/:id` | web/api.ts:830 |

## Что есть на сервере

| Эндпоинт | Есть? | Где |
|---|---|---|
| `GET /api/blog/channels/:id` | ✅ | blog.ts:49 |
| `GET /api/blog/channels` | ✅ | blog.ts:46 |
| `POST /api/blog/channels` | ✅ | blog.ts:52 |
| `PUT /api/blog/channels/:id` | ✅ | blog.ts:55 |
| `DELETE /api/blog/channels/:id` | ✅ | blog.ts:58 |
| `GET /api/channels/:id` | ❌ | нет |
| `POST /api/channels/:id/subscribe` | ❌ | нет |
| `POST /api/channels/:id/unsubscribe` | ❌ | нет |
| `POST /api/blog/channels/:id/follow` | ❌ | нет |
| `DELETE /api/blog/channels/:id/follow` | ❌ | нет |
| `DELETE /api/blocked/channels/:id` | ❌ | нет |

## Модель в Prisma

`BlogChannel` — модель есть (строка 716): id, slug, name, description, imageUrl, ownerUserId, createdAt, updatedAt.

**Нет модели подписки/фоллоу!** Нет таблицы `BlogChannelSubscriber` или аналога.

## Варианты решения

### Вариант A — создать модель подписки + роуты

Создать модель `BlogChannelSubscriber` (userId, channelId, subscribedAt) и эндпоинты:
- `GET /api/channels/:id` → алиас на `GET /api/blog/channels/:id`
- `POST /api/channels/:id/subscribe` → создать подписку
- `POST /api/channels/:id/unsubscribe` → удалить подписку
- `POST/DELETE /api/blog/channels/:id/follow` → создать/удалить подписку
- `DELETE /api/blocked/channels/:id` → заблокировать канал

**Плюсы:** полная функциональность.
**Минусы:** новая модель БД, миграция.

### Вариант B — `follow` = alias для `subscribe`

`/api/blog/channels/:id/follow` → переиспользовать `/api/channels/:id/subscribe`.
`/api/channels/:id` → алиас на `/api/blog/channels/:id`.

**Плюсы:** минимум кода.
**Минусы:** всё равно нужна модель подписки.

## Вопрос к владельцу

1. Нужна ли подписка на каналы вообще (модель `BlogChannelSubscriber`)?
2. Если да — создавать с нуля (вариант A) или `follow` = `subscribe` (вариант B)?
3. `DELETE /api/blocked/channels/:id` — это «заблокировать канал» или «отписаться от заблокированного»?
