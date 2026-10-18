# Тикет 1792160009 — Схема БД: Attachment (1_01_25, 1_01_40)

**Создан:** 16.10.2026 (unix 1792160009)
**Статус:** в работе
**Источник:** аудит → Н-42
**Зависит от:** 1792160001

## Цель

Добавить модель `Attachment` для вложений чатов и панели вложений.

## Живое состояние

- `Attachment` — в data_schema есть, в Prisma — нет (есть `MessageAttachment` — проверить синонимичность).
- Компонент: `packages/web/src/components/chat/AttachmentPanel.tsx` — **УЖЕ ЕСТЬ** (210 строк, с тестом).
- Экраны: `chat-attachments.html`, `attachment-panel.html` — приняты.

## Подзадачи

- [x] 1. Attachment: id, messageId, type, url, storage, meta, createdAt.
- [x] 2. MessageAttachment = Attachment (синоним). Есть: id, messageId, type, url, thumbnail, size, name, width, height, duration.
- [x] 3. Синоним. Отдельную модель не создаём. Добавлены недостающие поля: storage, meta, createdAt.
- [x] 4. MessageAttachment обновлён полями storage, meta, createdAt.
- [x] 5. prisma db push → поля добавлены в БД.
- [x] 6. upload.ts есть: uploadController.uploadMessageFile, uploadService.
- [x] 7. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Модель `Attachment` в Prisma.
- Миграция создана.
- Загрузка вложений работает.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Attachment = MessageAttachment (синоним)
- Добавлены недостающие поля в MessageAttachment: storage, meta, createdAt
- prisma db push → поля добавлены в БД
- upload.ts с загрузкой файлов существует
- npm run build → exit 0
