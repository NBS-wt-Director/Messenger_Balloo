# Тикет 1792311344 — Mobile: PollEditorScreen — подключить API
**Статус:** готов

## Результат
Подключён `api.createPoll(chatId, { question, options, allowsMultiple })` (POST /api/chats/:id/polls). Добавлены loading, error states, chatId из route.params.
