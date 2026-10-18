# Тикет 1792311350 — Desktop: DesktopChatAttachmentsScreen — подключить API
**Статус:** готов

## Результат
Подключён `api.getChatAttachments(chatId, type)` в useEffect. Добавлен prop `chatId`, loading state. `pnpm --filter @balloo/desktop build` — зелёный.
