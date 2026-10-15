# mvp1-05 — Android: собранные APK/AAB из HEAD

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** заблокирован частично (нет Android SDK / Expo-аккаунта)
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
- [ ] 5. После выбора владельцем — собрать APK и AAB.

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

```
$ node_modules/.bin/tsc --noEmit → exit 0
$ grep applicationId android/app/build.gradle → "su.balloo.messenger"
$ grep versionCode android/app/build.gradle → 1
$ grep minSdkVersion app.json → 24
$ grep minSdkVersion android/build.gradle → 23 (расхождение, нужен prebuild)
```

[!] Заблокирован: нет Android SDK и EXPO_TOKEN. Ожидание выбора варианта владельцем.
