# Тикет 1792311340 — Mobile: ChatAttachmentsScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311340)
**Статус:** готов

## Подзадачи
- [x] 1. Найти API: `getChatAttachments(chatId, type, query?)` (GET /api/chats/:id/attachments)
- [x] 2. Добавить `getChatAttachments` в mobile API
- [x] 3. Заменить статические данные на API-вызов (зависит от chatId + tab)
- [x] 4. Добавить loading state
- [x] 5. Проверка: build (заглушка)

## Результат

Подключён `api.getChatAttachments(chatId, tab)` в ChatAttachmentsScreen:
- useEffect при mount и смене таба загружает вложения
- Добавлен ActivityIndicator для loading state
- chatId берётся из `route.params.chatId`
