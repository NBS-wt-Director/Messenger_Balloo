# Тикет 1795560007 — Опрос: форма создания вместо экрана опроса

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Симптом

Вместо формы создания опроса вызывается экран опроса.

## Диагноз

1. `AttachmentPanel.tsx:338` ведёт на `/chat/${chatId}/poll` (без pollId).
2. `router/index.tsx:583` определяет маршрут `chat/:chatId/poll` без pollId.
3. `PollScreen.tsx:539-544`: `mode` по умолчанию `'view'`, `poll` = null.
4. `PollScreen.tsx:600-606`: при `poll === null` и `mode === 'view'` рендерится «Опрос не найден» вместо `CreatePollView`.
5. `loadPoll` (`:547-558`) не вызывается если pollId undefined.

## План

- [x] 1. `PollScreen.tsx`: если `pollId` undefined → `setMode('create')` сразу (в useEffect при монтировании).
- [x] 2. Убедиться что `CreatePollView` корректно принимает `chatId` из URL-параметров.
- [x] 3. Проверить что `handleCreate` (`:560-578`) шлёт `chatId` и создаёт опрос.
- [x] 4. Тест: зайти в `/chat/abc/poll` → сразу форма создания.
- [x] 5. Проверки: `tsc --noEmit web`, `vitest web`, `vite build`.

## Результат

**Сделано:** `PollScreen.tsx` — `useEffect`: если `pollId` отсутствует → `setMode('create')` сразу (раньше mode='view' + poll=null → «Опрос не найден»). Добавлен импорт `useEffect`.

**Проверено:** tsc web EXIT 0; vitest web 404 passed; vite build OK.
