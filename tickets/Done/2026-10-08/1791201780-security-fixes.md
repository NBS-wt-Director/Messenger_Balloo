# 1791201780 — Security audit fixes (05.10.2026)

**Создан:** 05.10.2026 (unix 1791201780)
**Статус:** в работе
**Источник:** аудит безопасности 05.10.2026 (фактические проверки кода)
**Связь:** docs/12-security-audit.md (актуализация 01.10, §6.2)

## Цель

Исправить 8 проблем, найденных при фактической проверке кода (не по памяти).
Каждая подзадача — отдельный шаг с верификацией.

## Подзадачи

### [ ] 1. Удалить authController_old_backup.ts (458 строк)
**Критичность:** 🔴
**Что:** `packages/server/src/controllers/authController_old_backup.ts` — мертвый файл с устаревшим кодом аутентификации. В коде не импортируется никем.
**Как:** `rm packages/server/src/controllers/authController_old_backup.ts`
**Зависимость:** ⛔ нужно явное разрешение владельца (workspace-правило 7: показ содержимого + OK). Запрошено в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` §18. **Решение владельца: позже** — не удалять.
**Доказательство:** `tsc --noEmit` зелёный, `pnpm test` зелёный, файл удалён `git status`

### [x] 2. Заменить inputSanitizer на output escaping
**Критичность:** 🔴
**Что:** `packages/server/src/middleware/security.ts:110-116` — `inputSanitizer` срезает `<[^>]+>` из всех строк на сервере. Текст `1 < 2` превращается в `1 2` — пользователь теряет данные. Должен применяться только на фронтенде при рендере.
**Как:** Удалить `inputSanitizer` из `app.ts` (строка подключения). XSS-защита — CSP (уже есть) + фронтенд-экскейпинг (React по умолчанию экскейпит JSX).
**Доказательство:** `tsc --noEmit` зелёный; новый тест: `POST /api/chats/:id/messages` с телом `{text: "1 < 2 > 3"}` → ответ 200, текст сохранён как `1 < 2 > 3`

### [x] 3. Добавить timingSafeEqual в verifyTOTP + compare backup codes
**Критичность:** 🟡
**Что:** `packages/server/src/services/authService.ts:61` — `totpCode === tokenNum` и `backupCodes.indexOf(input.code)` — не timing-safe. Теоретическая уязвимость к timing-атаке на TOTP-код (6 цифр, но ±1 window = 3 попытки за 30 сек; при брутфорсе через API — уже ограничен 5/мин `authLimiter`).
**Как:** Заменить `===` на `crypto.timingSafeEqual(Buffer.from(String(totpCode)), Buffer.from(String(tokenNum)))`. Для backup codes: переписать цикл с аккумулированием сравнения.
**Доказательство:** `pnpm --filter @balloo/server exec jest --testPathPattern=auth-service-depth` зелёный

### [x] 4. Добавить state-параметр в OAuth authorize URL
**Критичность:** 🟡
**Что:** `packages/server/src/services/authService.ts:679-705` — `getOAuthAuthorizeUrl` не генерирует и не проверяет `state`. Уязвимость к CSRF на callback.
**Как:** В `getOAuthAuthorizeUrl` генерировать `crypto.randomBytes(32).toString('hex')`, писать в httpOnly cookie `oauth-state`, передавать в URL. На callback-эндпоинтах сравнивать `req.query.state` с cookie.
**Доказательство:** `pnpm --filter @balloo/server exec jest --testPathPattern=middleware-auth` зелёный; новый тест: callback без state → 403

### [ ] 5. Инвалидация refresh-токена при logout
**Критичность:** 🟡
**Что:** `packages/server/src/services/authService.ts:418-427` — `logout()` только `console.log`, не инвалидирует refresh-токен. Украденный refresh остаётся валидным 30 дней.
**Как:** Добавить поле `tokenVersion: Int @default(0)` в `model User` (schema.prisma:120). При каждом `generateTokens`/`refreshTokens` — инкремент `tokenVersion` в БД. В `authRequired` и `refreshTokens` — проверять `user.tokenVersion === decoded.tokenVersion`. При `logout` — инкрементировать. При `revokeDevice` — инкрементировать.
**Доказательство:** `pnpm --filter @balloo/server exec jest` зелёный; миграция применена; `logout` → новый refresh не проходит

### [ ] 6. Content-Disposition: attachment для загруженных файлов
**Критичность:** 🟡
**Что:** `packages/server/src/services/uploadService.ts:115` — отдаёт `Content-Type`, но без `Content-Disposition: attachment`. Браузер может отрендерить PDF/документ inline, обнажая данные при XSS.
**Как:** Добавить `'Content-Disposition': 'attachment; filename="${fileName}"'` к заголовкам отдачи.
**Доказательство:** `curl` на загруженный PDF → `Content-Disposition: attachment`

### [ ] 7. Проверка magic bytes при загрузке документов
**Критичность:** 🟡
**Что:** `packages/server/src/routes/upload.ts:26-55` — `fileFilter` проверяет `file.mimetype` (заголовок клиента, подделываемый). Документы (PDF, docx, xlsx) сохраняются без проверки содержимого.
**Как:** Добавить функцию `checkMagicBytes(buffer, mimeType)` — проверка первых байт (PDF: `%PDF`, docx/xlsx: `PK\x03\x04`, OGG: `OggS`, WAV: `RIFF`). Использовать вместо/дополнительно к mimetype filter.
**Доказательство:** `POST` с `.exe` файлом и mimetype `application/pdf` → 400

### [ ] 8. GET /api/users/me/export (152-ФЗ, docs/12 §6.2)
**Критичность:** 🟡 (High в docs/12)
**Что:** Требование 152-ФЗ: экспорт данных пользователя. Эндпоинта нет.
**Как:** `GET /api/users/me/export` → авторизованный → `prisma.user.findUnique` + все связанные сущности (чаты, сообщения, устройства, донаты) → JSON-файл, 24ч срок ссылки, скачивание через `downloadController` → один раз.
**Доказательство:** `GET /api/users/me/export` → 200 JSON

### [ ] 9. DELETE /api/users/me (self-service account deletion, docs/12 §6.2)
**Критичность:** 🟡 (Medium в docs/12)
**Что:** `DELETE /api/users/me` отсутствует; клиентский `api.deleteUser` зовёт несуществующий маршрут.
**Как:** `DELETE /api/users/me` → authRequired → soft-delete `User.status = 'deleted'` + хешировать email/username/phone, удалить все связанные данные (чаты, сообщения, устройства, донаты) — или сделать `User.status = 'deleted'` с удалением PII через cron (30 дней).
**Доказательство:** `DELETE /api/users/me` → 200, `GET /api/users/me` → 401

### [ ] 10. Server-side password validation (docs/12 §6.2)
**Критичность:** 🟡 (Medium в docs/12)
**Что:** `packages/server/src/controllers/authController.ts:66` — сервер проверяет лишь непустоту пароля. Минимум 8 символов — только на фронте (`RegisterScreen.tsx:112`).
**Как:** Добавить Zod-валидацию `z.string().min(8)` в контроллер регистрации.
**Доказательство:** `POST /api/auth/register` с паролем из 3 символов → 400

### [x] 11. Удалить комментарии про Sentry (Vite, docs/07)
**Критичность:** 🟢
**Что:** `packages/web/vite.config.ts:49` — комментарий `// Source maps для продакшена (для Sentry в будущем)`. `api-services-guide.md` запрещает Sentry до v2.
**Как:** Удалить строку.
**Доказательство:** `grep "Sentry"` по `packages/` — 0 совпадений

## Критерии готовности

- `pnpm build` зелёный
- `pnpm test` зелёный (все тесты + новые)
- `tsc --noEmit` 0 ошибок
- `grep "Sentry"` по `packages/` — 0 совпадений
- `rm authController_old_backup.ts` подтверждён

## Проблемы и решения

(заполняется по ходу)

## Результат

(заполняется по итогам)
