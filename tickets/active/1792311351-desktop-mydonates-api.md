# Тикет 1792311351 — Desktop: DesktopMyDonatesScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311351)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API списка донатов.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopMyDonatesScreen.tsx` (104 строки)
- Текущий код: `useState([])` — пустой
- API из web: `grep "api.*donat\|getMyDonates" packages/web/src/screens/my-donates/`

## Подзадачи
- [ ] 1. Найти API в web
- [ ] 2. Добавить `import { api } from '@balloo/web/services/api'`
- [ ] 3. Заменить пустой useState на API-вызов
- [ ] 4. `pnpm --filter @balloo/desktop build`

## Критерии готовности
- API-вызов
- build зелёный

## Результат
