# Опросник по аудиту экранов (тикет 1790479490-04)

**Дата:** 2026-09-29 · **правило индексирования:** А (ответ владельца В-29) ·
**генератор:** `scripts/screens-audit.cjs` · **отчёт:** `tickets/screens-audit.html`

## Сводка аудита

- Всего экранов в макетах: **172**
- ✅ Код + маршрут: **122**
- 🟡 Состояние существующего экрана: **50**
- 🔴 Нет кода: **0**
- 🟠 Код без маршрута: **0**
- Макетов без HTML-файла: **1**

## 1. Экраны, требующие решения владельца

| ID | Экран | Узел | Макет | Вопрос |
|---|---|---|---|---|
| 1_04_04 | Голосование по фичам | у_04 | features-balloo-su/vote.html | HTML-файла макета нет на диске. Нужен ли в v2, какой функционал? |

## 2. Экраны кода без макета (обратный проход)

Найдено **26** экранов кода, которым не сопоставлен макет.
Часть из них — служебные/вспомогательные (лендинг, юридические, layout-обёртки),
часть — экраны, появившиеся в коде без макета (например, `AdminSupportScreen`,
`InstallScreen`, `UserDetailScreen`, блог-лендинг). Решение владельца: заводить
ли на них макеты в `mockups/` или пометить как «код без макета, допустимо».

| Экран кода | Комментарий |
|---|---|
| `AdminSupportScreen` | |
| `ApplicationsScreen` | |
| `BlogCategoriesScreen` | |
| `BlogPostScreen` | |
| `BlogScreen` | |
| `BlogSearchScreen` | |
| `BlogSubscribeScreen` | |
| `ChannelScreen` | |
| `ChannelSettingsScreen` | |
| `ChannelViewScreen` | |
| `CommandBlogScreen` | |
| `CommandSettingsScreen` | |
| `CompareScreen` | |
| `CookiesScreen` | |
| `CreatePageScreen` | |
| `CreatePostScreen` | |
| `DownloadProgressScreen` | |
| `EditPageScreen` | |
| `ForKassaScreen` | |
| `InstallScreen` | |
| `InterviewsScreen` | |
| `KnowledgePageScreen` | |
| `LandingScreen` | |
| `MyApplicationsScreen` | |
| `PrivacyScreen` | |
| `UserDetailScreen` | |

## 3. Заглушки `NotFoundScreen` в роутере (11 упоминаний)

| Маршрут | Что закрыто | Вердикт |
|---|---|---|
| `/admin/texts` | Тексты (SystemSettingsScreen есть, но роут — заглушка) | проверить |
| `/admin/departments` | Отделы | осознанная заглушка |
| `/admin/employees` | Сотрудники | осознанная заглушка |
| `/admin/vacancies` | Вакансии | осознанная заглушка |
| `/admin/features` | Фичи (модерация) | осознанная заглушка |
| `/command/meetings` | Встречи | осознанная заглушка |
| `/command/my-department` | Мой отдел | осознанная заглушка |
| `/command/departments` | Отделы | осознанная заглушка |
| `/command/monitoring` | Мониторинг | осознанная заглушка |
| `*` (fallback) | Настоящая страница 404 | осознанная |

## 4. Как вернуть документ

Отвечайте по номерам: «1: vote.html — не нужен», «2: AdminSupportScreen —
оставить без макета». После ответов задача `1790479490-05` (недостающие экраны)
получит точный список работ.