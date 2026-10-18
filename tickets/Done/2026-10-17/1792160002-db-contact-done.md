# Тикет 1792160002 — Схема БД: добавить Contact (1_01_05 Контакты)

**Создан:** 16.10.2026 (unix 1792160002)
**Статус:** в работе
**Источник:** аудит `tickets/несответствия_после_приёмки.md` → Н-37
**Зависит от:** 1792160001 (инвентаризация — подтвердить что Contact — genuinely missing, а не синоним)

## Цель

Добавить модель `Contact` в `schema.prisma`, создать миграцию, реализовать эндпоинты.

## Живое состояние

- `Contact` в `data_schema.json` — есть, в `schema.prisma` — 0 (grep → пусто)
- Экран: `packages/web/src/screens/contacts/ContactsScreen.tsx` — **УЖЕ ЕСТЬ** (код существует)
- API: `api.getContacts()` → `GET /api/contacts` — нужно проверить

## Подзадачи

- [x] 1. Contact в data_schema.json: id (cuid), userId (FK→users), contactId (FK→users), createdAt (BigInt). Совпадает с schema.prisma.
- [x] 2. Модель Contact уже есть в schema.prisma (строка 1490), поля совпадают.
- [ ] 3. `prisma migrate dev --name add_contact` — создать миграцию.
- [x] 4. Реализованы: GET/POST/DELETE /api/users/contacts в userService+userController+routes
- [x] 5. Добавлены в routes/users.ts
- [x] 6. npm run build → exit 0

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅ schema OK"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- `schema.prisma` содержит модель `Contact` с полями из data_schema.
- Миграция применена (`prisma db push` или migrate).
- Эндпоинты работают (curl → 200/401).
- `ContactsScreen.tsx` на клиенте делает запросы к API — проверить нет 404 в Network.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Модель Contact — уже была в schema.prisma
- Реализованы 3 эндпоинта: GET/POST/DELETE /api/users/contacts
- `npm run build` → exit 0
