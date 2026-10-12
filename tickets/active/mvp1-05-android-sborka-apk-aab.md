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

- [ ] 1. `node_modules/.bin/tsc --noEmit` (already exit 0) зафиксировать в «Результат».
- [ ] 2. `npx expo prebuild --platform android --no-install` — пересобрать
      нативный проект из `app.json`/`app.config.js` (SDK не нужен). Проверка:
      `git status --porcelain packages/mobile-android/android` +
      `grep -n "su.balloo.messenger" packages/mobile-android/android/app/build.gradle`.
- [ ] 3. Проверить манифест на соответствие MVP1: package `su.balloo.messenger`,
      `versionCode`, `minSdkVersion 24` (`app.json` plugins expo-build-properties).
- [ ] 4. Выбор пути сборки — записать в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md`:
      - **А:** установить Android SDK (off-workspace, `sdkmanager` + лицензии) —
        тогда `./gradlew assembleRelease` выполняется здесь;
      - **Б:** `EXPO_TOKEN` от аккаунта владельца → `eas build --platform android`
        (сборка в облаке, артефакт приходит ссылкой).
      Молча ничего не устанавливать.
- [ ] 5. После выбора: собрать APK и AAB, положить пути/размеры в «Результат»,
      сверить с `scripts/upload-android-to-download.sh` (куда выкладывает).

## Критерии готовности

- В «Результат»: вывод `tsc --noEmit`, вывод `expo prebuild`, вывод `git status`
  по `android/`.
- Артефакт (APK/AAB) — путь + размер, ЛИБО честный `[!]` с указанием отсутствующего
  инструмента и двумя вариантами решения.

## Результат

(по ходу)
