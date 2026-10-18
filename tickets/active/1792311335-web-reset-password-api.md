# Тикет 1792311335 — Web: ResetPasswordScreen — заменить fake API

**Создан:** 18.10.2026 (unix 1792311335)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Заменить `setTimeout` на реальный вызов API сброса пароля.

## Живое состояние
- Файл: `packages/web/src/screens/auth/ResetPasswordScreen.tsx`
- Строки 52, 76: `await new Promise(r => setTimeout(r, 500/1000))` — имитация
- API из web: `api.requestPasswordReset(email)` — проверить сигнатуру

## Подзадачи
- [ ] 1. Найти существующий API: `grep -n "requestPasswordReset\|resetPassword" packages/web/src/services/api.ts`
- [ ] 2. Заменить setTimeout на реальный API-вызов
- [ ] 3. Добавить error handling
- [ ] 4. `pnpm --filter @balloo/web build`

## Критерии готовности
- setTimeout заменён на api.*
- error handling
- build зелёный

## Результат
