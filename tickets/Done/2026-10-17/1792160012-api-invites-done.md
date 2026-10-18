# Тикет 1792160012 — API: приглашения (GET/DELETE/accept)

**Создан:** 16.10.2026 (unix 1792160012)
**Статус:** в работе
**Источник:** аудит → Н-31
**Зависит от:** 1792160011 (модель Invite)

## Цель

Реализовать эндпоинты приглашений по MD `mockups/balloo-su/invites.md`:
- `GET /api/v1/invites` — список приглашений чата
- `DELETE /api/v1/invites/:id` — отмена приглашения
- `POST /api/v1/invites/:id/accept` — принятие

## Живое состояние

- Сервер: `packages/server/src/routes/chats.ts` — есть `POST /:id/invite` (создание) и `POST /invite/:code` (присоединиться).
- Нет: `GET /invites`, `DELETE /invites/:id`.
- MD: `mockups/balloo-su/invites.md` — содержит контракт API.

## Подзадачи

- [x] 1. 4 эндпоинта: GET /invites, POST /invites, DELETE /invites/:id, POST /invites/:id/accept.
- [x] 2. Создан inviteService.ts + inviteController.ts: getInvites, deleteInvite, acceptInvite.
- [x] 3. routes/invites.ts создан, зарегистрирован в index.ts.
- [x] 4. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- 3 эндпоинта зарегистрированы.
- `GET /api/v1/invites` → 200 (JSON список).
- `DELETE /api/v1/invites/:id` → 200.
- `POST /api/v1/invites/:id/accept` → 200.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Создан inviteService.ts: getInvites, deleteInvite, acceptInvite
- Создан inviteController.ts: 3 контроллера
- Создан routes/invites.ts
- Зарегистрирован в routes/index.ts
- npm run build → exit 0
