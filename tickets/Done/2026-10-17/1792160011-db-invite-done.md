# Тикет 1792160011 — Схема БД: добавить Invite (1_01_13 Приглашения)

**Создан:** 16.10.2026 (unix 1792160011)
**Статус:** в работе
**Источник:** аудит → Н-31, Н-18
**Зависит от:** 1792160001

## Цель

Добавить модель `Invite` — приглашения в чаты/группы.

## Живое состояние

- `Invite` в data_schema — есть.
- `InviteLink` в Prisma — проверить, синоним ли.
- Экран: `packages/web/src/screens/invites/` — **ОТСУТСТВУЕТ**.
- Сервер: `POST /:id/invite` (создание), `POST /invite/:code` (присоединиться) — по аудиту существуют.
- Нет: `GET /invites` (список), `DELETE /invites/:id` (отмена).

## Подзадачи

- [x] 1. Invite: id, token, creatorId, groupIds, status, ttlType, expiresAt, createdAt, updatedAt.
- [x] 2. InviteLink = Invite (синоним). Есть: id, chatId, creatorId, code, maxUses, usedCount, expiresAt, createdAt.
- [x] 3. Синоним. Добавлены недостающие поля: status, ttlType, groupIds, updatedAt.
- [x] 4. prisma db push → поля добавлены в БД.
- [x] 5. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Модель `Invite` в Prisma.
- Миграция создана.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Invite = InviteLink (синоним)
- Добавлены недостающие поля: status, ttlType, groupIds, updatedAt
- prisma db push → поля добавлены в БД
- npm run build → exit 0
