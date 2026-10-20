# Тикет 1792311336 — Mobile: CallHistoryScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311336)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API истории звонков.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/CallHistoryScreen.tsx`
- Текущий код: `useState<Call[]>([])`, `useEffect(() => { setLoading(false); }, [])` — пустой useEffect
- API из web: `grep "api.*calls\|getCalls" packages/web/src/screens/calls/`

## Подзадачи
- [x] 1. API: `api.getCallHistory(filter?, page?, limit?)` → `GET /api/calls` (mobile api.ts:569)
- [x] 2. Импорт `api` добавлен
- [x] 3. Пустой `useEffect` заменён на `load()` с `api.getCallHistory()`
- [x] 4. loading + error + кнопка «Повторить»
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов в useEffect
- loading state
- error handling
- build зелёный

## Проблемы и решения

Маппинг ответа сервера (`packages/server/src/services/callService.ts:54`):
`contactName → peerName`, `timestamp`, `duration`, `type` (incoming/outgoing/missed).
Дополнительно починены обращения к теме (`colors.bg/text/muted` → `bgPrimary/textPrimary/textSecondary`),
которые и давали ошибки tsc в этом файле.

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
