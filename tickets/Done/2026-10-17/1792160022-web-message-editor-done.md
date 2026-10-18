# Тикет 1792160022 — Web: экран «Редактор сообщения» (1_01_32)

**Создан:** 16.10.2026 (unix 1792160022)
**Статус:** в работе
**Источник:** аудит → Н-24, Н-36
**Зависит от:** 1792160004 (MessageEdit модель)

## Цель

Создать React-компонент `MessageEditorScreen` по макету `mockups/balloo-su/message-editor.html`.

## Живое состояние

- `packages/web/src/screens/message-editor/` — **ОТСУТСТВУЕТ**.
- `ChatViewScreen.tsx` (387 строк) содержит `MessageBubble` — базовое отображение сообщений, но **не редактор**.
- `AttachmentPanel.tsx` (210 строк) — панель вложений, часть редактора.
- Принято с условием: редактировать только свои сообщения, единая форма.

## Подзадачи

- [x] 1. Прочитал. Модалка: markdown панель, textarea, счётчик, превью, история, кнопки.
- [x] 2. Создан MessageEditorScreen.tsx: markdown toolbar, textarea, preview, история, save/delete.
- [~] 3. AttachmentPanel уже в ChatViewScreen; в редакторе — кнопка 📎.
- [x] 4. Добавлен маршрут /messages/:messageId/edit.
- [x] 5. npm run build → exit 0 (7.32s).

**Команда проверки:**
```bash
cd packages/web && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Компонент создан, в роутере.
- `vite build` без ошибок.
- Редактирование только своих сообщений (проверка `senderId === currentUserId`).

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Создан MessageEditorScreen.tsx: markdown toolbar, textarea, preview, история изменений
- Только свои сообщения (senderId === user.id)
- Добавлен API метод getMessageHistory
- Добавлен маршрут /messages/:messageId/edit
- npm run build → exit 0
