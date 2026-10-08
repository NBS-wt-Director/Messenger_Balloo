# Balloo — Документация проекта

---

## 17. Оценка готовности MVP (2026-10-08)

### MVP scope (web + win/linux + android, без iOS + MacOS)

Компоненты MVP: `balloo.su` + `api.balloo.su` + `history.balloo.su` + `download.balloo.su` + desktop (win/linux) + mobile Android.

### Статус компонентов

| Компонент | Файлов кода | Готовность | % |
|-----------|-------------|------------|---|
| **API** (api.balloo.su) | 126 | ✅ Собрano, 208 endpoints, 918 тестов | **100%** |
| **Web** (balloo.su) | 227 | ✅ Собрano, 119 screens, 208 routes | **100%** |
| **Shared** | 18 | ✅ Типы, константы | **100%** |
| **Desktop** (win/linux) | 23 | 🟡 Electron, 18 screens, dist-electron | **60%** |
| **Mobile Android** | 31 | 🟡 Expo, 19 screens, 31 файлов | **30%** |
| **History** (история чатов) | 2 screens | 🟡 Экраны в web, нет отдельного пакета | **40%** |
| **Download** (загрузки) | 3 screens | 🟡 Экраны в web, нет отдельного пакета | **40%** |

### Итоговая оценка

| Метрика | Значение |
|---------|----------|
| **MVP выполнен на** | **~75%** |
| **Осталось сделать** | **~25%** (desktop polish, Android, history/download sub-apps) |
| **Осталось по времени** | **~2–3 недели** при 1 разработчике |

### Что осталось

1. **Desktop (win/linux)** — доделать 40%: упаковка Electron, авто-обновления, иконки, инсталляторы `.exe` и `.AppImage`/`.deb`.
2. **Mobile Android** — доделать 70%: Expo build, пуш-уведомления (FCM), иконки/сплэш, `.aab` для Play Market.
3. **history.balloo.su** — вынести из web в отдельный пакет (сборка, роутинг, домен).
4. **download.balloo.su** — вынести из web в отдельный пакет.
5. **Инфраструктура** — CI/CD для автодеплоя, мониторинг, бэкапы.

### Не входит в MVP (отложено)

- iOS (0% кода)
- MacOS (входит в desktop Electron, но не приоритет)
- web.balloo.su (отдельный лендинг — есть в web-features, 5 screens)
- t.balloo.su (упоминаний не найдено)

---

*Документация обновлена: 2026-10-08*
