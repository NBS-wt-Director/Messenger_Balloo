# Тикет 1792311340 — Mobile: ChatAttachmentsScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311340)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API вложений чата.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/ChatAttachmentsScreen.tsx`
- Текущий код: `attachments: Record<Tab, Att[]> = { images: [], ... }` — статические данные
- API из web: `grep "api.*attachments\|getChatFiles" packages/web/src/screens/chat-attachments/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*attach\|file" packages/web/src/screens/chat-attachments/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить статические данные на API-вызов
- [ ] 4. Добавить loading state
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Результат
