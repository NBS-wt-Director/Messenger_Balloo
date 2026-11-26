# Тикет 1795560003 — Счётчик сообщений в sidebar

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Симптом

В левой панели у всех чатов вместо счётчика непрочитанных пишется «Нет сообщений».

## Диагноз

1. `chatService.getChats` (server/src/services/chatService.ts:231-262) НЕ возвращает поле `lastMessage` — клиент `ChatItem.tsx:84` всегда видит `lastMsg = undefined` → `lastMsg?.content || 'Нет сообщений'`.
2. Сервер возвращает `unread` (chatService.ts:241), а клиент читает `c.unreadCount` (ChatList.tsx:37, ChatViewScreen.tsx:83) — всегда `0`.
3. Сортировка по `lastMessage` (chatService.ts:291) использует `lastRead`, а не дату последнего сообщения.

## План

- [x] 1. Сервер `getChats`: добавить include `messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { sender: ... } }` и привести к полю `lastMessage: { id, content, createdAt, sender: { id, username, displayName, avatarUrl } }`.
- [x] 2. Сервер: добавить `unreadCount` (alias `unread`) в ответ.
- [x] 3. Сервер: сортировка `lastMessage` должна использовать `chat.updatedAt` или `lastMessage.createdAt`.
- [x] 4. Клиент `ChatList.tsx:37`: `unreadCount: c.unreadCount ?? c.unread ?? 0` (совместимость).
- [x] 5. Клиент `ChatItem.tsx:84`: корректный fallback `Нет сообщений` только когда реально нет `lastMessage`.
- [x] 6. Тип `UserChat` в `chatStore.ts`: добавить `lastMessage?: {...}`.
- [x] 7. Проверки: `tsc --noEmit`, `jest server`, `vitest web`, `vite build`.

## Результат

**Сделано:**

| Файл | Правка |
|---|---|
| `server/src/services/chatService.ts` | `getChats`: include `messages` (take 1, orderBy createdAt desc, +sender +attachments), поля `unreadCount` и `lastMessage`; сортировка по `lastMessage.createdAt`. `getChatInfo`: `unreadCount` + `lastMessage` |
| `web/src/components/chat/ChatList.tsx` | `unreadCount: c.unreadCount ?? c.unread ?? 0` |
| `web/src/screens/chat/ChatViewScreen.tsx` | то же для addChat |
| `web/src/components/chat/ChatItem.tsx` | subtitle: медиа-превью (📷/🎥/🎤/📄/📊) вместо «Нет сообщений» при отсутствии текста |

**Проверено:** tsc server+web EXIT 0; jest server chats.test.ts passed; vitest web 404 passed; vite build OK.
