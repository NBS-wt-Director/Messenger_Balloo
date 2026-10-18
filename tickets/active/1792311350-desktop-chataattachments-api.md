# Тикет 1792311350 — Desktop: DesktopChatAttachmentsScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311350)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API вложений чата.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopChatAttachmentsScreen.tsx` (126 строк)
- Текущий код: `useState<Attachment[]>([])` — пустой
- API из web: `grep "api.*attachments\|getChatFiles" packages/web/src/screens/chat-attachments/`

## Подзадачи
- [ ] 1. Найти API в web
- [ ] 2. Добавить `import { api } from '@balloo/web/services/api'`
- [ ] 3. Заменить пустой useState на API-вызов
- [ ] 4. `pnpm --filter @balloo/desktop build`

## Критерии готовности
- API-вызов
- build зелёный

## Результат
