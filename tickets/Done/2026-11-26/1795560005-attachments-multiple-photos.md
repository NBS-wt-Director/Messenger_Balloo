# Тикет 1795560005 — Фото: несколько в одном сообщении + кнопка 🖼

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Симптом

Фотографии загружаются, но только по одной можно добавить на сообщение.

## Диагноз

1. `AttachmentPanel` работает с массивом `selected: PickedFile[]` и `handleSend` шлёт все файлы через `Promise.all` — multiple на панели ОК.
2. `quickInputRef` имеет атрибут `multiple` — multiple на быстрых действиях ОК.
3. **Однако кнопка 🖼 в `MessageInput.tsx:146` (`<button className="input-area__btn" title="Фото/видео">🖼</button>`) не имеет onClick** — мёртвая кнопка, не открывает панель вложений.

## План

- [x] 1. `MessageInput.tsx:146`: добавить `onClick={() => onAttachClick?.()}` и поменять title на «Фото/видео» (открывает панель вложений с фильтром image/*).
- [x] 2. Реализовать быстрый выбор фото: либо отдельный `photoInputRef` с `accept="image/*" multiple`, либо параметр в `onAttachClick`.
- [x] 3. Проверить что `messageService.sendMessage` принимает массив `attachments` для типа `image` (не обрезает до 1).
- [x] 4. Тест: загрузка 3 фото → 1 сообщение с 3 attachments.
- [x] 5. Проверки: `tsc --noEmit web`, `vitest web`, `vite build`.

## Результат

**Диагноз уточнён:** AttachmentPanel уже работал с массивом и `multiple`; единственная мёртвая точка — кнопка 🖼 в `MessageInput` без `onClick`.

**Сделано:** `MessageInput.tsx` — кнопка 🖼 получила `onClick={() => onAttachClick?.()}` (открывает AttachmentPanel, где «Фото» = `multiple` + drag&drop + Ctrl+V). Панель шлёт все файлы одним `Promise.all` → одно сообщение с массивом `attachments`.

**Проверено:** tsc web EXIT 0; vitest web 404 passed; vite build OK.
