# Тикет 1792311335 — Web: ResetPasswordScreen — заменить fake API

**Создан:** 18.10.2026 (unix 1792311335)
**Статус:** готов
**Источник:** инвентаризация 1792311334

## Цель
Заменить `setTimeout` на реальный вызов API сброса пароля.

## Живое состояние
- Файл: `packages/web/src/screens/auth/ResetPasswordScreen.tsx`
- Строки 52, 76: `await new Promise(r => setTimeout(r, 500/1000))` — имитация
- API из web: `api.requestPasswordReset(email)` — проверить сигнатуру

## Подзадачи
- [x] 1. Найти существующий API: `grep -n "requestPasswordReset\|resetPassword" packages/web/src/services/api.ts` → `requestPasswordReset(email)`, `resetPassword(token, password)`
- [x] 2. Заменить setTimeout на реальный API-вызов → `api.requestPasswordReset(email)`, `api.resetPassword(token, newPassword)`
- [x] 3. Добавить error handling — уже было, подтверждено
- [x] 4. `pnpm --filter @balloo/web build` → зелёный, 7.48s

## Критерии готовности
- [x] setTimeout заменён на api.*
- [x] error handling
- [x] build зелёный

## Результат

Заменены два `setTimeout` на реальные API-вызовы:
- `handleRequestReset`: `api.requestPasswordReset(email)` (POST /api/auth/request-reset)
- `handleResetPassword`: `api.resetPassword(token, newPassword)` (POST /api/auth/reset-password), токен берётся из `?token=` через `useSearchParams`
- Добавлен импорт `api` из `@/services/api` и `useSearchParams` из `react-router-dom`
- Сборка: `tsc + vite build` — зелёный, 7.48s
