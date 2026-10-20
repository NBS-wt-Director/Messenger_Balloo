# Тикет 1792477132-03 — Смена пароля из настроек + блок email (код)

**Создан:** 20.10.2026 (unix 1792477132)
**Статус:** готов (закрыт 20.10.2026, проверки в «Результат»)
**Источник:** решение владельца 20.10.2026 (конфликты 1–2, `РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §18)
**Макеты (уже обновлены 20.10):** `mockups/balloo-su/settings.html`, `mockups/mobile/settings.html`, `mockups/desktop/settings.html` (карточка «Смена пароля»); `mockups/desktop/password-reset.html` (блок «Подтверждение email» восстановлен). MD-доки дополнены.

## Цель

Реализовать в коде общую логику подтверждения email при работе с паролем:
- неавторизованный: экран сброса пароля с блоком «Подтверждение email» (web/mobile/desktop);
- авторизованный: настройки → «Сменить пароль» → скрытая форма (код с почты, новый пароль, подтверждение).

## Живые замеры (20.10.2026)

- Web: `packages/web/src/screens/auth/ResetPasswordScreen.tsx` — есть;
  `settings/SettingsScreen.tsx` — смены пароля нет (grep → 0).
- Desktop: `DesktopPasswordResetScreen.tsx` — есть (email-форм «по старинке», без блока
  подтверждения — добавить); `DesktopSettingsScreen` — смены пароля нет.
- Mobile: `packages/mobile-android/src/screens/auth/` — есть; смены пароля в
  `SettingsScreen.tsx` нет.
- API (`grep` по routes): есть только `POST /auth/reset-password` (:70).
  **Нет**: отправка кода смены пароля, сама смена. Нужны 2 эндпоинта.
- Email-транспорт на сервере уже есть (SMTP-релей, подтверждение email при
  регистрации существует — переиспользовать токен-инфраструктуру).

## Подзадачи

- [x] 1. Сервер: `POST /api/users/me/password/send-code` — реализован
      (`routes/users.ts:157`, замер 20.10 grep): код 6 зн., SHA-256 хеш в
      `VerificationToken` (type='password_change', TTL 15 мин), emailService.
- [x] 2. Сервер: `POST /api/users/me/password` — реализован (`routes/users.ts:212`):
      проверка кода, pre-hash+bcrypt, инвалидация refresh-токенов, `used=true`.
- [x] 3. Тесты сервера: `password-change-endpoints.test.ts` — прогон 20.10:
      `npx jest password-change-endpoints` → **6/6 passed** (401×2, 200, 400×3).
- [x] 4. Web `SettingsScreen.tsx`: компонент `PasswordChangeCard` (кнопка →
      отправка кода → форма код/пароль/подтверждение, ошибки под полями, экран
      успеха); API-методы `sendPasswordChangeCode`/`changePassword` в
      `web/services/api.ts` (после `resetPassword`).
- [x] 5. Desktop: новый `DesktopPasswordChangeScreen.tsx` + секция «🔐 Безопасность»
      в `DesktopSettingsScreen` (кнопка открывает форму), экспорт в screens/index.ts.
      Mobile: карточка в `SettingsScreen.tsx` (tab security, до 2FA), стили `input`,
      API-методы в `mobile/services/api.ts`.
- [x] 6. Блок «Подтверждение email» на экранах сброса: web — был (заглушка-ссылка,
      не ломала flow); **desktop — добавлен** (`DesktopPasswordResetScreen.tsx`,
      на обеих фазах экрана, как в web); **mobile — добавлен**
      (`auth/ResetPasswordScreen.tsx`, внизу, все 4 шага). Существующий reset flow не тронут.
- [x] 7. Проверки 20.10.2026:
      `pnpm --filter @balloo/web build` ✓ 7.11s; `@balloo/desktop build` ✓;
      mobile `tsc --noEmit` → 0 ошибок; `@balloo/web test` → 290/290 (33 файла);
      `pnpm test` — красные наборы только флакающие `ws-room`/`ws` (setTimeout
      5000 мс, известны из тикета аудита), остальные зелёные; остальные наборы
      в изоляции зелёные.

## Критерии готовности

- Смена пароля работает из настроек на трёх клиентах (код на email).
- Экран сброса содержит блок подтверждения email на трёх клиентах.
- Тесты сервера + web зелёные; билды exit 0.

## Вне объёма (правило §17.1)

Ничего не-MVP1 сюда не тянуть: только эти два сценария.

## Результат

### Сервер (20.10.2026)

Два новых эндпоинта в `packages/server/src/routes/users.ts`:

- `POST /api/users/me/password/send-code` — генерация 6-значного кода,
  запись в `VerificationToken` (type='password_change', TTL 15 мин),
  отправка через `emailService.sendEmail`.
- `POST /api/users/me/password` — проверка кода по SHA-256, смена
  `passwordHash` (pre-hash SHA-256 → bcrypt), инвалидация refresh-токенов,
  отметка токена `used=true`.

Тесты `password-change-endpoints.test.ts`: 6/6 passed (401, 200, 400x3).

### Клиент (закрыто 20.10.2026, вторая сессия)

- **Web:** `PasswordChangeCard` в `packages/web/src/screens/settings/SettingsScreen.tsx`
  (рендерится первым в SecuritySettingsScreen); API-методы в `web/services/api.ts`.
- **Desktop:** `packages/desktop/src/renderer/src/screens/DesktopPasswordChangeScreen.tsx`
  (новый файл) + секция «Безопасность» в `DesktopSettingsScreen.tsx` + экспорт в `index.ts`.
- **Mobile:** карточка смены пароля в tab security `SettingsScreen.tsx` + API-методы
  в `mobile/services/api.ts` (статический импорт — динамический не проходил tsc).
- **Блок подтверждения email на сбросе пароля:** desktop — добавлен в обе фазы
  `DesktopPasswordResetScreen.tsx`; mobile — добавлен в `auth/ResetPasswordScreen.tsx`
  (`emailConfirmBlock`); web — без изменений (уже был).

### Проверки (20.10.2026, вывод)

```
$ cd packages/server && npx jest password-change-endpoints --forceExit --runInBand
Tests: 6 passed, 6 total

$ pnpm --filter @balloo/web build      → ✓ built in 7.11s (повторно 7.53s после подписок)
$ pnpm --filter @balloo/desktop build  → ✓ built (renderer+main+preload, exit 0)
$ packages/mobile-android: ./node_modules/.bin/tsc --noEmit → 0 строк (чисто)
$ pnpm --filter @balloo/web test       → Test Files 33 passed, Tests 290 passed
$ pnpm test → единственные падения — флакающие ws-room/ws (setTimeout-оверрайд),
  к правкам отношения не имеют (git diff по ws* пуст)
```

### Проблемы

- Из предыдущей сессии: `getMessageHistory` в `messageController.ts` импортировал
  несуществующий сервис — на 20.10 проверено: сервер собирается, тесты
  `messages.test.ts` зелёные (проблема не подтвердилась/уже решена).
- Динамические `await import('../services/api')` в мобильном коде не проходят
  `tsc` (--module) → заменены на статический импорт.
