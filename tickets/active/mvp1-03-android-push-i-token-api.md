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

- [ ] 1. Разобрать текущий контракт сервера: `grep -n "pushToken\|subscription"
      packages/server/src/services/pushService.ts packages/server/src/routes/*.ts`
      — понять, есть ли эндпоинт регистрации токена или только web-push
      subscription. Записать найденные пути/строки в «Проблемы и решения».
- [ ] 2. Добавить (или переиспользовать) эндпоинт сохранения mobile-токена
      + миграция, если таблицы нет. Проверка: `tsc --noEmit` по серверу +
      новый тест в `packages/server/src/__tests__/`.
- [ ] 3. На Android: `expo-notifications` + запрос разрешения + отправка токена
      на шаг 2 при входе. Без FCM-креденшалов device-token не выдаётся —
      код должен деградировать (log, не краш). Проверка:
      `node_modules/.bin/tsc --noEmit` в `packages/mobile-android` → exit 0.
- [ ] 4. Локальные уведомления (без FCM) на входящее WS-сообщение при
      свёрнутом приложении — это работает и без чужих ключей, проверить
      на симуляторе невозможно (нет Android SDK, см. `mvp1-04`) → пометить
      `[!]` с причиной, не «сделано».
- [ ] 5. Пункт владельцу (FCM-проект: `google-services.json` + server key) —
      запись в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` с критерием готовности.

## Критерии готовности

- Сервер: тест на эндпоинт регистрации токена зелёный (вывод jest).
- Android: `tsc --noEmit` exit 0 (вывод).
- FCM-часть оформлена как блокировка владельца, а не как выполненная работа.

## Результат

(по ходу)
