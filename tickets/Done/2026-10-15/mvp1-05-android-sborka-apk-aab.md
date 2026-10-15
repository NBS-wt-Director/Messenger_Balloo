# mvp1-05 — Android: собранные APK/AAB из HEAD

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов (15.10.2026, APK+AAB собраны)
**Кто:** Ksyusha (prebuild, typecheck, скрипты) + владелец (SDK или EXPO_TOKEN)
**Почему увеличивает MVP1:** Android в составе MVP1 (`PROJECT_DOCUMENTATION.md` §17),
в остатке прямо названо «Expo build … `.aab` для Play Market». Артефакта сборки нет,
значит 30% Android не подтверждены исполнением.

## Найденные факты (замеры 12.10.2026)

1. Артефактов нет: `find packages/mobile-android/android/app/build/outputs
   -name "*.apk" -o -name "*.aab"` → пусто.
2. Скрипты сборки объявлены: `packages/mobile-android/package.json` →
   `build:android:apk` (`expo run:android --variant release`),
   `build:android:aab` (`cd android && ./gradlew bundleRelease`),
   `build:android:eas` (`eas build --platform android --profile apk`),
   `build:android:all`, `upload:android`.
3. Нативный проект уже сгенерирован: `packages/mobile-android/android/` →
   `build.gradle`, `settings.gradle`, `gradlew`, `gradle.properties`.
4. Инструменты на машине: `java` → `/usr/bin/java` (есть), `gradle` →
   `/usr/bin/gradle` (есть), `ANDROID_HOME`/`ANDROID_SDK_ROOT` → **не заданы**,
   каталога `~/Android` нет. Без SDK gradle-сборка невозможна.
5. Типы в порядке: `packages/mobile-android/node_modules/.bin/tsc --noEmit` → exit 0.
   (Скрипт `lint` в пакете = `npx tsc --noEmit --pretty` — локальный бинарник
   использовать надёжнее, чем `npx`.)
6. `eas.json` в пакете есть — облачный путь (`eas build`) требует Expo-аккаунта
   и токена, в репозитории их нет.

## Подзадачи

- [x] 1. `tsc --noEmit` → exit 0 (прогон 13.10.2026).
- [!] 2. `npx expo prebuild --platform android --no-install` — не выполнен: `npm view expo-template-bare-minimum@sdk-51` → exit 1 (сеть до npm-реестра Expo ограничена). Нативный проект не пересобран.
- [x] 3. Манифест: `applicationId = "su.balloo.messenger"` ✓, `versionCode 1` ✓. `app.json` → `minSdkVersion: 24` ✓, `targetSdkVersion: 34` ✓. **Расхождение:** `android/build.gradle` содержит `minSdkVersion = 23` (старый prebuild до добавления expo-build-properties). После пересборки нативного проекта (когда будет SDK/сеть) — синхронизируется.
- [x] 4. Выбор пути сборки записан в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` (Блок 1.2): (А) Android SDK, (Б) EXPO_TOKEN + eas build.
- [x] 5. После выбора владельцем — собрать APK и AAB. **Сделано 15.10.2026 без выбора:**
      SDK встал в воркспейс (ветка А без вне-воркспейсной записи), prebuild не понадобился —
      собрался закоммиченный нативный проект. Артефакты и оговорки — в «Результате».

## Проблемы и решения

**Блокировка:** Android SDK (`ANDROID_HOME`/`ANDROID_SDK_ROOT`) не задан, `~/Android` нет. Без SDK `./gradlew assembleRelease` невозможен. Expo cloud (`eas build`) требует `EXPO_TOKEN`. `expo prebuild` требует сеть до npm (в данной сессии недоступна).

**Обновлено 14.10.2026 (тикеты 1791927977):** путь доставки APK выбран владельцем —
self-update с download.balloo.su (без Play/EAS). Серверная часть готова и проверена
живым прогоном: `POST /api/downloads/upload-mobile-file` (multipart → DOWNLOADS_DIR +
sha256 + запись БД), `GET /api/downloads/android/latest`, статика `/downloads/`.
Скрипт `scripts/upload-android-to-download.sh` переписан: теперь реально отправляет
файл и проверяет latest. Приложение проверяет обновления при входе и по кнопке
в Настройках (src/services/updateService.ts). Как только здесь появится APK из
подзадачи 5 — публикация по блоку 1.2bis в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`.

## Результат

**Закрыт 15.10.2026 (сессия 1791983037).** APK и AAB собраны на этой машине —
без EXPO_TOKEN и без SDK вне воркспейса.

```text
# SDK: .android-sdk/ в воркспейсе (cmdline-tools 12.0, platform-tools,
# platforms;android-34, build-tools;34.0.0; лицензии приняты)
# сборка (прогон 18): BUILD SUCCESSFUL in 5m32s, 867 tasks (439 executed)
$ ls android/app/build/outputs/apk/release/
app-release.apk   68 711 653 Б
$ aapt dump badging app-release.apk | head -2
package: name='su.balloo.messenger' versionCode='1' versionName='1.0' ...
sdkVersion:'24'  targetSdkVersion:'34'
$ sha256sum app-release.apk
7ad82428c51c59f82fd6626022fa5203770af26dabd185db9afa00b8b41d65b2
# AAB: ./gradle-android.sh bundleRelease → BUILD SUCCESSFUL 40s
android/app/build/outputs/bundle/release/app-release.aab
# повтор через pnpm: build:android:apk → BUILD SUCCESSFUL 56s (exit 0)
```

Что починено (коммиты 15.10.2026):
1. `android/gradle-mirror-init.gradle` — GCS-зеркало Maven Central вместо
   repo.maven.apache.org (~300 Б/с → 6.6 МБ/с, прогоны 2–9 на этом падали);
2. `android/gradle-android.sh` — обёртка (ANDROID_HOME в воркспейс, NODE_PATH на
   pnpm-store + `.node-path-shims`, -I init); скрипты package.json переведены на неё;
3. Kotlin `com.helloworld` → `su.balloo.messenger` (git mv) — R/BuildConfig резолвятся;
4. `babel.config.js`: убран deprecated `expo-router/babel`;
5. `gradle.properties`: `android.minSdkVersion=24` — расхождение с app.json устранено
   (было 23, теперь 24, подтверждено aapt badging `sdkVersion:'24'`).

Оговорки (честно):
- подпись — `android/app/debug.keystore` (release-вариант конфигурирован на debug
  signing, детерминированно) — годится для self-update с download.balloo.su (путь
  владельца из 1791927977); release-ключ для Play Market не заводился;
- публикация APK на download.balloo.su — действия владельца, блок 1.2bis в
  `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` (mkdir downloads + деплой миграций + upload-скрипт);
- установка на живое устройство не проверялась (нет устройства/эмулятора) — приёмка 3.3.
