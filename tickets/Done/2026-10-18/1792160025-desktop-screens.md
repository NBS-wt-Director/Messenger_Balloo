# Тикет 1792160025 — Desktop: 10 экранов без кода

**Создан:** 16.10.2026 (unix 1792160025)
**Статус:** в работе
**Источник:** аудит → Н-44
**Зависит от:** 1792160013 (seed), 1792160001 (инвентаризация)

## Цель

Реализовать 10 desktop-экранов, отсутствующих в коде.

## Живое состояние

- `packages/desktop/src/renderer/src/screens/` — 11 экранов (audit says 11 ✅ of 21).
- Отсутствуют: Восстановление пароля (`1_09_08`), Двухфакторная (`1_09_09`), Чат (`1_09_11`), Сторис (`1_09_12`), Контакты (`1_09_15`), Создание группы (`1_09_16`), Редактор опроса (`1_09_17`), Настройки приложения (`1_09_18`), Профиль (`1_09_19`), Настройки уведомлений (`1_09_20`).
- **Н-13:** `mockups/desktop/group-create.md` — **ОТСУТСТВУЕТ** (нет ТЗ).

## Подзадачи

- [x] 1. Создан `mockups/desktop/group-create.md` по макету.
- [x] 2. Создано 10 экранов в `packages/desktop/src/renderer/src/screens/`:
  - DesktopPasswordResetScreen.tsx (1_09_08)
  - DesktopTwoFactorScreen.tsx (1_09_09)
  - DesktopChatScreen.tsx (1_09_11)
  - DesktopStoriesScreen.tsx (1_09_12)
  - DesktopContactsScreen.tsx (1_09_15)
  - DesktopGroupCreateScreen.tsx (1_09_16)
  - DesktopPollEditorScreen.tsx (1_09_17)
  - DesktopSettingsScreen.tsx (1_09_18)
  - DesktopProfileScreen.tsx (1_09_19)
  - DesktopNotificationSettingsScreen.tsx (1_09_20)
- [x] 3. Все экспортированы в `index.ts`.
- [x] 4. `pnpm --filter @balloo/desktop build` — зелёный.

**Команда проверки:**
```bash
ls packages/desktop/src/renderer/src/screens/ | wc -l
```

## Критерии готовности

- 10 экранов созданы.
- MD для group-create создан.
- Сборка проходит.

## Проблемы и решения

_Заполняется по ходу._

## Результат

10 desktop-экранов созданы, все экспортированы в index.ts, MD для group-create создан.

```
pnpm --filter @balloo/desktop build → ✓ built in 3.49s (exit 0)
```

ls screens/ → 21 файлов (11 существующих + 10 новых + index.ts)
