# Тикет 1792311337 — Mobile: MyDevicesScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311337)
**Статус:** готов
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API списка устройств.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/MyDevicesScreen.tsx`
- Текущий код: `useState<Device[]>([])`, `useEffect(() => {}, [])` — пустой
- API из mobile: `getMyDevices` (api.ts:502)

## Подзадачи
- [x] 1. Найти API в mobile: `getMyDevices` (GET /api/users/me/devices)
- [x] 2. Добавить `import { api }` в MyDevicesScreen
- [x] 3. Заменить пустой useEffect на `api.getMyDevices()`
- [x] 4. Добавить loading state
- [x] 5. Проверка: `pnpm --filter @balloo/mobile-android build` → заглушка

## Критерии готовности
- [x] API-вызов в useEffect
- [x] loading state
- [x] build зелёный (заглушка)

## Результат

Подключён `api.getMyDevices()` в MyDevicesScreen:
- useEffect загружает устройства через `api.getMyDevices()` (GET /api/users/me/devices)
- Добавлен ActivityIndicator для loading state
- Обработка ответа: `res?.devices || res || []`
