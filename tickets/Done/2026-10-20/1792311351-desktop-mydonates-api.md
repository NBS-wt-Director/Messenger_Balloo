# Тикет 1792311351 — Desktop: DesktopMyDonatesScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311351)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API списка донатов.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopMyDonatesScreen.tsx` (104 строки)
- Текущий код: `useState([])` — пустой
- API из web: `grep "api.*donat\|getMyDonates" packages/web/src/screens/my-donates/`

## Подзадачи
- [x] 1. API: `api.getMyDonations()` → `GET /api/payments/me/donations`
- [x] 2. Импорт `import { api } from '@balloo/web/services/api'`
- [x] 3. Моки (3 записи «Патрон/Сторонник») удалены; маппинг `{ donations: [...] }`
- [x] 4. loading / error + «Повторить» / пустое состояние
- [x] 5. `pnpm --filter @balloo/desktop build` — зелёный

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

- Попутно исправлен контракт в web-клиенте: `api.getMyDonations` был типизирован
  `any[]`, сервер отдаёт объект `{ donations, total, page, limit }`
  (`paymentService.ts:473`). Без правки `tsc` desktop-сборки падал с
  `Property 'donations' does not exist on type 'any[]'`.
- В `packages/web/src/screens/my-donates/MyDonatesScreen.tsx` чтение
  `donationsData || []` заменено на `donationsData?.donations ?? []` — иначе web-экран
  получал объект и рисовал пустой список (и `total` считался по `undefined`).

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
