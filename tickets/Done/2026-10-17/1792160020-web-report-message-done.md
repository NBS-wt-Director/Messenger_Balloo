# Тикет 1792160020 — Web: экран «Жалоба на сообщение» (1_01_26)

**Создан:** 16.10.2026 (unix 1792160020)
**Статус:** в работе
**Источник:** аудит → Н-22

## Цель

Создать React-компонент `ReportMessageScreen` по макету `mockups/balloo-su/report-message.html`.

## Живое состояние

- `packages/web/src/screens/report-message/` — **ОТСУТСТВУЕТ**.
- API: `POST /api/reports` — по аудиту существует.

## Подзадачи

- [x] 1. Прочитал. Цитата сообщения, 7 причин (radio), комментарий, экран успеха с ID.
- [x] 2. Создан ReportMessageScreen.tsx: цитата, radio причины, комментарий, экран успеха.
- [x] 3. Добавлен маршрут /messages/:messageId/report.
- [x] 4. npm run build → exit 0 (7.07s).

**Команда проверки:**
```bash
cd packages/web && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Компонент создан, в роутере.
- `vite build` без ошибок.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Создан ReportMessageScreen.tsx: цитата, 7 причин (radio), комментарий, экран успеха с ID
- API метод createReport уже существовал
- Добавлен маршрут /messages/:messageId/report
- npm run build → exit 0
