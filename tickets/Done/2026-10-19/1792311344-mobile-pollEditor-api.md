# Тикет 1792311344 — Mobile: PollEditorScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311344)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API создания опроса.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/PollEditorScreen.tsx`
- Текущий код: кнопка без onClick
- API из web: `grep "api.*createPoll\|poll" packages/web/src/screens/polls/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*poll" packages/web/src/screens/polls/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Добавить onClick на кнопку создания
- [ ] 4. Добавить loading/success/error states
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов
- loading/success/error states
- build зелёный

## Результат
