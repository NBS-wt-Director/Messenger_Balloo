# Тикет 1792311349 — Desktop: DesktopAddDeviceScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311349)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API добавления устройства.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopAddDeviceScreen.tsx` (93 строки)
- Текущий код: нет API
- API из web: `grep "api.*addDevice\|pairDevice" packages/web/src/screens/my-devices/`

## Подзадачи
- [x] 1. API: `api.createPairToken()` (`POST /api/devices/pair-token`) +
      `api.getPairStatus(token)` (`GET /api/devices/pair/:token/status`)
- [x] 2. Импорт `import { api } from '@balloo/web/services/api'`
- [x] 3. Заглушка «QR-код для подключения» заменена на реальный pair-token:
      таймер жизни кода, автообновление по истечении, статус `confirmed`,
      кнопка «Обновить код», код `balloo://pair/<token>`
- [x] 4. `pnpm --filter @balloo/desktop build` — зелёный

## Критерии готовности
- API-вызов
- build зелёный


## Проблемы и решения

- Экраны `packages/desktop/src/renderer/src/screens/*` экспортируются только из
  `screens/index.ts` и **нигде не монтируются**: `DesktopApp.tsx` рендерит
  `router` из `@balloo/web/router`, собственных роутов у desktop-пакета нет
  (`grep -rn "Route|createHashRouter" packages/desktop/src/renderer/src/*.tsx`
  даёт только `RouterProvider router={router}`). Поэтому правки этого тикета
  видны в сборке и типах, но в интерфейсе приложения экран пока не открывается —
  для показа нужен роут (отдельная задача, не входила в тикет).

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ pnpm --filter @balloo/desktop build        # tsc && vite build
✓ built (main.js 7.06 kB, preload.js 1.44 kB)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)
```

Не проверялось: запуск Electron-окна (на этой машине GUI-сессия приложения не
поднималась) — см. AGENTS.md §1.
