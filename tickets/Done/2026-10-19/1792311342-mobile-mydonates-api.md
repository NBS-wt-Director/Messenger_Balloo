# Тикет 1792311342 — Mobile: MyDonatesScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311342)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API списка донатов.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/MyDonatesScreen.tsx`
- Текущий код: `useState<Donation[]>([])`, `useEffect(() => {}, [])` — пустой
- API из web: `grep "api.*donat\|getMyDonates" packages/web/src/screens/my-donates/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*donat" packages/web/src/screens/my-donates/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить пустой useEffect на API-вызов
- [ ] 4. Добавить loading state
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Результат
