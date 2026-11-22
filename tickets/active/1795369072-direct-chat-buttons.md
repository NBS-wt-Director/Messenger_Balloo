# Тикет 1795369072 — Личные чаты: кнопки «Новый чат» и клик по контакту не работают

**Создан:** 22.11.2026 (unix 1795369072)
**Статус:** в работе
**Источник:** приёмка H2, владелец: «почему кнопки контактов и создания чатов не работают?»

## Причина (доказана чтением кода 22.11.2026)

1. `ChatViewScreen.tsx:468-469`: `<EmptyChatState onNewChat={() => navigate('/chat')} />`
   — навигация на **текущий** маршрут = no-op. Клик по контакту в списке
   (`EmptyChatState.tsx:168 onClick={onNewChat}`) вызывает тот же no-op, причём
   **без id контакта**.
2. На сервере **нет создания личных чатов вообще**: `chatController.createChat:26`
   принимает только `group|channel`, `chatService.createChat:62` приводит type к
   group/channel. Единственный создатель direct-чатов — `callService.ts:96-119`
   (find-or-create при звонке).

## Макет (источник правды)

`mockups/balloo-su/empty-chat.md` §Взаимодействия: «✏️ Новый чат → openModal(modal-new-chat)»
(модалка = поиск + список контактов). Приёмка 16.10.2026 перенесла список контактов
и поиск инлайн на экран. Клик по контакту = начать/открыть личный чат.

## Решение

### Server (`chatService`, `chatController`)

- `createChat` поддерживает `type: 'direct'`: find-or-create чата между ownerId и
  `memberIds[0]` (паттерн `callService.ts:96-119`), идемпотентен; name для direct
  не требуется; settings-строку не создавать; `ensureMutualContacts`.
- `getChats`: добавить в ответ `memberIds` и `peer` (собеседник direct-чата:
  id/username/displayName/avatarUrl) — additive-поля.
- Контроллер: `direct` проходит валидацию, name обязателен только для group/channel.

### Web

- `EmptyChatState`: клик по контакту → `POST /api/chats {type:'direct', memberIds:[id]}`
  → добавить чат в store → `setActiveChat` → `navigate('/chat/:id')`; кнопка
  «✏️ Новый чат» → фокус в поле поиска списка (список уже на экране);
  проп `onNewChat` и no-op из `ChatViewScreen` удалить.
- Фильтр «контакты без чатов» теперь работает по-настоящему: `memberIds`
  приходит со сервера (раньше `(c as any).memberIds` был undefined → фильтр не работал).
- `ChatItem`: имя direct-чата = `displayNameOf(peer)` (сейчас был бы пустой `name`).
- Тип `UserChat`: `peer?`, `memberIds?`.

## Подзадачи

- [x] 1. server: direct в createChat (controller+service, find-or-create), peer/memberIds в getChats
- [x] 2. web: EmptyChatState клик→чат, кнопка «Новый чат»→фокус поиска; ChatViewScreen без no-op
- [x] 3. web: ChatItem имя direct из peer; chatStore типы peer/memberIds
- [x] 4. Тесты: `direct-chat.test.ts` (5 кейсов), `EmptyChatState.direct.test.tsx` (клик→POST+navigate)
- [x] 5. Проверки: tsc server+web 0; jest server 805/805; vitest web 393/393; vite build ✓
- [ ] 6. Деплой (server + web)

## Результат

Server: `createChatService` поддерживает `type:'direct'` (find-or-create, идемпотентно,
`ensureMutualContacts`); контроллер валидирует direct (ровно один собеседник, не сам);
`getChats` отдаёт `memberIds` и `peer` (имя/аватар собеседника).

Web: клик по контакту → `api.createDirectChat(id)` → `addChat` в store → `navigate('/chat/:id')`;
кнопка «✏️ Новый чат» фокусирует поиск; `ChatItem` показывает имя собеседника.

Проверки: server jest 805/805 (direct-chat 5/5), web vitest 393/393
(EmptyChatState.direct 1/1), `vite build` ✓.

## Критерии готовности

- клик по контакту открывает личный чат, повторный клик открывает **тот же** чат;
- чат появляется в сайдбаре с именем собеседника;
- контакт с открытым чатом исчезает из предложений Балунишки.

## Результат

(заполняется по ходу)
