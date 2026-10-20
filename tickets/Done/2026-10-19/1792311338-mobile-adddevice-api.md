# Тикет 1792311338 — Mobile: AddDeviceScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311338)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API добавления устройства (QR/код).

## Живое состояние
- Файл: `packages/mobile-android/src/screens/AddDeviceScreen.tsx`
- Текущий код: `Alert.alert('Успех', 'Устройство подключено')` — фейк
- API из web: `grep "api.*addDevice\|pairDevice" packages/web/src/screens/my-devices/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*device\|pair" packages/web/src/screens/my-devices/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить Alert на реальный API-вызов
- [ ] 4. Добавить loading state
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов вместо Alert
- loading state
- build зелёный

## Результат
