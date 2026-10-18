# Тикет 1792160005 — Схема БД: Draft + Session (черновики, сессии)

**Создан:** 16.10.2026 (unix 1792160005)
**Статус:** в работе
**Источник:** аудит → Н-33 (черновики, сессии)
**Зависит от:** 1792160001

## Цель

Добавить модели `Draft` (черновики сообщений) и `Session` (сессии пользователей).

## Живое состояние

- `Draft` — в data_schema есть, в Prisma — нет.
- `Session` — в data_schema есть, в Prisma — нет (есть `Device` и `AccountDeviceLink`, но это устройства, не сессии).

## Подзадачи

- [x] 1. Draft: id, chatId, userId, text, updatedAt. Session: id, userId, deviceId, sessionToken, accessToken, refreshToken, ipAddress, userAgent, expires, isActive, createdAt, updatedAt. PairToken есть.
- [x] 2. Обе модели уже есть в schema.prisma (строки 1551, 1569), поля совпадают с data_schema.json.
- [x] 3. `prisma db push` выполнен — таблицы drafts, sessions, pair_tokens созданы в БД.
- [x] 4. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Две модели в Prisma.
- Миграция создана.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Модели Draft (1551) и Session (1569) — уже были в schema.prisma, поля совпадают с data_schema.json
- prisma db push → таблицы drafts, sessions, pair_tokens созданы в БД
- Проверка: SELECT tablename → drafts, sessions, pair_tokens (7 строк)
- npm run build → exit 0
