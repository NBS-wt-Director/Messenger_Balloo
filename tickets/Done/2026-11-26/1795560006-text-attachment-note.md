# Тикет 1795560006 — Текстовое вложение (заметка)

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Симптом

Не создаётся окно создания текстового вложения при вызове из сообщения; нет кнопок для текстовых вложений в форме вложений.

## Диагноз

1. `QUICK_ACTIONS` в `AttachmentPanel.tsx:55-63` содержит: Фото/Видео/Документ/Скриншот/Аудио/Файл/С камеры. **Нет «Текст/Заметка»**.
2. `NON_FILE_ACTIONS` (`:66-70`) содержит: Опрос/Геолокация/Контакт. **Нет текстового вложения**.
3. Сервер `attachmentType()` (`:35-43`) распознаёт `text` MIME-тип и расширения `.txt|.md|.csv|.json|.log|.xml|.yml|.yaml|.ini` — значит поддержка на уровне `messageService.attachments[].type` есть, но UI не даёт создать заметку в памяти (без файла).

## План

- [x] 1. Добавить в `NON_FILE_ACTIONS` пункт `{ icon: '📝', label: 'Текст', route: 'note' }`.
- [x] 2. Создать компонент `TextNoteModal.tsx`: textarea, кнопка «Отправить» → создаёт Blob из текста (`new Blob([text], {type: 'text/plain'})`) → `new File([blob], 'note.txt', {type:'text/plain'})` → вызывает `api.uploadFile` → `api.sendMessage(chatId, { type:'file', attachments:[{type:'text', url, size, name}] })`.
- [x] 3. Подключить модалку в `ChatViewScreen.tsx` рядом с VoiceMessageModal.
- [x] 4. Проверить что `messageService` корректно обрабатывает `type: 'text'` в attachments.
- [x] 5. Проверки: `tsc --noEmit web`, `vitest web`, `vite build`.

## Результат

**Сделано:**
- новый `web/src/components/chat/TextNoteModal.tsx` — textarea → Blob(text/plain) → File → `api.uploadFile` → `api.sendMessage(type:'file', attachments:[{type:'text',...}])`;
- `AttachmentPanel.tsx`: в `NON_FILE_ACTIONS` добавлен пункт `📝 Текст` (action:'note') + проп `onTextNote`;
- `ChatViewScreen.tsx`: состояние `textNoteOpen` + рендер `<TextNoteModal>`.

**Проверено:** tsc web EXIT 0; vitest web 404 passed; vite build OK.
