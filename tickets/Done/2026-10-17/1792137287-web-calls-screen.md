# Тикет 1792137287 — Web: экран «Звонки» с цветопиктограммами (реализация 1_01_10, приёмка 1.1.14)

**Создан:** 16.10.2026 (unix 1792137287)
**Статус:** готов
**Источник запроса:** решение владельца 1.1.14 (16.10.2026) + правило 21
**Тикет приёмки макета:** `Done/2026-10-16/1792132872` (→ 6.38)

## Цель

Экран истории звонков отсутствует в web-коде. Реализовать по принятому макету
`mockups/balloo-su/calls.html`: список звонков со статусами в виде
**цветопиктограмм** (зелёный круг ✓ принят/исходящий, красный круг ✕ пропущен),
без текстовых чипов «Принят/Пропущен».

## Живое состояние на момент создания (проверено командами)

- Сервер ЕСТЬ: `packages/server/src/routes/calls.ts:10` — `GET /` (getCallHistoryCtrl);
- Web НЕТ: `grep -n "calls" packages/web/src/router/index.tsx` → пусто;
  `find packages/web/src -iname "*call*"` → пусто;
- API-клиент: проверить `grep -n "calls" packages/web/src/services/api.ts`;
- Макет: `mockups/balloo-su/calls.html` — принят 16.10.2026 (цветопиктограммы).

## Подзадачи

- [x] 1. `api.getCallHistory()` в `packages/web/src/services/api.ts` — уже был (строка 897: `GET /api/calls`).
- [x] 2. `packages/web/src/screens/calls/CallsScreen.tsx`: заголовок «Звонки», подзаголовок «История всех звонков», кнопки 📞/📹, список (аватар, имя, подстрока «📹 Видео • Принятый • 12:30 • 0:45:23», пиктограмма статуса).
- [x] 3. Маршрут `/calls` в `packages/web/src/router/index.tsx` (строка ~489).
- [x] 4. Пиктограмма статуса: `<span>` круг 20px, фон `--accent`/`#e74c3c`, символ ✓/✕, `title` для доступности; текстовых чипов нет.
- [x] 5. Тест `packages/web/src/__tests__/screens/calls.test.tsx`: 7 тестов, все зелёные.
- [x] 6. `pnpm --filter @balloo/web test` → 269/269 passed; `pnpm --filter @balloo/web build` → exit 0 (8.09s).
- [x] 7. Добавлен пункт «📞 Звонки» в Sidebar (`packages/web/src/components/sidebar/Sidebar.tsx`).

## Критерии готовности

- `/calls` открывается, данные с реального API;
- статусы — только пиктограммы (grep по CallsScreen: нет «Принят»/«Пропущен» в чипах);
- тесты зелёные, сборка зелёная; выводы команд в «Результат».

## Проблемы и решения (если возникли)

- Тесты на пиктограммы: поиск по `style.backgroundColor.includes('4d')` не работает с CSS-переменными `var(--accent, #2db84d)` → переключился на `span[title="Принятый"]`.

## Результат

`pnpm --filter @balloo/web test` → 269/269 passed (30 файлов, 8.17s)
`pnpm --filter @balloo/web build` → exit 0 (8.09s, tsc + vite build)

Артефакты:
- `packages/web/src/screens/calls/CallsScreen.tsx` (создан)
- `packages/web/src/__tests__/screens/calls.test.tsx` (создан, 7 тестов)
- `packages/web/src/router/index.tsx` (маршрут `/calls`)
- `packages/web/src/components/sidebar/Sidebar.tsx` (пункт «📞 Звонки»)
