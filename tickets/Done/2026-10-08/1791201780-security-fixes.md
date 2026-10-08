# 1791201780 — Security audit fixes (05.10.2026)

**Создан:** 05.10.2026 (unix 1791201780)
**Статус:** готов (08.10.2026)
**Источник:** аудит безопасности 05.10.2026 (фактические проверки кода)
**Связь:** docs/12-security-audit.md (актуализация 01.10, §6.2)

## Цель

Исправить 8 проблем, найденных при фактической проверке кода (не по памяти).
Каждая подзадача — отдельный шаг с верификацией.

## Подзадачи

### [x] 1. Удалить authController_old_backup.ts
**Критичность:** 🔴
**Что:** `packages/server/src/controllers/authController_old_backup.ts` — мертвый файл с устаревшим кодом аутентификации. В коде не импортируется никем.
**Как:** `rm packages/server/src/controllers/authController_old_backup.ts`
**Разрешение владельца:** ✅ получено — `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` §18.1 = «да». (Прежняя пометка «позже — не удалять» устарела: владелец ответил позже.)
**Доказательство (08.10.2026):** `test -f …` → `FILE ABSENT`; `git status --porcelain` → `D  packages/server/src/controllers/authController_old_backup.ts`; `grep -r "authController_old_backup"` → 0 импортов; `tsc --noEmit` exit 0; `pnpm --filter @balloo/server test` 578/578 зелёные

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

### [x] 5. Инвалидация refresh-токена при logout
**Критичность:** 🟡
**Что:** `packages/server/src/services/authService.ts:457` — `logout()` не инвалидирует refresh-токен. Украденный refresh остаётся валидным 30 дней.
**Как (факт реализации):** вместо `tokenVersion` в `User` применён серверный отзыв по метке времени в Redis — `packages/server/src/services/sessionRevocation.ts` (`revokeAllSessions`/`isSessionRevoked`, ключ `revoked-at:<userId>`, fail-open). Проверка встроена в `authRequired` и `authRefresh` (`packages/server/src/middleware/auth.ts:78,139`) и в `refreshTokens`; `logout(allDevices)` и `revokeDevice` зовут `revokeAllSessions`. Причина отхода от плана: не требует миграции схемы и отзывает в т.ч. уже выданные access-токены.
**Доказательство (08.10.2026):** `pnpm --filter @balloo/server exec jest --testPathPattern=session-revocation` — 1 набор зелёный (в полном прогоне 578/578); тесты `session-revocation.test.ts`: access-токен до отзыва → 401 `token_revoked`, refresh после отзыва → 401 `token_revoked`

### [x] 6. Content-Disposition: attachment для загруженных файлов
**Критичность:** 🟡
**Что:** загруженные файлы отдавались без `Content-Disposition: attachment` — браузер мог отрендерить PDF/документ inline.
**Как (факт реализации):** `packages/server/src/services/uploadService.ts:168-176` — `uploadToMinIO` пишет в метаданные объекта `Content-Disposition: attachment; filename="…"; filename*=UTF-8''…`; имя санитизируется (`sanitizeDownloadName`, защита от инъекции заголовка). Применяется ко всем загрузкам (аватар, вложение, история).
**Доказательство (08.10.2026):** `upload-service-depth.test.ts` — тест «Content-Disposition: attachment с реальным именем файла (задача 6)» зелёный; в полном прогоне 578/578

### [x] 7. Проверка magic bytes при загрузке документов
**Критичность:** 🟡
**Что:** `fileFilter` проверял только `file.mimetype` (заголовок клиента, подделываемый). Документы сохранялись без проверки содержимого.
**Как (факт реализации):** `packages/server/src/services/uploadService.ts:27-46,77-95,445` — таблица `MAGIC_BYTES` (PDF `%PDF`, docx/xlsx `PK\x03\x04`, OGG `OggS`, WAV `RIFF`, изображения) + `validateMagicBytes`, вызывается из `validateFileType` и `uploadStoryMedia`. Заявленный MIME, не совпавший с содержимым, отклоняется.
**Доказательство (08.10.2026):** `upload-service-depth.test.ts` — тест «подмена MIME: .exe с contentType application/pdf → 400 (задача 7)» и «docx с корректной ZIP-подписью проходит проверку» — зелёные; в полном прогоне 578/578

### [x] 8. GET /api/users/me/export (152-ФЗ, docs/12 §6.2)
**Критичность:** 🟡 (High в docs/12)
**Что:** Требование 152-ФЗ: экспорт данных пользователя.
**Как (факт реализации):** маршрут `packages/server/src/routes/users.ts:35` → `exportMe` (`userController.ts:209`) → `exportUserData` (`userService.ts:442`) — собирает профиль, устройства, OAuth-аккаунты, 2FA (без секретов), чаты, сообщения, реакции, истории, опросы, донаты, фич-реквесты, репорты, блог, базу знаний, заявки, поддержку, ботов, блокировки, баны, push-подписки. Отдаётся JSON-файлом: `Content-Disposition: attachment; filename="balloo-data-export.json"`. Секреты (`passwordHash`, TOTP-`secret`, `backupCodes`, OAuth-токены, `pushToken`) исключены.
**Доказательство (08.10.2026):** `users.test.ts` — `describe('GET /api/users/me/export')` зелёный (200 + структура); в полном прогоне 578/578

### [x] 9. DELETE /api/users/me (self-service account deletion, docs/12 §6.2)
**Критичность:** 🟡 (Medium в docs/12)
**Что:** `DELETE /api/users/me` отсутствовал; клиентский `api.deleteUser` звал несуществующий маршрут.
**Как (факт реализации):** маршрут `packages/server/src/routes/users.ts:30` → `deleteMe` (`userController.ts:189`) → сервис `deleteMe` (`userService.ts:892`) — мягкое удаление: `status='deleted'` + email заменяется на `<id>.deleted@invalid` (освобождает `@unique`-адрес для повторной регистрации). Вход перестаёт работать: `authRequired`/`refreshTokens` отклоняют не-`active`. Повторное удаление → 410 Gone, несуществующий → 404.
**Доказательство (08.10.2026):** `users.test.ts` — `describe('DELETE /api/users/me')` зелёный (200, затем `GET /api/users/me` → 401); в полном прогоне 578/578

### [x] 10. Server-side password validation (docs/12 §6.2)
**Критичность:** 🟡 (Medium в docs/12)
**Что:** контроллер регистрации проверял лишь непустоту пароля. Минимум 8 символов был только на фронте (`RegisterScreen.tsx`).
**Как (факт реализации):** `packages/server/src/controllers/authController.ts:52-70` — `registerSchema` (Zod): `email` — валидный email, `password` — `min(8)`, `username` — опционально 1–50. При провале → 400 с сообщением первого нарушения.
**Доказательство (08.10.2026):** `auth.test.ts` — «rejects too-short password (server-side, min 8) — задача 10» зелёный; в полном прогоне 578/578

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

1. **Пункт 5 реализован иначе, чем в плане.** План предлагал `tokenVersion` в `User` + миграцию. Фактически применён отзыв сессий по метке времени в Redis (`sessionRevocation.ts`), без изменения схемы. Результат тот же (refresh/access после logout не работают), плюс отзываются уже выданные access-токены. Оставлено как есть — работает и покрыто тестами.
2. **Пункт 1: противоречие в самом тикете.** Изначальная пометка «Решение владельца: позже — не удалять» устарела. В `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` §18.1 владелец ответил «да». Файл на момент проверки уже удалён и поставлен в индекс (`D`). Подтверждено: файла нет, импортов нет.
3. **Флейк в `ws-room.test.ts`.** Первый полный прогон `pnpm --filter @balloo/server test` упал по таймауту в `RoomManager.setTyping` (setTimeout 5 c). Повторный прогон — 32/32 набора, 578/578 тестов зелёные. Флейк не связан с правками этого тикета; зафиксирован как наблюдение.
4. **Пункт 8: срок ссылки 24 ч из плана не реализован.** Выгрузка отдаётся синхронно одним JSON-файлом (без временного хранилища и одноразовой ссылки). Для 152-ФЗ этого достаточно; отход от плана отмечен явно.

## Результат

Все пункты 1–11 закрыты. Проверки (08.10.2026):

| Проверка | Команда | Результат |
|---|---|---|
| Серверные тесты | `pnpm --filter @balloo/server test` | 32 набора, **578 тестов зелёные** |
| Целевые тесты (security) | `jest --testPathPattern="(users\|session-revocation\|upload-service-depth\|auth-service-depth\|auth)"` | 7 наборов, 184 теста зелёные |
| Типы сервера | `pnpm --filter @balloo/server exec tsc --noEmit` | exit **0** |
| Сборка web | `pnpm --filter @balloo/web build` | `✓ built in 7.30s`, exit **0** |
| Тесты web | `pnpm --filter @balloo/web test` | 22 файла, **216 тестов зелёные** |
| Sentry в коде | `grep -ri "Sentry" packages/` | **0 совпадений** |
| Мёртвый файл | `test -f …/authController_old_backup.ts` | **FILE ABSENT** (staged `D`) |

Не проверялось (нет доступа): реальный `curl` на MinIO-объект с `Content-Disposition` — проверено unit-тестом метаданных `putObject`; прод-поведение не подтверждалось.
