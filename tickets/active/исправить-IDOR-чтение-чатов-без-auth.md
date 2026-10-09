# исправить-IDOR-чтение-чатов-без-auth

**Источник:** а-03-проверить-доступ-к-чужим-данным
**Создана:** 09.10.2026
**Приоритет:** критический

## Проблема

Несколько GET-эндпоинтов **не требуют авторизацию** и **не проверяют членство в чате**:

| Эндпоинт | Файл:строка | Проблема |
|----------|-------------|----------|
| `GET /api/chats/:id` | `routes/chats.ts:31` | getChatInfo без authRequired |
| `GET /api/chats/:chatId/messages` | `routes/messages.ts:27` | getMessages без authRequired |
| `GET /api/chats/:chatId/messages/search` | `routes/messages.ts:32` | searchMessages без authRequired |
| `GET /api/messages/:id/reactions` | `routes/messages.ts:57` | getReactions без authRequired |
| `GET /api/messages/:id/read` | `routes/messages.ts:67` | getReadStatus без authRequired |

**Доказательство:**
```bash
grep -n "router.get" packages/server/src/routes/messages.ts packages/server/src/routes/chats.ts
# строки 27, 32, 57, 67 в messages.ts и 31 в chats.ts — без authRequired
```

## Что проверить в контроллерах

1. `getMessagesService({ chatId })` — фильтрует ли по членству пользователя
2. `searchMessagesService(chatId, q, limit)` — фильтрует ли по членству
3. `getChatInfo` — возвращает ли данные любого чата
4. `getReactionsService(messageId)` — проверяет ли доступ к сообщению
5. `getReadStatusService(messageId)` — проверяет ли доступ

## Решение (варианты)

**Вариант A:** Добавить `authRequired` на все эти эндпоинты + проверку членства в сервисном слое.

**Вариант B:** Если чаты публичные — задокументировать это и добавить `authRequired` только на защищённые данные (read status).

Рекомендую **A** — приватные чаты по умолчанию.

## Блокер

Нужно решение владельца: **чат — публичный или приватный по умолчанию?**
