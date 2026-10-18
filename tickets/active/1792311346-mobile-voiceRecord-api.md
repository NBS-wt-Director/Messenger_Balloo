# Тикет 1792311346 — Mobile: VoiceRecordScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311346)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API отправки голосового сообщения.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/VoiceRecordScreen.tsx`
- Текущий код: `setTimeout(() => navigation?.goBack?.(), 1500)` — фейковая отправка
- API из web: `grep "api.*uploadFile\|sendMessage.*voice" packages/web/src/components/chat/VoiceMessageModal.tsx`

## Подзадачи
- [ ] 1. Найти API в web (VoiceMessageModal): `grep -n "api\.\w\+" packages/web/src/components/chat/VoiceMessageModal.tsx`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить setTimeout на API-вызов (uploadFile + sendMessage)
- [ ] 4. Добавить loading state
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов вместо setTimeout
- loading state
- build зелёный

## Результат
