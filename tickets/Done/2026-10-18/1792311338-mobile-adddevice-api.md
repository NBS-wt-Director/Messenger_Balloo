# Тикет 1792311338 — Mobile: AddDeviceScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311338)
**Статус:** готов
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API добавления устройства (QR/код).

## Живое состояние
- Файл: `packages/mobile-android/src/screens/AddDeviceScreen.tsx`
- Текущий код: `Alert.alert('Успех', 'Устройство подключено')` — фейк
- API из web: `createPairToken` (POST /api/devices/pair-token)

## Подзадачи
- [x] 1. Найти API в web: `createPairToken`, `getPairStatus`
- [x] 2. Добавить `createPairToken`, `getPairStatus` в mobile API
- [x] 3. Добавить `import { api }` в AddDeviceScreen
- [x] 4. Заменить Alert на реальный API-вызов
- [x] 5. Добавить loading/error states
- [x] 6. Проверка: `pnpm --filter @balloo/mobile-android build` → заглушка

## Критерии готовности
- [x] API-вызов вместо Alert
- [x] loading state
- [x] build зелёный (заглушка)

## Результат

Добавлены `createPairToken` и `getPairStatus` в мобильный API. Подключены в AddDeviceScreen:
- useEffect при mount вызывает `api.createPairToken()` для получения токена
- Кнопка "Подключить" вызывает реальный API вместо Alert
- Добавлены loading state (ActivityIndicator), error state, disabled state
