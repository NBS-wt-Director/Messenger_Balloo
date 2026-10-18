# Тикет 1792137288 — Web: приглашение подписчиков при создании канала (реализация 1_01_35, приёмка 1.1.15)

**Создан:** 16.10.2026 (unix 1792137288)
**Статус:** готов
**Источник запроса:** решение владельца 1.1.15 (16.10.2026) + правило 21
**Тикет приёмки макета:** `Done/2026-10-16/1792132873` (→ 6.39)

## Цель

В `CreateChannelScreen` добавить блок «👥 Пригласить подписчиков» (поиск контактов
+ чекбоксы + счётчик) — выбранные пользователи приглашаются в канал сразу после
его создания.

## Живое состояние на момент создания (проверено командами)

- Экран ЕСТЬ: `packages/web/src/screens/channels/CreateChannelScreen.tsx`
  (приглашение подписчиков отсутствует: grep «Пригласить/подписч» — только
  надписи настроек);
- API клиента: `api.getContacts()` (`api.ts:594`), `api.createInviteLink` (`api.ts:261`);
- Сервер: `POST /api/chats/:id/members` (`routes/chats.ts:46`, addMember) —
  приглашение участника уже существует, отдельный эндпоинт не нужен;
- Макет: `mockups/balloo-su/channel-create.html` — блок «👥 Пригласить подписчиков»
  после «Администраторы».

## Подзадачи

- [x] 1. Блок «👥 Пригласить подписчиков» в CreateChannelScreen: поиск по контактам
      (`api.get('/api/users/contacts')`), список с чекбоксами, счётчик «Выбрано: N».
- [x] 2. После успешного создания канала — вызывает `api.addMember(chatId, userId)`
      для каждого выбранного через `Promise.allSettled`; ошибки по одному
      пользователю не роняют создание.
- [x] 3. `api.addMember` существует (`api.ts:245`), отдельный метод не нужен.
- [x] 4. Тест `packages/web/src/__tests__/screens/channel-invites.test.tsx`:
      5 тестов (рендер блока, загрузка контактов, поиск, счётчик, клик).
- [x] 5. `pnpm --filter @balloo/web test` → 274/274 passed; `pnpm --filter @balloo/web build` → exit 0 (7.89s).

## Проблемы и решения (если возникли)

- `api.getContacts()` возвращает `any[]`, типизировал через `interface Contact`.
- `Иван Иванов` в фикстурах совпадает с именем в админ-карточке — тесты фильтрации
  проверяют username (`@ivan`), а не displayName.

## Результат

`pnpm --filter @balloo/web test` → 274/274 passed (31 файлов)
`pnpm --filter @balloo/web build` → exit 0 (7.89s)

Артефакты:
- `packages/web/src/screens/channels/CreateChannelScreen.tsx` (добавлен блок invite)
- `packages/web/src/__tests__/screens/channel-invites.test.tsx` (создан, 5 тестов)
