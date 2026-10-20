# Тикет 1792311348 — Mobile: HeaderMenuScreen — уточнить функционал

**Создан:** 18.10.2026 (unix 1792311348)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
HeaderMenuScreen — навигационное меню. Проверить корректность навигации и logout.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/HeaderMenuScreen.tsx` (37 строк)
- Текущий код: `navigation?.navigate?.(item.screen)` — может не работать для logout
- API из web: `grep "logout\|signOut" packages/web/src/`

## Подзадачи
- [x] 1. Навигация сверена с `src/router/index.tsx`: «Настройки» вели на несуществующий
      `Settings` (в роутере экран — `SettingsTab` в табаках); «Мой профиль» вёл на
      `Profile`, который импортировался, но не был зарегистрирован
- [x] 2. Logout: `api.logout()` (POST /api/auth/logout) + `useAuthStore.logout()`
      с Alert-подтверждением; ошибка сети не мешает локальному выходу
- [x] 3. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- Навигация работает
- logout корректный
- build зелёный

## Проблемы и решения

Правки: в `src/router/index.tsx` зарегистрирован экран `Profile` (в `MainStackParamList`
и в `MainNavigator`); в меню добавлен «Мои устройства» (`Devices`); переключатель темы
работает через `uiStore.setTheme` (dark ↔ light) и меняет подпись; убран `goBack()`
после `navigate()`, который закрывал только что открытый экран.

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ cd packages/mobile-android && ./node_modules/.bin/tsc --noEmit --pretty false
0 ошибок (до правок в пакете — 77 строк ошибок)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)

$ pnpm --filter @balloo/desktop build
✓ built (tsc && vite build)

$ python3 scripts/api-endpoints-check.py
Клиентских путей: 184 / Серверных маршрутов: 250 / НЕ СОВПАДАЕТ: 18 (группа B, ждёт владельца)
```

Не проверялось: реальный прогон экранов в браузере/эмуляторе (нет запущенного
бэкенда с БД и нет Android-устройства на этой машине) — см. AGENTS.md §1.
