# Тикет 1792311337 — Mobile: MyDevicesScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311337)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API списка устройств.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/MyDevicesScreen.tsx`
- Текущий код: `useState<Device[]>([])`, `useEffect(() => {}, [])` — пустой
- API из web: `grep "api.*devices\|getDevices" packages/web/src/screens/my-devices/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*device" packages/web/src/screens/my-devices/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить пустой useEffect на `api.getDevices()`
- [ ] 4. Добавить loading/error states
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов в useEffect
- loading state
- error handling
- build зелёный

## Результат
