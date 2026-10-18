# Тикет 1792160015 — Web: экран «Активный звонок» (1_01_11)

**Создан:** 16.10.2026 (unix 1792160015)
**Статус:** в работе
**Источник:** аудит → Н-17
**Зависит от:** 1792160007 (Call модель)

## Цель

Создать React-компонент `ActiveCallScreen` по макету `mockups/balloo-su/active-call.html`.

## Живое состояние

- `packages/web/src/screens/active-call/` — **ОТСУТСТВУЕТ**.
- Активный тикет 1792137287 реализует «Звонки» (список истории), но не активный звонок.
- Макет: `mockups/balloo-su/active-call.html`.

## Подзадачи

- [x] 1. Прочитал. Полноэкранный звонок: header, main speaker, participants strip, controls.
- [x] 2. Создан ActiveCallScreen.tsx: таймер, mute/video/screen toggle, hangup, participants strip.
- [x] 3. Добавлен маршрут /active-call в router/index.tsx.
- [x] 4. npm run build → exit 0 (6.85s).

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

- Создан ActiveCallScreen.tsx: header с таймером, main speaker, participants strip, controls (mute/video/screen/hangup)
- Добавлен маршрут /active-call
- Добавлен метод API endCall
- npm run build → exit 0
