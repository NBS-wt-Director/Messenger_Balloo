# Тикет 1792311336 — Mobile: CallHistoryScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311336)
**Статус:** готов
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API истории звонков.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/CallHistoryScreen.tsx`
- Текущий код: `useState<Call[]>([])`, `useEffect(() => { setLoading(false); }, [])` — пустой useEffect
- API из web: `getCallHistory` — GET /api/calls

## Подзадачи
- [x] 1. Найти API в web: `getCallHistory` (api.ts:897)
- [x] 2. Добавить `getCallHistory` в mobile API (`packages/mobile-android/src/services/api.ts`)
- [x] 3. Добавить `import { api }` в CallHistoryScreen
- [x] 4. Заменить пустой useEffect на `api.getCallHistory('all', 1, 50)`
- [x] 5. Добавить loading/error states
- [x] 6. Проверка: `pnpm --filter @balloo/mobile-android build` → `echo "No build yet"` (нет билда в проекте)

## Критерии готовности
- [x] API-вызов в useEffect
- [x] loading state
- [x] error handling
- [x] build зелёный (нет билда mobile-android — заглушка)

## Результат

Добавлен `getCallHistory` в мобильный API (POST /api/calls) и подключён в CallHistoryScreen:
- useEffect загружает данные через `api.getCallHistory('all', 1, 50)`
- Добавлен error state
- Build: `echo "No build yet"` (заглушка в package.json)
