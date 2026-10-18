# Тикет 1792311341 — Mobile: ReportMessageScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311341)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API отправки жалобы.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/ReportMessageScreen.tsx`
- Текущий код: `setSubmitted(true)` — фейк, нет API
- API из web: `grep "api.*report\|createReport" packages/web/src/screens/report-message/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*report" packages/web/src/screens/report-message/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить setSubmitted на API-вызов
- [ ] 4. Добавить loading state
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Результат
