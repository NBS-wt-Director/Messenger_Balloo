# Тикет 1792137292 — Server: groupType/правила группы + GroupMediaRequest + заявка СМИ (реализация 1.1.18)

**Создан:** 16.10.2026 (unix 1792137292)
**Статус:** готов
**Источник запроса:** решение владельца 1.1.18 (16.10.2026) + правило 21
**Синхронизировано с:** `docs/03-database-schema.md` (модель GroupMediaRequest с
cert*-полями, коммит `6f64d79`), `docs/04-api-websocket-spec.md` (POST /groups/media),
`mockups/data_schema.json` (те же 7 полей).

## Цель

1. `POST /api/chats` (создание группы) сохраняет `groupType` и правила
   (`requireRules`, `rulesText`) — сейчас web шлёт их, сервер игнорирует.
2. Новая таблица `group_media_requests` (модель GroupMediaRequest) + миграция +
   загрузка свидетельства СМИ + заявка при создании группы типа «СМИ».
3. Очередь заявок в админке: `GET /admin/groups/media-requests`,
   `PUT /admin/groups/media-requests/:id` (уже описаны в docs/04, в коде нет).

## Живое состояние на момент создания (проверено командами)

- `chatController.createChat:23` — деструктурирует только
  `{ type, name, description, avatarUrl, memberIds }`; `groupType`/`settings` — игнор;
- Prisma: `model GroupMediaRequest` ОТСУТСТВУЕТ
  (`grep -n "GroupMediaRequest" packages/shared/prisma/schema.prisma` → пусто);
  `ChatSettings` без полей правил;
- Маршрутов media-requests нет: `grep -n "media" packages/server/src/routes/admin.ts` → пусто;
- Миграции: `packages/shared/prisma/migrations/` (последняя
  `20261016000100_drop_reports_target_fk`), применяются `migrate deploy` из entrypoint;
- Загрузка файлов: `routes/upload.ts` существует (переиспользовать для скана).

## Подзадачи

- [ ] 1. Prisma: `ChatSettings` + `requireRules Boolean @default(false)`,
      `rulesText String? @db.Text`; `Chat` + `groupType String?`
      (ordinary|public|media|corporate) — имена сверить с docs/03 при правке там.
- [ ] 2. Prisma: `model GroupMediaRequest` по docs/03 (certNumber, certIssuedAt,
      certIssuer, certMediaName, certFounder, certInn, certOgrn, documents Json,
      status, reviewedByAdminId, reviewComment).
- [ ] 3. Миграция `prisma migrate dev --name group_rules_media_requests` (имя —
      по факту), `migrate deploy` локально на `postgresql://balloo:balloo123@localhost:5432/balloo`.
- [ ] 4. `createChat`: принимать `groupType`, `settings.requireRules`,
      `settings.rules`; при `groupType==='media'` — обязательна заявка СМИ
      (400 без `mediaCert`-полей/файла, сообщение по ст. 9 Закона РФ «О СМИ»).
- [ ] 5. Создание GroupMediaRequest вместе с группой media (файл — URL из upload
      в `documents[]`).
- [ ] 6. Admin: `GET /admin/groups/media-requests?status=pending`,
      `PUT /admin/groups/media-requests/:id` (status/reviewComment) — по docs/04.
- [ ] 7. Тесты server (jest): создание группы с правилами сохраняется; media без
      документов → 400; с документами → заявка pending; admin approve.
- [ ] 8. `pnpm --filter @balloo/server test` и `pnpm --filter @balloo/server build`
      (tsc) → exit 0.

## Критерии готовности

- Миграция применена, схема совпадает с docs/03 и data_schema.json;
- round-trip: web payload → БД (проверка psql/тестом);
- admin endpoints живые; тесты/сборка зелёные; выводы в «Результат».

## Проблемы и решения (если возникли)

- `prisma migrate dev` требует TTY — использован `migrate diff` + shadow БД + `migrate deploy`.
- Redis/MinIO warnings в тестах — не ошибки, тесты зелёные (внешние сервисы не требуются для unit-тестов).

## Результат

`pnpm --filter @balloo/server build` → exit 0 (tsc)
`pnpm --filter @balloo/server test` → 628/628 passed (35 наборов)

Артефакты:
- `packages/shared/prisma/schema.prisma` (Chat.groupType, ChatSettings.requireRules/rulesText, GroupMediaRequest)
- `packages/shared/prisma/migrations/20261017000000_group_rules_media_requests/migration.sql`
- `packages/server/src/controllers/chatController.ts` (createChat: groupType, settings, mediaCert)
- `packages/server/src/routes/admin.ts` (GET/PUT /groups/media-requests)
