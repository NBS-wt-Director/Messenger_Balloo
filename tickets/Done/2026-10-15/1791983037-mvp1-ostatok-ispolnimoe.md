# 1791983037 — MVP1 остаток: всё исполнимое на этой машине

**Создан:** 14.10.2026 (unix 1791983037)
**Статус:** готов
**Источник запроса:** владелец (чат 14.10): «сколько % осталось до mvp1? выполни всё что возможно из того что осталось.»

## Замеры (14.10.2026, исполнены до первой правки)

| Проверка | Результат |
|---|---|
| Сеть `download.cypress.io` | HTTP 302 — доступна |
| Сеть `dl.google.com/android/repository/` | HTTP 200 — доступна |
| PostgreSQL `localhost:5432` | accepting connections |
| Redis | PONG |
| `wine`/`wine64` | не установлены |
| Бренд-ассеты в `assets/logos/` | 4 файла: product-logo.png, company-logo.png, mascot.png, qr_helpus.jpg |
| `packages/web/public/assets/logos/` | не существует |
| `android` каталог в mobile-android | существует (prebuild-проект) |
| Android SDK (`ANDROID_HOME`) | не задан |
| `~/.cache/Cypress` | нет бинарника |

## Подзадачи (исполнимые на этой машине)

- [x] 1. Бренд-ассеты (Блок 1.6): скопированы 4 файла из `assets/logos/` в
      `packages/web/public/assets/logos/` (product-logo.png, company-logo.png,
      mascot.png, qr_helpus.jpg). Проверено: `ls -la` → 604К, все 4 файла.
      Ссылки в index.html (`/assets/logos/product-logo.png` — favicon) и sw.js
      (`'/assets/logos/product-logo.png'` — precache) — теперь доступны.
- [x] 2. Cypress (Блок 1.1): бинарник 15.19.0 в `.cypress-cache/` (воркспейс, 814 МБ).
      Доказательство 15.10.2026: `CYPRESS_CACHE_FOLDER=./.cypress-cache packages/web/node_modules/.bin/cypress verify`
      → «✔ Verified Cypress!» (exit 0). `~/.cache` не трогался, разрешение владельца не потребовалось.
- [x] 3. Стек поднят (БД 5432 + Redis 6379 были; server 3100 с NODE_ENV=test — штатный
      пропуск rate limiter'а по `middleware/rateLimit.ts:93`; web 5173). e2e прогнан:
      `auth.cy.ts` → 4/4 passing (11s), `chat.cy.ts` → 3/3 passing (5s).
      Пользователь `e2e@test.balloo.ru` создан через `POST /api/auth/register` → 201.
      Честная оговорка: тело тестов chat.cy.ts условное (`if ($body.find(...))`) —
      без чатов проходит пусто; значимая часть (вход через UI-форму, редирект из /#/login)
      выполняется в beforeEach каждого теста. Первый реальный e2e-прогон в истории проекта.
- [x] 4. Desktop Windows CI (Блок 1.3 вариант Б): джоба `desktop-windows` добавлена в
      `.github/workflows/ci.yml` (windows-latest, prisma generate → build:shared →
      `pnpm --filter @balloo/desktop build:win` → upload-artifact *.exe/*.msi/latest.yml).
      Доказательство: `python3 -c "yaml.safe_load(...)"` → «YAML OK, jobs: ['ci', 'desktop-windows']».
      Фактический прогон джобы — только на GitHub после пуша (локально не исполнимо).
- [x] 5. Android: **APK и AAB собраны** (прогон 18, BUILD SUCCESSFUL 5m32s, 15.10.2026).
      Артефакты: `packages/mobile-android/android/app/build/outputs/apk/release/app-release.apk`
      (68 711 653 Б; aapt badging: `su.balloo.messenger` versionName 1.0 versionCode 1,
      sdkVersion 24, targetSdk 34; sha256 7ad82428c51c59f8...),
      `outputs/bundle/release/app-release.aab` (bundleRelease, 40s).
      Путь: SDK в `.android-sdk/` (воркспейс) + init-скрипт зеркала Maven Central
      (`android/gradle-mirror-init.gradle`, GCS 6.6 МБ/с vs Central ~300 Б/с) +
      обёртка `android/gradle-android.sh` (ANDROID_HOME, NODE_PATH, -I init) +
      перенос Kotlin в пакет `su.balloo.messenger` (R/BuildConfig в namespace) +
      babel: убран deprecated `expo-router/babel`, minSdk 24 синхронизирован.
      Повтор проверен: `pnpm --filter @balloo/mobile-android build:android:apk` → exit 0 (56s).
      Оговорка: подпись debug.keystore (детерминированная, для self-update годится).
- [x] 6. §17 PROJECT_DOCUMENTATION.md обновлён 15.10.2026: MVP ~92% (Android 55→85,
      Desktop 80→85, Web 100 + e2e-доказательство), список остатка пересобран по фактам.
- [x] 7. with_lord сняты: 1.1 (Cypress — не требуется, воркспейс-кэш), 1.3 (Windows —
      вариант Б реализован CI-джобой), 1.6 (бренд-ассеты — сделано, curl 200),
      1.2 (Android — SDK в воркспейсе, артефакты собраны; публикация осталась в 1.2bis).
- [x] 8. `pnpm test` → exit 0 (shared 4 файла/76, server 34 набора/616, web 23/218 —
      прогон `.dev-logs/pnpm-test-final.log` 15.10.2026); web build exit 0; коммиты —
      см. «Результат».

## Критерии готовности

- бренд-ассеты в web public, e2e прогоняется (хотя бы auth.cy.ts), Windows CI-джоба
  описана, Android-путь прояснён (SDK или причина блокировки), §17 обновлён.

## Проблемы и решения (если возникли)

1. **repo.maven.apache.org деградирован с этой сети** (~300 Б/с, TCP-навешивание,
   Read timed out на react-android/hermes-android AAR): 9 прогонов (2–9) падали/висли.
   Решение: `android/gradle-mirror-init.gradle` — init-скрипт, изымающий Central из
   **всех** контейнеров репозиториев композита (включая included builds RN gradle-plugin
   и модули RN — у каждого свой `mavenCentral()`) и ставящий GCS-зеркало
   `maven-central.storage-download.googleapis.com` (замер: 6.6 МБ/с). `afterProject`,
   а не `projectsLoaded`: контейнеры наполняются при оценке build.gradle модулей.
   Дополнительно прогрев кэша AAR скриптом с проверкой sha1+sha512 по Gradle Module Metadata.
2. **pnpm-изоляция vs Metro/Gradle**: плоского `node_modules` нет → Metro не резолвил
   expo-asset/@react-navigation/babel-preset-expo. Решение: symlink-шимы
   `packages/mobile-android/node_modules/*` и `android/node_modules/*` на pnpm-store +
   `NODE_PATH="<rn-store>:.node-path-shims"` для settings.gradle (всё в воркспейсе,
   в .gitignore).
3. **expo-router/babel deprecated** (SDK 50+):SyntaxError при бандлинге → убран из
   `babel.config.js` (presets: babel-preset-expo достаточно).
4. **Kotlin в пакете com.helloworld при namespace su.balloo.messenger**: R/BuildConfig
   не резолвились (Unresolved reference) → файлы перенесены (`git mv`) в
   `app/src/main/java/su/balloo/messenger/`, пакет переименован.
5. **sdkmanager-обёртка ломается на пробелах в пути** («Could not find or load main
   class стол.проекты...») → запуск напрямую `java -cp .../sdkmanager-classpath.jar`.
6. **Rate limiter 5/мин вешал e2e-логин**: сервер поднят с `NODE_ENV=test` — штатный
   skip в `middleware/rateLimit.ts:93` (для e2e это intended-режим).

## Результат

Все 8 подзадач закрыты 14–15.10.2026. Доказательства по пунктам:

```text
п.2 cypress verify  → ✔ Verified Cypress! (.cypress-cache/15.19.0)
п.3 e2e             → auth.cy.ts 4/4 passing (11s); chat.cy.ts 3/3 passing (5s)
п.4 ci.yml          → python3 yaml.safe_load → jobs: ['ci', 'desktop-windows']
п.5 APK             → app-release.apk 68711653 Б; aapt badging: package='su.balloo.messenger'
                       versionCode='1' versionName='1.0' sdkVersion:'24' targetSdkVersion:'34'
                       sha256 7ad82428c51c59f82fd6626022fa5203770af26dabd185db9afa00b8b41d65b2
                      AAB → app-release.aab (bundleRelease exit 0, 40s)
                      повтор → pnpm run build:android:apk → BUILD SUCCESSFUL 56s (exit 0)
п.6 §17             → PROJECT_DOCUMENTATION.md «обновлено 2026-10-15», MVP ~92%
п.7 with_lord       → таблицы 1.1/1.2/1.3/1.6 заполнены «Сделано»
п.8 pnpm test       → exit 0: shared 4/76, server 34/616, web 23/218
                      (.dev-logs/pnpm-test-final.log)
```

Коммиты (конвенция, по тикетам): см. git log 15.10.2026 —
e2e(web), CI(desktop), Android(mobile-android), docs(tickets/§17).
