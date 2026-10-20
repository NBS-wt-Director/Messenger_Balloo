# Тикет 1792477132-03 — Смена пароля из настроек + блок email (код)

**Создан:** 20.10.2026 (unix 1792477132)
**Статус:** активен
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

- [ ] 1. Сервер: `POST /api/users/me/password/send-code` — генерация 6-значного
      кода, TTL, отправка на email пользователя (переиспользовать emailService и
      модель токенов подтверждения).
- [ ] 2. Сервер: `POST /api/users/me/password` `{ code, newPassword, confirmPassword }`
      — проверка кода, смена хэша, инвалидация прочих сессий (решение по
      существующей модели Session/User), аудит-лог.
- [ ] 3. Тесты сервера: успех, неверный код, истёкший код, пароль не совпал,
      не-аутентифицирован. `pnpm --filter @balloo/server test` зелёные.
- [ ] 4. Web `SettingsScreen.tsx`: карточка «Смена пароля» — кнопка + скрытая форма
      3 полей, вызовы из п.1–2, ошибки под полями. Тест компонента.
- [ ] 5. Desktop `DesktopSettingsScreen`: то же. Mobile `SettingsScreen.tsx`: то же.
- [ ] 6. Блок «Подтверждение email» на экранах сброса пароля: **web — уже есть**
      (`ResetPasswordScreen.tsx:213-214`, ссылка «Отправить письмо» — заглушка,
      подключить к существующему resend-эндпоинту подтверждения email);
      **desktop — добавить** (`DesktopPasswordResetScreen.tsx` блока нет, grep → 0);
      **mobile — проверить** `auth/ResetPasswordScreen.tsx` и добавить при отсутствии.
      Не ломать существующий flow reset.
- [ ] 7. `pnpm --filter @balloo/web build`, `pnpm --filter @balloo/desktop build`,
      `pnpm test` — зелёные.

## Критерии готовности

- Смена пароля работает из настроек на трёх клиентах (код на email).
- Экран сброса содержит блок подтверждения email на трёх клиентах.
- Тесты сервера + web зелёные; билды exit 0.

## Вне объёма (правило §17.1)

Ничего не-MVP1 сюда не тянуть: только эти два сценария.

## Результат

(заполняется по ходу)
