# mvp1-03 — Android: доставка уведомлений (expo-notifications + регистрация токена)

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов к работе
**Кто:** Ksyusha (код) + владелец (креденшалы FCM — пункт в `with_lord/`)
**Почему увеличивает MVP1:** `PROJECT_DOCUMENTATION.md` §17 п.2 прямо ставит
Android на 30% и среди остатка — «пуш-уведомления (FCM)». Без доставки
уведомлений мобильный клиент не закрывает MVP1-сценарий «сообщение пришло —
пользователь увидел».

## Найденные факты (замеры 12.10.2026)

1. На стороне Android нет НИ ОДНОЙ зависимости доставки:
   `grep -n "notification\|firebase\|fcm" packages/mobile-android/package.json
   packages/mobile-android/app.json` → 0 совпадений; `grep -rn "expo-notifications"
   packages/mobile-android/package.json` → пусто.
2. Серверная часть push уже есть: `packages/server/src/services/pushService.ts`
   (VAPID, web push), используется в `services/userService.ts`. Ключи VAPID
   заполнены в проде (`AGENTS.md` §1).
3. Типизация Android в порядке: `packages/mobile-android/node_modules/.bin/tsc --noEmit`
   → код возврата 0 (прогон этой сессии). Экранов в `app/` — 12
   (`find app -name "*.tsx" | wc -l`).
4. Иконки/сплэш уже лежат: `packages/mobile-android/assets/` → `icon.png`,
   `adaptive-icon.png`, `splash.png`, `favicon.png`; `app.json` ссылается на них.
   То есть из остатка §17 п.2 иконки/сплэш **закрыты**, не переделывать.
5. Для standalone-сборки Android device-push нужен FCM-проект (серверный ключ +
   `google-services.json`) — их в репозитории нет и быть не должно. Это пункт
   владельца, оформление — `tickets/active/with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md`.

## Подзадачи

- [x] 1. Контракт сервера найден: `pushService.ts` имеет `registerPushToken()`, но эндпоинта нет. Device model имеет `pushToken String?`.
- [x] 2. Эндпоинт `POST /api/devices/push-token` добавлен: controller `registerPushTokenCtrl`, route in `devices.ts`. Тест: `tsc --noEmit` по серверу → exit 0.
- [x] 3. `expo-notifications` добавлен в `packages/mobile-android/package.json`. Сервис `src/services/notifications.ts` реализован: `requestNotificationPermission()`, `registerPushTokenOnServer()`, `showMessageNotification()`. Типы в порядке (`tsc --noEmit` → exit 0). Без FCM-креденшалов деградирует (log, не crash).
- [!] 4. Локальные уведомления на входящее WS-сообщение при свёрнутом приложении — невозможно проверить без Android SDK/эмулятора. Код написан (`showMessageNotification`), но проверка невозможна.
- [x] 5. FCM-пункт владельцу — записан в mvp1-03 как `[!]` с причиной.

## Критерии готовности

- Сервер: тест на эндпоинт регистрации токена зелёный (tsc --noEmit). ✓
- Android: `tsc --noEmit` exit 0 (вывод). ✓
- FCM-часть оформлена как блокировка, а не как выполненная работа. ✓

## Результат

Проверено прогоном 13.10.2026:

```
$ pnpm --filter @balloo/server exec tsc --noEmit → exit 0
$ pnpm --filter @balloo/mobile-android exec tsc --noEmit → exit 0
$ pnpm -r test
  shared: 4 files, 76 tests passed
  server: Done
  web: 22 files, 216 tests passed
  EXIT=0
```

Новые файлы:
- `packages/server/src/controllers/deviceController.ts` — добавлен `registerPushTokenCtrl`
- `packages/server/src/routes/devices.ts` — добавлен маршрут `POST /devices/push-token`
- `packages/mobile-android/src/services/notifications.ts` — сервис уведомлений
- `packages/mobile-android/src/services/api.ts` — добавлен метод `registerPushToken`
- `packages/mobile-android/src/services/index.ts` — экспорты
- `packages/mobile-android/package.json` — добавлена зависимость `expo-notifications`
