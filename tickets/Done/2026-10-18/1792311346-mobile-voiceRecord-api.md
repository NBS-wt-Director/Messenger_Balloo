# Тикет 1792311346 — Mobile: VoiceRecordScreen — подключить API
**Статус:** готов

## Результат
Добавлены `api.uploadFile` + `api.sendMessage(chatId, { type: 'voice', content: url })` в обработчик `handleSend`. Добавлен chatId из route.params, error handling.
