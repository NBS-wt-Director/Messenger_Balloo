# Тикет 1792160018 — Web: экран «Мои устройства» (1_01_21)

**Создан:** 16.10.2026 (unix 1792160018)
**Статус:** в работе
**Источник:** аудит → Н-20

## Цель

Создать React-компонент `MyDevicesScreen` по макету `mockups/balloo-su/my-devices.html`.

## Живое состояние

- `packages/web/src/screens/my-devices/` — **ОТСУТСТВУЕТ**.
- `packages/web/src/screens/settings/SettingsScreen.tsx` содержит фрагмент настроек устройства (:617, :744).
- `packages/web/src/screens/auth/AddDeviceScreen.tsx` — **УЖЕ ЕСТЬ** (добавление устройства).
- API: `GET /devices` — по аудиту существует.

## Подзадачи

- [x] 1. Прочитал. Статистика, текущее устройство (accent border), другие устройства, остановить сессию, завершить все.
- [x] 2. Создан MyDevicesScreen.tsx: статистика, карточки устройств, переименование, остановка сессий, опасная зона.
- [x] 3. Добавлен маршрут /my-devices.
- [x] 4. npm run build → exit 0 (7.09s).

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

- Создан MyDevicesScreen.tsx: статистика, текущее устройство, другие устройства, переименование, остановка сессий
- Добавлены API методы: renameDevice, stopSession, stopAllOtherSessions
- Добавлен маршрут /my-devices
- npm run build → exit 0
