# Тикет 1795560001 — Статус «онлайн» у контактов

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Симптом

Все контакты помечены «онлайн» (зелёная точка) при попытке написать им.

## Диагноз

1. REST `getContacts()` возвращает `User.status` из enum БД (`active|banned|suspended|deleted`), а не реальный presence. Реальный online-статус живёт только в памяти `roomManager.presence` (ws/room-manager.ts:29).
2. Клиент сравнивает `contact.status === 'online'` — всегда `false`, но визуально все зелёные, потому что класс `avatar--status-online` захардкожен в JSX:
   - `components/chat/ChatHeader.tsx:95`
   - `components/chat/ChatItem.tsx:101`
   - `components/chat/ChatSidebar.tsx:71`
   - `screens/chat/ChatViewScreen.tsx:400` (`onlineStatus="в сети"` хардкод)
   - `screens/profile/ProfileScreen.tsx:197`
   - `screens/profile/PublicProfileScreen.tsx:134`
3. WS-событие `presence.update.broadcast` сервер рассылает (ws/handlers.ts:362-378), но клиент его нигде не слушает.

## План

- [x] 1. Сервер: добавить presence в `getContacts` и в `getChatInfo` — читать `roomManager.presence` и класть `online: boolean` + `lastSeen`.
- [x] 2. Клиент: создать `presenceStore` (zustand) + слушатель `presence.update.broadcast` в глобальном WS-хуке (App.tsx).
- [x] 3. Убрать захардкоженные `avatar--status-online` из ChatHeader/ChatItem/ChatSidebar/ProfileScreen/PublicProfileScreen — использовать условие `online ? 'avatar--status-online' : 'avatar--status-offline'`.
- [x] 4. `ChatViewScreen:400` — вместо константы «в сети» читать presence собеседника.
- [x] 5. `EmptyChatState.tsx:237` — текст по фактическому presence.
- [x] 6. Проверки: `tsc --noEmit` (server+web), `vitest web`, `jest server`.

## Результат

**Сделано:**

| Файл | Правка |
|---|---|
| `server/src/services/userService.ts` | `getContacts` → `online: roomManager.isUserOnline(id)`; `getPublicProfile` → `online`; `getMe` → `role`+`isAdmin` |
| `server/src/services/chatService.ts` | `getChats` peer → `online`; `getChatInfo` members → `online` |
| `web/src/store/presenceStore.ts` | новый zustand-стор (byUser + seedPresenceFromRest) |
| `web/src/components/providers/PresenceProvider.tsx` | глобальный WS-слушатель `presence.update.broadcast` (reconnect) |
| `web/src/App.tsx`, `providers/index.ts` | подключён PresenceProvider |
| `ChatHeader.tsx` | убран хардкод `avatar--status-online`, статус из presenceStore, для групп — «N участников» |
| `ChatItem.tsx` | статус из presenceStore |
| `ChatSidebar.tsx` | убран хардкод `avatar--status-online` |
| `ChatViewScreen.tsx` | убран проп `onlineStatus="в сети"`; seed presence из members |
| `ContactsScreen.tsx`, `EmptyChatState.tsx`, `PublicProfileScreen.tsx` | presence из WS/REST вместо `status === 'online'` |

**Проверено:**
- `pnpm --filter @balloo/server exec tsc --noEmit` → EXIT 0
- `pnpm --filter @balloo/web exec tsc --noEmit` → EXIT 0
- `pnpm --filter @balloo/web exec vitest run` → 54 файла, 404 теста, 0 failed
- `pnpm --filter @balloo/server exec jest --runInBand` → 54 сьюта, 805 тестов, 0 failed
- `pnpm --filter @balloo/web build` → ✓ built in 7.57s
