# Тикет 1792311356 — Desktop: DesktopSettingsScreen — проверить UI

**Создан:** 18.10.2026 (unix 1792311356)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
DesktopSettingsScreen — локальные настройки. UI без API.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopSettingsScreen.tsx` (87 строк)
- Текущий код: локальные useState, нет API
- API: не требуется (настройки хранятся локально)

## Подзадачи
- [ ] 1. UI соответствует макету?
- [ ] 2. `pnpm --filter @balloo/desktop build`

## Критерии готовности
- UI корректный
- build зелёный

## Результат
