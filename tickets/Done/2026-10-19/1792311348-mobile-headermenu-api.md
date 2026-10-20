# Тикет 1792311348 — Mobile: HeaderMenuScreen — уточнить функционал

**Создан:** 18.10.2026 (unix 1792311348)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
HeaderMenuScreen — навигационное меню. Проверить корректность навигации и logout.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/HeaderMenuScreen.tsx` (37 строк)
- Текущий код: `navigation?.navigate?.(item.screen)` — может не работать для logout
- API из web: `grep "logout\|signOut" packages/web/src/`

## Подзадачи
- [ ] 1. Проверить навигацию: все ли screen имена есть в роутере
- [ ] 2. Добавить logout через `useAuthStore.getState().logout()`
- [ ] 3. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- Навигация работает
- logout корректный
- build зелёный

## Результат
