# mvp1-02 — Desktop: пересобрать linux-дистрибутивы из HEAD и проверить запуск

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов к работе
**Кто:** Ksyusha (без владельца)
**Почему увеличивает MVP1:** desktop win/linux входит в MVP1
(`PROJECT_DOCUMENTATION.md` §17, оценка desktop 60%, «осталось 40% — упаковка,
авто-обновления, иконки, инсталляторы»). Артефакты на диске старше кода на 46
коммитов — «упаковано» сейчас не подтверждено текущим состоянием.

## Найденные факты (замеры 12.10.2026)

1. `ls -la packages/desktop/release` — артефакты от **20.09.2026**:
   `balloo_1.0.0_amd64.deb`, `balloo_1.0.0_arm64.deb`, `balloo_1.0.0_x86_64.AppImage`,
   `balloo_1.0.0_arm64.AppImage`, `balloo_1.0.0_{x64,arm64}.tar.gz`.
2. Windows-артефактов нет: `ls packages/desktop/release | grep -i "exe\|msi\|portable"`
   → пусто (код возврата 1).
3. `git rev-list --count --since=2026-10-08 HEAD` → 46 коммитов с даты прошлой
   оценки; `git log --since=2026-10-08 -- packages/desktop` → **0 коммитов**
   (desktop не менялся, но его зависимости `@balloo/web`/`@balloo/shared` менялись).
4. Конфигурация сборки есть: `packages/desktop/electron-builder.yml` (targets
   nsis/msi/portable для win, deb/rpm/AppImage/tar.gz для linux), скрипты
   `build:win`, `build:linux`, `build:all` в `packages/desktop/package.json`.
5. Иконки на месте: `packages/desktop/assets/` → `icon.png`, `icon.ico`,
   `tray-icon.png`, `background.png`.
6. Инструментов для Windows-сборки на этой машине нет: `command -v wine` → НЕТ
   (nsis-цель под Windows на Linux требует wine). CI (`ci.yml:15`) —
   `runs-on: ubuntu-latest`, windows/electron-джоб нет
   (`grep -rn "windows\|electron" .github/workflows/` → 0).
7. `electron-updater` подключён в коде: `packages/desktop/src/main.ts:308-344`
   (`autoDownload = false`, `checkForUpdates()` каждые 6 ч), feed
   `https://download.balloo.su/desktop/updates` (`electron-builder.yml:92-95`).

## Подзадачи

- [ ] 1. `pnpm --filter @balloo/desktop build` (tsc + vite) → exit 0, обновляются
      `dist-electron/` и `dist-renderer/`. Проверка: `ls -la packages/desktop/dist-electron`.
- [ ] 2. `pnpm --filter @balloo/desktop build:linux` → свежие deb + AppImage +
      tar.gz с датой сегодняшнего прогона. Проверка: `ls -la packages/desktop/release`.
- [ ] 3. Проверить устанавливаемость без установки в систему:
      `dpkg-deb -I balloo_1.0.0_amd64.deb` (метаданные) и
      `dpkg-deb -c … | head` (состав), AppImage — `--appimage-extract-and-run --version`
      не запускать (нет дисплея), вместо этого проверить состав
      `unsquashfs -l`/`7z l`.
- [ ] 4. Windows-сборку НЕ делать молча: wine отсутствует (п.6). Записать в
      «Проблемы и решения» два варианта и цену — (А) `sudo apt install wine64`
      (вне воркспейса, нужно разрешение владельца), (Б) джоба `windows-latest`
      в `.github/workflows/ci.yml` (правка внутри воркспейса, проверка через push).
      Перенести выбор в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` отдельным пунктом.
- [ ] 5. Авто-обновления: проверить, что `latest.yml` попадает в артефакты сборки
      (`ls packages/desktop/release/latest.yml`) — без него `checkForUpdates()`
      в проде всегда падает в `error`. Выкладка на `download.balloo.su` —
      блокировка на владельце (домен не отвечает, см. `mvp1-03`).

## Критерии готовности

- В «Результат»: вывод `pnpm --filter @balloo/desktop build:linux` (последние
  ~30 строк) + `ls -la packages/desktop/release` со свежими датами.
- `latest.yml` в release/ — есть/нет, с выводом `ls`.
- Пункт 4 оформлен как запись в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` (не как «сделано»).

## Результат

(по ходу)
