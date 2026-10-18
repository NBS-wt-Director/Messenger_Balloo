# Тикет 1792160004 — Схема БД: MessageEdit + PinnedMessage (1_01_32, 1_01_04)

**Создан:** 16.10.2026 (unix 1792160004)
**Статус:** в работе
**Источник:** аудит → Н-36, Н-24
**Зависит от:** 1792160001

## Цель

Добавить модели `MessageEdit` (история редактирования) и `PinnedMessage` (закреплённые сообщения).

## Живое состояние

- `MessageEdit` — в data_schema есть, в Prisma — нет. MD `message-editor.md` строки 53–59 требуют историю изменений.
- `PinnedMessage` — в data_schema есть, в Prisma — нет.
- Экран `1_01_32` Редактор сообщения — React-компонент **ОТСУТСТВУЕТ** (активный тикет 1792137291 не покрывает).

## Подзадачи

- [x] 1. Обе модели есть в data_schema.json. MessageEdit: id, messageId, oldText, newText, editedAt. PinnedMessage: id, chatId, messageId, pinnedBy, createdAt.
- [x] 2. Обе модели уже есть в schema.prisma (строки 1522, 1536), поля совпадают с data_schema.json.
- [~] 3. Миграция не требуется — модели уже в схеме.
- [x] 4. Добавлено: prisma.messageEdit.create в updateMessage (messageService.ts). PinnedMessage.upsert в pinMessage.
- [x] 5. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Две модели в Prisma.
- Миграция создана.
- PUT /messages/:id сохраняет историю в MessageEdit.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- MessageEdit и PinnedMessage — модели уже были в schema.prisma
- updateMessage: добавлен prisma.messageEdit.create — история сохраняется при PUT /messages/:id
- pinMessage: добавлен prisma.pinnedMessage.upsert — запись в PinnedMessage при закреплении
- npm run build → exit 0
