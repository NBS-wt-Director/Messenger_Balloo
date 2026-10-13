# Balloo — Документация проекта

---

## 17. Оценка готовности MVP (2026-10-13)

### MVP scope (web + win/linux + android, без iOS + MacOS)

Компоненты MVP: `balloo.su` + `api.balloo.su` + `history.balloo.su` + `download.balloo.su` + desktop (win/linux) + mobile Android.

### Статус компонентов

| Компонент | Файлов кода | Готовность | % |
|-----------|-------------|------------|---|
| **API** (api.balloo.su) | 126 | ✅ Собрano, 208 endpoints, 918 тестов, push-token endpoint | **100%** |
| **Web** (balloo.su) | 227 | ✅ Собрano, 119 screens, 208 routes, history/download в SPA | **100%** |
| **Shared** | 18 | ✅ Типы, константы | **100%** |
| **Desktop** (win/linux) | 23 | 🟡 Linux: deb/AppImage/tar.gz (x64+arm64) собраны из HEAD, latest-linux.yml; Windows: нет wine/CI | **80%** |
| **Mobile Android** | 31 | 🟡 Expo, 19 screens, push-сервис (expo-notifications), WS→notify, auth→registerPushToken; APK/AAB: нет SDK | **55%** |
| **History** (история версий) | 5 screens | ✅ Роуты `/history`, `/history/version/:id`, `/history/compare`; API `/api/history/versions` → 200; chunks в бандле; TLS — блокировка владельца | **90%** |
| **Download** (загрузки) | 3 screens | ✅ Роуты `/download`, `/download/progress`, `/download/:platform`; API `/api/downloads` → 200; chunks в бандле; TLS — блокировка владельца | **90%** |

### Итоговая оценка

| Метрика | Значение |
|---------|----------|
| **MVP выполнен на** | **~90%** |
| **Осталось** | **~10%** — всё блокировки владельца (см. `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` п.21–24) |
| **Осталось по времени** | **~2–4 часа** кода + действия владельца |

### Что осталось

1. **Desktop Windows** — `.exe`/`.msi`: wine или CI windows-latest (п.21).
2. **Mobile Android** — APK/AAB: Android SDK или EXPO_TOKEN (п.23); FCM-креденшалы для device push.
3. **history/download** — TLS-сертификат с SAN `history.balloo.su`, `download.balloo.su` (п.24).
4. **Cypress e2e** — разрешить бинарник в `~/.cache/Cypress` (п.22).
5. **Инфраструктура** — CI/CD для автодеплоя, мониторинг, бэкапы (вне MVP-кода, инфраструктурные задачи).

### Не входит в MVP (отложено)

- iOS (0% кода)
- MacOS (входит в desktop Electron, но не приоритет)
- web.balloo.su (отдельный лендинг — есть в web-features, 5 screens)
- t.balloo.su (упоминаний не найдено)

---

*Документация обновлена: 2026-10-13*
