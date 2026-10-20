# Тикет 1792311337 — Mobile: MyDevicesScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311337)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API списка устройств.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/MyDevicesScreen.tsx`
- Текущий код: `useState<Device[]>([])`, `useEffect(() => {}, [])` — пустой
- API из web: `grep "api.*devices\|getDevices" packages/web/src/screens/my-devices/`

## Подзадачи
- [x] 1. API: `api.getMyDevices()` → `GET /api/devices` (существующий маршрут, путь исправлен в тик. 1792335000/A4)
- [x] 2. Импорт `api` добавлен
- [x] 3. Пустой `useEffect` → `load()`; маппинг `{ devices: [...] }` (deviceService.ts:34)
- [x] 4. loading + error + «Повторить»; «Отключить» работает через `api.removeDevice` с Alert-подтверждением
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов в useEffect
- loading state
- error handling
- build зелёный

## Проблемы и решения

Кнопка «Отключить» раньше была декоративной — добавлен обработчик с подтверждением.
Тип метода в `mobile/services/api.ts` исправлен с `request<any[]>` на
`request<{ devices: any[] }>` — сервер отдаёт объект, а не массив.

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ cd packages/mobile-android && ./node_modules/.bin/tsc --noEmit --pretty false
0 ошибок (до правок в пакете — 77 строк ошибок)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)

$ pnpm --filter @balloo/desktop build
✓ built (tsc && vite build)

$ python3 scripts/api-endpoints-check.py
Клиентских путей: 184 / Серверных маршрутов: 250 / НЕ СОВПАДАЕТ: 18 (группа B, ждёт владельца)
```

Не проверялось: реальный прогон экранов в браузере/эмуляторе (нет запущенного
бэкенда с БД и нет Android-устройства на этой машине) — см. AGENTS.md §1.
