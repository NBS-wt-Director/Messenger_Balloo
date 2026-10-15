# Balloo — Документация проекта

---

## 17. Оценка готовности MVP (обновлено 2026-10-15)

### MVP scope (web + win/linux + android, без iOS + MacOS)

Компоненты MVP: `balloo.su` + `api.balloo.su` + `history.balloo.su` + `download.balloo.su` + desktop (win/linux) + mobile Android.

### Статус компонентов

| Компонент | Файлов кода | Готовность | % |
|-----------|-------------|------------|---|
| **API** (api.balloo.su) | 126 | ✅ Собрano, 208 endpoints, 616 тестов зелёные (прогон 15.10.2026), push-token endpoint | **100%** |
| **Web** (balloo.su) | 227 | ✅ Собрano, 119 screens, 208 routes; юнит 23 файла/218 зелёные; **e2e Cypress впервые прогнан: auth 4/4, chat 3/3** (15.10.2026, бинарник 15.19.0 в `.cypress-cache/`) | **100%** |
| **Shared** | 18 | ✅ Типы, константы, 76 тестов зелёные | **100%** |
| **Desktop** (win/linux) | 23 | 🟡 Linux: deb/AppImage/tar.gz (x64+arm64) собраны из HEAD; Windows: CI-джоба `desktop-windows` (windows-latest) добавлена в ci.yml — ждёт первого прогона на GitHub после пуша | **85%** |
| **Mobile Android** | 31 | ✅ APK собран: `app-release.apk` 68.7 МБ, `su.balloo.messenger` v1.0/vc1, minSdk 24, targetSdk 34 (aapt badging, 15.10.2026); ✅ AAB: `app-release.aab` (bundleRelease); подпись debug.keystore (детерминированная, годится для self-update с download.balloo.su; release-ключ для Play — задача владельца); публикация на download — with_lord 1.2bis | **85%** |
| **History** (история версий) | 5 screens | ✅ Роуты `/history`, `/history/version/:id`, `/history/compare`; API `/api/history/versions` → 200; chunks в бандле; TLS — блокировка владельца | **90%** |
| **Download** (загрузки) | 3 screens | ✅ Роуты `/download`, `/download/progress`, `/download/:platform`; API `/api/downloads` → 200; chunks в бандле; TLS — блокировка владельца | **90%** |

### Итоговая оценка

| Метрика | Значение |
|---------|----------|
| **MVP выполнен на** | **~92%** |
| **Осталось** | **~8%** — действия владельца: деплой (2.1), TLS поддоменов (1.4), первый прогон Windows CI + скачивание артефактов (1.3), публикация APK (1.2bis), приёмка |
| **Осталось по времени** | **~1–2 часа** кода + действия владельца |

### Что осталось

1. **Desktop Windows** — `.exe`/`.msi`: CI-джоба описана и YAML-валидирована; нужен пуш + первый прогон GitHub Actions + скачивание артефактов (with_lord 1.3).
2. **Mobile Android** — APK/AAB собраны на этой машине (обёртка `android/gradle-android.sh`, SDK в `.android-sdk/`); осталось: публикация APK по 1.2bis (владелец), release-ключ если понадобится Play.
3. **history/download** — TLS-сертификат с SAN `history.balloo.su`, `download.balloo.su` (Блок 1.4, владелец).
4. **Бренд-ассеты** — ✅ закрыто 14–15.10: 4 файла в `packages/web/public/assets/logos/`, dev-сервер отдаёт 200.
5. **Cypress e2e** — ✅ закрыто 15.10: бинарник в воркспейсе, auth+chat зелёные; остальные спеки (blog/group/story/admin) требуют сидов e2e-пользователя в CI — отдельная задача.
6. **Инфраструктура** — CI/CD для автодеплоя, мониторинг, бэкапы (вне MVP-кода).

### Не входит в MVP (отложено)

- iOS (0% кода)
- MacOS (входит в desktop Electron, но не приоритет)
- web.balloo.su (отдельный лендинг — есть в web-features, 5 screens)
- t.balloo.su (упоминаний не найдено)

---

*Документация обновлена: 2026-10-15 (тикеты 1791983037, mvp1-04, mvp1-05)*
