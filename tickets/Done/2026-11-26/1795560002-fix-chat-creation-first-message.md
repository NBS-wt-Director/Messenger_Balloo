# Тикет 1795560002 — Чат не создаётся при первом сообщении

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Симптом

При отправке первого сообщения в чат и при создании нового чата чат не создаётся.

## Диагноз

1. Архитектурно: отправка сообщения НЕ может создать чат — сервер требует существующую membership (`messageService.ts:75-82` → 403 `Вы не являетесь участником`).
2. `api.createDirectChat` вызывается только из `EmptyChatState.tsx:42` (кликом по контакту).
3. Кнопки «Написать» в `ContactsScreen.tsx:222` и `PublicProfileScreen.tsx:73` ведут на `#/chat?userId=<id>`, но query-параметр `userId` не читает ни один экран — пользователь попадает на пустой `EmptyChatState`, контакт проигнорирован.
4. `MessageInput` не рендерится без `chatId` (`ChatViewScreen.tsx:394`).
5. `EmptyChatState.tsx:58-59` — `catch {}` без уведомления: ошибка создания проглатывается.

## План

- [x] 1. `ChatViewScreen.tsx`: читать `useSearchParams().get('userId')`; если chatId нет, а userId есть — вызвать `api.createDirectChat(userId)`, добавить в стор, `navigate('/chat/'+id, {replace:true})`.
- [x] 2. `EmptyChatState.tsx`: в `catch` показывать toast/inline-ошибку.
- [x] 3. `ContactsScreen.tsx:222` и `PublicProfileScreen.tsx:73`: кнопки «Написать» теперь ведут на `/chat?userId=`, который ChatViewScreen обрабатывает (createDirectChat).
- [x] 4. `MainLayout.tsx:52-54`: на мобильном `/chat?userId=` должен тоже создавать чат (т.к. EmptyChatState не рендерится).
- [x] 5. Проверки: `tsc --noEmit web`, `vitest web`, `vite build`.

## Результат

**Сделано:**

| Файл | Правка |
|---|---|
| `ChatViewScreen.tsx` | `useSearchParams()`: при `/chat?userId=<id>` без chatId — `api.createDirectChat` → addChat → `navigate('/chat/'+id, {replace:true})`; ошибка показывается inline |
| `EmptyChatState.tsx` | `catch {}` → `setCreateError(...)` + inline-баннер |
| `ContactsScreen.tsx` / `PublicProfileScreen.tsx` | кнопки «Написать» теперь ведут на `/chat?userId=`, который ChatViewScreen обрабатывает (createDirectChat) |

**Проверено:** tsc server+web EXIT 0; vitest web 404 passed; jest server 805 passed; vite build OK.
