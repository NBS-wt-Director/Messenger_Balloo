# Тикет 1792311347 — Mobile: EmptyChatScreen — уточнить функционал

**Создан:** 18.10.2026 (unix 1792311347)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
EmptyChatScreen — UI-заглушка без API. Проверить нужен ли API (маскот Балунишка, кнопка "Начать чат").

## Живое состояние
- Файл: `packages/mobile-android/src/screens/EmptyChatScreen.tsx` (22 строки)
- Текущий код: только Text и View, нет кнопок, нет API
- API из web: `grep "api\.\w\+" packages/web/src/components/chat/EmptyChatState.tsx`

## Подзадачи
- [ ] 1. Прочитать web EmptyChatState — есть ли API?
- [ ] 2. Если есть — добавить навигацию "Начать чат"
- [ ] 3. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- UI корректный
- build зелёный

## Результат
