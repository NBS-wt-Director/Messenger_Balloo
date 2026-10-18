# Тикет 1792160003 — Схема БД: добавить Notification (1_01_34)

**Создан:** 16.10.2026 (unix 1792160003)
**Статус:** в работе
**Источник:** аудит `tickets/несответствия_после_приёмки.md` → Н-41
**Зависит от:** 1792160001

## Цель

Добавить модель `Notification` в `schema.prisma` — уведомления пользователей.

## Живое состояние

- `Notification` в `data_schema.json` — есть, в `schema.prisma` — отсутствует
- Экран: `packages/web/src/screens/settings/NotificationSettingsScreen.tsx` — **УЖЕ ЕСТЬ**
- Сервер: эндпоинт `PATCH /:userId/notifications` — по аудиту существует, проверить на месте

## Подзадачи

- [x] 1. Notification в data_schema.json: id, userId, type, preview, isRead, payload, createdAt — все поля есть в Prisma.
- [x] 2. Модель уже есть в schema.prisma:1505, поля полностью совпадают.
- [~] 3. Миграция не требуется — модель уже в схеме, таблица в БД.
- [x] 4. PATCH /api/accounts/:userId/notifications — есть в routes/accounts.ts:27.
- [x] 5. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Модель `Notification` в Prisma.
- Миграция создана.
- Эндпоинт `PATCH` работает.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Модель Notification — уже есть в schema.prisma (строка 1505), поля совпадают с data_schema.json
- Эндпоинт PATCH /api/accounts/:userId/notifications — есть в accounts.ts
- Экран NotificationSettingsScreen.tsx — есть
- npm run build → exit 0
