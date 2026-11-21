# Тикет 1795270823 — Автосоздание контактов

**Создан:** 21.11.2026
**Статус:** в работе

---

## Проблема

Контакты в Balloo создаются только вручную (`POST /api/users/contacts/:userId`).
Из-за этого у реальных пользователей в проде контактов нет, хотя они общаются.

## Что делаем

Идемпотентный helper `ensureMutualContacts(userA, userB)`:
- создаёт обе записи `Contact` (A→B и B→A), если их ещё нет;
- не падает, если запись уже существует (`skipDuplicates`);
- игнорирует self-контакт (A === B).

## Где применяем

1. **Принятие приглашения** — если у ссылки стоит флаг `addToContacts`, принявший
   и пригласивший попадают друг другу в контакты.
2. **Регистрация по приглашению** — то же для нового пользователя.
3. **Создание direct-чата** — оба участника становятся контактами друг друга.

## Файлы

- `packages/server/src/services/userService.ts` — helper `ensureMutualContacts`
- `packages/server/src/services/inviteService.ts` — вызов при принятии
- `packages/server/src/services/chatService.ts` — вызов при создании direct
- `packages/server/src/services/authService.ts` — вызов при регистрации по инвайту

## Проверка

- [x] `tsc --noEmit` — 0 ошибок
- [x] Юнит-тест: повторный вызов не создаёт дублей (`invites-link-flow.test.ts`)
- [x] Тесты server зелёные (783/783)

## Выполнено

- `ensureMutualContacts` — `packages/server/src/services/userService.ts`
- Принятие приглашения → `inviteService.processAcceptance` (при флаге addToContacts)
- Регистрация по приглашению → `authService.register` → `applyInviteOnRegister`
- Звонок (direct-чат) → `callService.createCall`
- Service API: `POST /api/service/contacts/mutual`
