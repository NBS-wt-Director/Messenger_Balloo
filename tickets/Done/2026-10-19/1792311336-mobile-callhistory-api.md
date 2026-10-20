# Тикет 1792311336 — Mobile: CallHistoryScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311336)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API истории звонков.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/CallHistoryScreen.tsx`
- Текущий код: `useState<Call[]>([])`, `useEffect(() => { setLoading(false); }, [])` — пустой useEffect
- API из web: `grep "api.*calls\|getCalls" packages/web/src/screens/calls/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*call" packages/web/src/screens/calls/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить пустой useEffect на API-вызов
- [ ] 4. Добавить loading/error states
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов в useEffect
- loading state
- error handling
- build зелёный

## Результат
