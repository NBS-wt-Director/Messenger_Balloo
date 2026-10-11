# а-03: проверка смены пароля и email — нужна ли повторная аутентификация

**Что смотрим:** `/api/auth/change-password`, смена email, `/api/auth/delete` (248+).

## Чек-лист

1. Смена пароля: требует ли **текущий пароль** (ищем `comparePassword`) и отзывает ли
   прочие refresh-сессии. Сейчас refresh не отзываются нигде
   (`исправить-отзыв-refresh-токенов.md`) — зафиксировать как найденное.
2. Смена email: подтверждение на **новый** адрес ссылкой; старый адрес уведомляется письмом.
3. После смены пароля/email — все существующие access-токены валидны до истечения
   (JWT без отзыва). Нужен `passwordChangedAt`/`tokensInvalidBefore` и проверка в
   `middleware/auth.ts`.
4. Удаление аккаунта (`/api/auth/delete:248-276`): требует пароль? (строки 258-260 —
   сверка с `user.password`). Проверить: каскад данных, 30-суточный буфер (`backups/30d`),
   отсутствие в `users_backup`.
5. Все эти ручки — под rate limit? (см. `исправить-rate-limit-auth-endpoints.md`).

Сделано: проверено 11.10.2026.
Решение: тикет закрыт как неактуальный.
Комментарий: ниже.

## Итог проверки (11.10.2026)

Ручек, перечисленных в чек-листе, на сервере **нет**:

- `change-password` / `changePassword` — `grep -rn "password" packages/server/src/routes/*.ts`
  даёт только `POST /reset-password` (строка 70); в сервисах — только
  `requestPasswordReset`/`resetPassword`;
- `POST/DELETE /api/auth/delete` — в `routes/auth.ts` единственный delete —
  `DELETE /devices/:deviceId` (отзыв устройства, `authRequired`);
- смены email нет: `grep -rn "changeEmail|updateEmail|newEmail" packages/server/src` → 0.

Пункты 1–5 проверять не на чём. Тикет составлен по несуществующим строкам
`routes/auth.ts:248+` — файл короче. Смена пароля возможна только через
`/forgot-password` → `/reset-password`, где с 11.10.2026 старые сессии отзываются
(`revokeAllSessions` в `resetPassword`).

Если владелец захочет смену пароля из настроек или удаление аккаунта — это
новые продуктовые тикеты (настройки в макетах есть: `profile.html`,
`privacy-settings.html`; точных экранов «смена пароля»/«удаление» не нашлось —
упоминания только в `rules.html`), не проверка существующего кода.
