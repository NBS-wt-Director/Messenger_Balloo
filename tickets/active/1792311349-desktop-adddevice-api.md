# Тикет 1792311349 — Desktop: DesktopAddDeviceScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311349)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API добавления устройства.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopAddDeviceScreen.tsx` (93 строки)
- Текущий код: нет API
- API из web: `grep "api.*addDevice\|pairDevice" packages/web/src/screens/my-devices/`

## Подзадачи
- [ ] 1. Найти API в web
- [ ] 2. Добавить `import { api } from '@balloo/web/services/api'`
- [ ] 3. Заменить mock на API-вызов
- [ ] 4. `pnpm --filter @balloo/desktop build`

## Критерии готовности
- API-вызов
- build зелёный

## Результат
