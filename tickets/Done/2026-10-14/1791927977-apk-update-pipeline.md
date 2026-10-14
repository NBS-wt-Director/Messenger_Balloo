# 1791927977 — APK-путь сборки: download.balloo.su видит пакет, приложение обновляется с домена

**Создан:** 14.10.2026 (unix 1791927977)
**Статус:** готов (done)
**Кто:** Ksyusha (код) + владелец (серверная часть: TLS download-поддомена, фактическая сборка SDK/EXPO — сДЕЛАТЬ_ВЛАДЕЛЬЦУ 1.2bis)
**Решение владельца (14.10):** путь — APK, self-hosted обновления с download.balloo.su
(«выбора нет — APK самый оптимальный в наших условиях»). EAS/Play In-App Updates не используем.

## Цель

1. Собранный APK попадает на сервер в детерминированный путь и отдаётся с
   `download.balloo.su` под версионированным именем.
2. Приложение на устройстве видит новую версию (номер + хэш + размер) и может
   обновиться, скачав APK с нашего домена.

## Найденные факты (замеры 14.10.2026)

1. Gradle output: `packages/mobile-android/android/app/build/outputs/apk/release/app-release.apk`
   (`build:android:universal` = `./gradlew assembleRelease`, `packages/mobile-android/package.json:18`).
2. `scripts/upload-android-to-download.sh` шлёт **только метаданные** в
   `POST /api/downloads/upload-mobile` (`packages/server/src/routes/download.ts:21`) —
   **файл никуда не копируется**; URL `https://download.balloo.su/android/<file>`
   в БД указывает в никуда (файлов нет).
3. nginx-production.conf: `location /downloads/` → `proxy_pass http://server_backend/downloads/`
   (строка 351) уже есть, download.balloo.su в `server_name` того же блока (177).
   **Express статику `/downloads` НЕ раздаёт** — `grep express.static packages/server/src/` → 0.
4. `DownloadFile` (`packages/shared/prisma/schema.prisma`): platform/version/url/size/checksum,
   **versionCode отсутствует** — для корректного сравнения версий нужен Int.
5. Мобильное приложение: проверки обновлений нет; `SettingsScreen.tsx:187` — захардкожено
   «Версия 1.0.0». `expo-constants` есть; `expo-file-system`/`expo-application` —
   only in pnpm store, не слинкованы (не требуются для выбранного пути).
6. `multer@2.2.0` уже в зависимостях server.

## Архитектура (простой рабочий путь)

```text
gradle assembleRelease
  → app-release.apk
  → curl -F (multipart, admin-токен) POST /api/downloads/upload-mobile-file (api.balloo.su)
     → server сохраняет в DOWNLOADS_DIR/android/balloo-v<версия>-<arch>.apk,
       считает sha256+size, пишет DownloadFile{version, versionCode, url}
  → отдача: https://download.balloo.su/downloads/android/balloo-v<версия>-<arch>.apk
     (nginx location /downloads/ → express static DOWNLOADS_DIR — уже проксируется)
  → приложение при старте и по кнопке в Настройках:
     GET /api/downloads/android/latest?arch=universal (публичный)
     → сравнивает semver со своей Constants.expoConfig.version
     → Alert «Есть обновление vX» → «Скачать» → Linking.openURL(url)
       (браузер скачивает APK с нашего домена, Android предлагает установку)
```

Почему не in-app download+intent: `expo-file-system`/`expo-intent-launcher`
не слинкованы, ставятся только сетью до expo-реестра (ограничена, тикет mvp1-05).
Linking.openURL работает без нативных зависимостей и без новых разрешений.
Сервис обновлений изолирован в `updateService.ts` — in-app загрузку с прогрессом
подключим одним файлом, когда будет SDK.

## Подзадачи

- [x] 1. Prisma: `DownloadFile.versionCode Int?` + миграция `20261014120000_download_version_code`, применить к локальной БД, `prisma generate`.
      Доказательство: psql `information_schema.columns WHERE table_name='download_files'` → строка
      `versionCode|integer`; `pnpm db:generate` → `grep -c versionCode .prisma/client/index.d.ts` = 34.
- [x] 2. Server: `DOWNLOADS_DIR`/`DOWNLOAD_BASE_URL` в env; express.static `/downloads` в app.ts (apk mime, без листинга); контроллеры `uploadMobileFile` (multer, sha256, canonical-имя, запись БД) и `getAndroidLatest`; маршруты.
      Доказательство: `pnpm --filter @balloo/server exec tsc --noEmit` → exit 0;
      `pnpm --filter @balloo/server test` → 32 suite / 595 tests passed (регрессии нет).
- [x] 3. Compose (local+prod): том `./downloads:/app/downloads` для server + env DOWNLOADS_DIR/DOWNLOAD_BASE_URL; Dockerfile.server mkdir+chown app.
      Доказательство: `docker compose -f docker/prod/docker-compose.local.yml --env-file docker/prod/.env.production config --quiet` → 0;
      корневой `docker-compose.yml config --quiet` → 0; nginx `/downloads/` → server уже был (nginx-production.conf:351, не менялся).
- [ ] 3. Compose (local+prod): том `./downloads:/app/downloads` для server + env DOWNLOADS_DIR; Dockerfile.server — mkdir.
- [x] 4. `upload-android-to-download.sh`: реальная отправка файла (curl -F) на upload-mobile-file; параметры version+versionCode; проверка latest после загрузки.
      Доказательство: `bash -n scripts/upload-android-to-download.sh` → SYNTAX OK (файл переписан: был только metadata-POST, стал multipart + latest-проверка).
- [x] 5. Mobile: `src/services/updateService.ts` (semver compare, fetch latest, Alert+Linking); проверка при старте в `app/_layout.tsx`; Настройки — текущая версия + «Проверить обновления».
      Доказательство: `pnpm exec tsc --noEmit` в mobile-android → exit 0.
- [x] 6. Web `DownloadScreen.tsx`: дефолтные URL на canonical-схему `download.balloo.su/downloads/android/balloo-v<версия>-<arch>.apk`; enrich — точное совпадение platform для APK.
      Доказательство: `pnpm --filter @balloo/web build` → exit 0 (vite built in 6.80s).
- [x] 7. Тесты: jest на upload-mobile-file + latest (404 пуст / 200 по versionCode desc); `tsc --noEmit` mobile; `pnpm test` монорепо зелёные.
      Доказательство: `download-apk-update.test.ts` 17/17 passed; `pnpm --filter @balloo/server test`
      → 33 suite / 612 tests passed; `pnpm test` монорепо → exit 0 (shared 76, web 216, server 612).
      Живой прогон (сервер на :3997, curl): upload-mobile-file → 201 (url канонический, versionCode=100);
      GET latest → 200; GET /downloads/android/balloo-v1.0.0-universal.apk → 200,
      Content-Type: application/vnd.android.package-archive, Content-Disposition: attachment;
      sha256 файла на диске == checksum в ответе/БД (de158f00…); запись download_files в БД. Тестовые данные удалены.
      Побочно: обнаружен и исправлен дефект — platform VARCHAR(20) не вмещал 'android-apk-universal' (21),
      миграция `20261014130000_download_platform_varchar32` (VARCHAR(32)), применена к локальной БД, resolve в _prisma_migrations.
- [x] 8. Документация процесса: сДЕЛАТЬ_ВЛАДЕЛЬЦУ.md — блок «Публикация APK» (команды владельца после сборки) + обновить тикет mvp1-05.
      Доказательство: сДЕЛАТЬ_ВЛАДЕЛЬЦУ.md — блок «1.2bis. Публикация APK» (mkdir+chmod, команды
      публикации, проверка latest/HEAD); mvp1-05 — раздел «Проблемы и решения» дополнен
      ссылкой на готовый пайплайн и 1.2bis.

## Критерии готовности

- `pnpm --filter @balloo/server test` зелёные, включая новые тесты;
- `tsc --noEmit` в mobile-android → exit 0;
- `pnpm --filter @balloo/web build` → exit 0;
- локальный прогон: старт server + curl upload-mobile-file (тестовый файл) →
  файл в DOWNLOADS_DIR, запись в download_files, GET latest отдаёт url/versionCode;
- в сДЕЛАТЬ_ВЛАДЕЛЬЦУ — команды публикации и проверки для владельца.

## Проблемы и решения (если возникли)

- **Leak tmp-файлов на 400:** multer сохраняет файл до контроллера; валидация (version/versionCode/arch) могла вернуть 400, оставив tmp-файл на диске. Исправлено: cleanupTmp() на всех ветках 400 + catch. После исправления: 0 tmp-файлов после полного прогона 17 тестов.
- **platform VARCHAR(20) → 500:** каноническое имя 'android-apk-universal' = 21 символ. Исправлено: миграция 20261014130000, ALTER TYPE VARCHAR(32).
- **Слепое ожидание `versionCode` в БД при 404 latest:** GET /api/downloads/android/latest с arch=armeabi-v7a возвращает 404, если нет записей — это корректно (приложение не будет показывать Alert).
- **Миграция 20261010000000_add_missing_columns (failed):** предшествующая проблема, заблокирует `prisma migrate deploy` на любой БД, где эта запись есть. Локально не влияет (решено через psql). На сервере — проверить состояние перед деплоем.

## Результат

Собрано и проверено (14.10.2026):

### Сервер (packages/server)
- **env.ts:** `DOWNLOADS_DIR` (default ''), `DOWNLOAD_BASE_URL` (default https://download.balloo.su)
- **paths.ts:** `paths.downloads` — резолв из env или `<projectRoot>/downloads`
- **app.ts:** `express.static('/downloads', ...)` — apk mime, attachment, no listing
- **downloadController.ts:** `uploadMobileFile` (multer diskStorage, sha256, canonical имя, запись БД с versionCode) + `getAndroidLatest` (versionCode desc nulls last, arch-изолированный)
- **download.ts routes:** multer middleware (fileFilter .apk/.aab, 200MB limit, error wrapper), `POST /upload-mobile-file`, `GET /android/latest` (до `/:arch`)
- **Тесты:** `download-apk-update.test.ts` — 17 тестов (401/403, 400 валидация, 201 успех + диск + БД, latest 404/200, static 200 mime/attachment, versionCode desc). Все тесты сервера: 33 suite / 612 tests passed (регрессии нет).
- **Типы:** `tsc --noEmit` → exit 0

### БД
- **schema.prisma:** `versionCode Int?` + `platform VARCHAR(20)→32`
- **Миграции:** 20261014120000_download_version_code (ALTER ADD COLUMN), 20261014130000_download_platform_varchar32 (ALTER TYPE). Обе применены к локальной БД.

### Docker / Compose
- **Dockerfile.server:** `RUN mkdir -p /app/downloads && chown app:app /app/downloads`
- **docker-compose.yml:** volume `./downloads:/app/downloads`, env DOWNLOADS_DIR/DOWNLOAD_BASE_URL
- **docker/prod/docker-compose.local.yml:** volume + env (с комментарием про chmod 777)
- **.gitignore:** `packages/downloads/`, `docker/prod/downloads/`
- **nginx-production.conf:** `/downloads/` → server — не менялся

### Мобильное приложение (packages/mobile-android)
- **updateService.ts:** `checkForUpdates()` (semver + versionCode compare, Alert + Linking.openURL), `getLocalVersion()` (expo-constants), `isNewerRelease()`, `fetchLatestRelease()`
- **_layout.tsx:** `useEffect` — проверка при входе (interactive=false)
- **SettingsScreen.tsx:** реальная версия вместо хардкода + кнопка «Проверить обновления»
- **Тесты:** `tsc --noEmit` → exit 0

### Web (packages/web)
- **DownloadScreen.tsx:** canonical URLs `download.balloo.su/downloads/android/balloo-v<ver>-<arch>.apk`; улучшен match logic для android (точное совпадение platform)
- **Сборка:** `pnpm --filter @balloo/web build` → exit 0 (6.80s)

### Скрипт публикации
- **upload-android-to-download.sh:** переписан — отправляет файл multipart (curl -F), принимает version/versionCode, проверяет GET /api/downloads/android/latest. Больше не молчит при отсутствии токена.

### Живой прогон (live curl, порт 3997)
```
POST /api/downloads/upload-mobile-file → 201
  url: https://download.balloo.su/downloads/android/balloo-v1.0.0-universal.apk
  versionCode: 100, checksum: de158f00... (sha256 файла)

GET /api/downloads/android/latest → 200
  version: 1.0.0, versionCode: 100, url: .../balloo-v1.0.0-universal.apk

GET /downloads/android/balloo-v1.0.0-universal.apk → 200
  Content-Type: application/vnd.android.package-archive
  Content-Disposition: attachment; filename="balloo-v1.0.0-universal.apk"

sha256 файла на диске == checksum в ответе/БД ✓
```

### Известные проблемы (не блокируют)
- Миграция `20261010000000_add_missing_columns` (failed) — предшествующая проблема, может заблокировать `prisma migrate deploy` на БД с этой записью. Локально решена (psql + resolve).
- Серверные сборки desktop (deb/AppImage/exe) — URL в DownloadScreen.tsx пока дефолтные (не из БД). Загрузка desktop файлов через upload-mobile-file не поддерживается (только mobile APK/AAB).
