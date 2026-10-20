# Тикет 1792311335 — Web: ResetPasswordScreen — заменить fake API

**Создан:** 18.10.2026 (unix 1792311335)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Заменить `setTimeout` на реальный вызов API сброса пароля.

## Живое состояние
- Файл: `packages/web/src/screens/auth/ResetPasswordScreen.tsx`
- Строки 52, 76: `await new Promise(r => setTimeout(r, 500/1000))` — имитация
- API из web: `api.requestPasswordReset(email)` — проверить сигнатуру

## Подзадачи
- [x] 1. Найти существующий API: `api.ts:142 requestPasswordReset(email)` →
      `POST /api/auth/request-reset`; `api.ts:148 resetPassword(token, newPassword)` →
      `POST /api/auth/reset-password`. Сервер: `routes/auth.ts:67,70`, ссылка письма —
      `services/emailService.ts:166` → `${APP_URL}/#/reset-password?token=<token>`
- [x] 2. Заменить setTimeout на реальный API-вызов:
      - шаг 1 → шаг 2: только локальная валидация email (API не дёргается до капчи,
        иначе форма спамит `request-reset`);
      - шаг 2 «Отправить ссылку» (капча верна) → `api.requestPasswordReset(email)`;
      - шаг 4 «Сбросить пароль» → `api.resetPassword(tokenFromLink, newPassword)`;
      - `tokenFromLink = useSearchParams().get('token')` — токен из ссылки письма;
        при его наличии экран открывается сразу на шаге 4;
      - кнопка «Отправить повторно» (была без onClick) → `sendResetLink()` + cooldown 30 с;
      - имитация `await new Promise(r => setTimeout(...))` удалена из обоих обработчиков.
- [x] 3. Error handling: `try/catch` с выводом `err.message` в `error` на отправке
      письма и на сбросе; при отсутствии токена — явная ошибка + предупреждающий
      блок на шаге 4 (без токена сервер отвечает 400 «Токен и новый пароль обязательны»,
      `authController.ts:378`).
- [x] 4. `pnpm --filter @balloo/web build` — зелёный (`✓ built in 8.01s`)

## Критерии готовности
- setTimeout заменён на api.* ✓
- error handling ✓
- build зелёный ✓

## Проблемы и решения
- `setTimeout` для навигации на `/login` после успешного сброса (строка 107) оставлен
  сознательно: это задержка показа сообщения об успехе, а не имитация API.
- Хак из AGENTS.md («edit_file не работает с кириллическими путями») в этой сессии
  не понадобился — `edit_file` применил правки в `Рабочий стол/…` без ошибки.

## Результат

Команды и вывод (19.10.2026):

```
$ grep -n "setTimeout\|api\.\|tokenFromLink" packages/web/src/screens/auth/ResetPasswordScreen.tsx
19:  const tokenFromLink = searchParams.get('token') || '';
20:  const [step, setStep] = useState<ResetStep>(tokenFromLink ? 4 : 1);
64:      await api.requestPasswordReset(email.trim());
99:    if (!tokenFromLink) { setError('Ссылка из письма не найдена: токен сброса отсутствует'); return; }
105:      await api.resetPassword(tokenFromLink, newPassword);
107:      setTimeout(() => navigate('/login', { replace: true }), 2000);
186:            {!tokenFromLink && (

$ git --no-pager diff --stat
 packages/web/src/screens/auth/ResetPasswordScreen.tsx | 67 ++++++++++++++++++----
 1 file changed, 55 insertions(+), 12 deletions(-)

$ pnpm --filter @balloo/web build
✓ built in 8.01s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)
```

Имитация API (`new Promise(r => setTimeout(r, 500/1000))`) удалена, оба шага ходят
на реальные эндпоинты. Не проверялось: реальная отправка письма и полный цикл сброса
в браузере (нет SMTP и доступа к проду — см. AGENTS.md §1, «Не подтверждается»).
