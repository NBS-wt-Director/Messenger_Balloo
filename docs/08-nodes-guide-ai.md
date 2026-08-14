# Руководство по узлам монорепо Balloo — Для AI-ассистентов

> **Проект:** Balloo Messenger  
> **Версия:** 2.0.0  
> **Дата:** 2026-07-23  
> **Источник данных:** `mockups/index_ecrans.json`  
> **Цель:** Машинно-читаемая структура узлов для генерации кода и документации  

---

## 📋 Содержание

1. [Структура данных](#1-структура-данных)
2. [Система нумерации объектов](#2-система-нумерации-объектов)
3. [Метаданные всех узлов](#3-метаданные-всех-узлов)
4. [Полный список экранов с путями](#4-полный-список-экранов-с-путями)
5. [Зависимости между узлами](#5-зависимости-между-узлами)
6. [Правила генерации кода](#6-правила-генерации-кода)
7. [Шаблоны для AI](#7-шаблоны-для-ai)
8. [Порядок работы с макетами](#8-порядок-работы-с-макетами)

---

## 1. Структура данных

### Файл `index_ecrans.json`

Основной источник структурированных данных о всех узлах и экранах:

```json
{
  "project": "Balloo Messenger",
  "version": "1.0.0",
  "last_updated": "2026-07-23",
  "total_screens": 173,
  "screens_unviewed": 0,
  "nodes": [ ... ],
  "api": { ... },
  "data": { ... },
  "components": { ... }
}
```

### Структура узла (node)

```json
{
  "id": "у_01",
  "name": "balloo.su",
  "icon": "💬",
  "domain": "Основной мессенджер",
  "total_screens": 41,
  "viewed": 41,
  "edits_specific": 11,
  "edits_global_accepted": 3,
  "components_private": 41,
  "components_global": 5,
  "app_functions_count": 27,
  "app_functions": [ ... ],
  "status": "запланирован",
  "doc_md": null,
  "screens": [ ... ]
}
```

### Структура экрана (screen)

```json
{
  "id": "1_01_04",
  "name": "Список чатов",
  "file": "balloo-su/chats.html",
  "status": "Просмотрен",
  "doc_md": "balloo-su/chats.md"
}
```

---

## 2. Система нумерации объектов

### Формат ID: `z_xx_yy`

| Префикс | Тип | Диапазон | Пример |
|---|---|---|---|
| `у` | Узел (node) | 00–11 | `у_01` |
| `0` | Функция (function) | 01–99 | `0_01_03` |
| `1` | Экран (screen) | 01–99 | `1_01_04` |
| `2` | API-эндпоинт | 01–99 | `2_01_05` |
| `3` | Сущность данных | 01–99 | `3_01_02` |
| `4` | Компонент | 01–99 | `4_01_01` |

### Правила парсинга ID

```
ID: 1_01_04
  ├── 1 — тип объекта (экран)
  ├── 01 — номер узла (balloo.su)
  └── 04 — порядковый номер внутри узла
```

### Маппинг номеров узлов

```json
{
  "00": "shared (Общие экраны)",
  "01": "balloo.su (Основной мессенджер)",
  "02": "admin.balloo.su (Админ-панель)",
  "03": "command.balloo.su (Портал сотрудников)",
  "04": "features.balloo.su (Фич-реквесты)",
  "05": "history.balloo.su (История версий)",
  "06": "download.balloo.su (Загрузки)",
  "07": "docs.balloo.su (API документация)",
  "08": "mobile (сборные) (Мобильные макеты)",
  "09": "desktop (генеральный) (ПК обёртки)",
  "10": "specifity.balloo.su (Спецификация)",
  "11": "blog.balloo.su (Корпоративный блог)"
}
```

---

## 3. Метаданные всех узлов

### Узел 0: shared (у_00)

```yaml
id: у_00
name: shared
icon: 🔗
domain: Общие экраны
total_screens: 8
viewed: 8
edits_specific: 0
edits_global_accepted: 0
components_private: 8
components_global: 5
app_functions_count: 0
app_functions: []
status: запланирован
path: mockups/shared/
```

### Узел 1: balloo.su (у_01)

```yaml
id: у_01
name: balloo.su
icon: 💬
domain: Основной мессенджер
total_screens: 41
viewed: 41
edits_specific: 11
edits_global_accepted: 3
components_private: 41
components_global: 5
app_functions_count: 27
status: запланирован
path: mockups/balloo-su/
```

### Узел 2: admin.balloo.su (у_02)

```yaml
id: у_02
name: admin.balloo.su
icon: 🛡️
domain: Админ-панель
total_screens: 25
viewed: 25
edits_specific: 1
edits_global_accepted: 4
components_private: 25
components_global: 5
app_functions_count: 21
status: запланирован
path: mockups/admin-balloo-su/
```

### Узел 3: command.balloo.su (у_03)

```yaml
id: у_03
name: command.balloo.su
icon: 🏢
domain: Портал сотрудников
total_screens: 26
viewed: 26
edits_specific: 0
edits_global_accepted: 4
components_private: 26
components_global: 5
app_functions_count: 22
status: запланирован
path: mockups/command-balloo-su/
```

### Узел 4: features.balloo.su (у_04)

```yaml
id: у_04
name: features.balloo.su
icon: 💡
domain: Фич-реквесты
total_screens: 6
viewed: 6
edits_specific: 0
edits_global_accepted: 4
components_private: 6
components_global: 5
app_functions_count: 5
status: запланирован
path: mockups/features-balloo-su/
```

### Узел 5: history.balloo.su (у_05)

```yaml
id: у_05
name: history.balloo.su
icon: 📜
domain: История версий
total_screens: 3
viewed: 3
edits_specific: 0
edits_global_accepted: 3
components_private: 3
components_global: 5
app_functions_count: 4
status: запланирован
path: mockups/history-balloo-su/
```

### Узел 6: download.balloo.su (у_06)

```yaml
id: у_06
name: download.balloo.su
icon: ⬇️
domain: Загрузки
total_screens: 2
viewed: 2
edits_specific: 0
edits_global_accepted: 2
components_private: 2
components_global: 5
app_functions_count: 2
status: запланирован
path: mockups/download-balloo-su/
```

### Узел 7: docs.balloo.su (у_07)

```yaml
id: у_07
name: docs.balloo.su
icon: 📚
domain: API документация
total_screens: 1
viewed: 1
edits_specific: 0
edits_global_accepted: 0
components_private: 1
components_global: 5
app_functions_count: 1
status: запланирован
path: mockups/docs-balloo-su/
```

### Узел 8: mobile (у_08)

```yaml
id: у_08
name: mobile (сборные)
icon: 📱
domain: Мобильные макеты
total_screens: 23
viewed: 23
edits_specific: 8
edits_global_accepted: 5
components_private: 23
components_global: 5
app_functions_count: 13
status: запланирован
path: mockups/mobile/
```

### Узел 9: desktop (у_09)

```yaml
id: у_09
name: desktop (генеральный)
icon: 🖥️
domain: ПК обёртки
total_screens: 23
viewed: 23
edits_specific: 2
edits_global_accepted: 3
components_private: 23
components_global: 5
app_functions_count: 16
status: запланирован
path: mockups/desktop/
```

### Узел 10: specifity.balloo.su (у_10)

```yaml
id: у_10
name: specifity.balloo.su
icon: 📐
domain: Спецификация
total_screens: 7
viewed: 7
edits_specific: 0
edits_global_accepted: 0
components_private: 7
components_global: 5
app_functions_count: 7
status: запланирован
path: mockups/specifity-balloo-su/
```

### Узел 11: blog.balloo.su (у_11)

```yaml
id: у_11
name: blog.balloo.su
icon: 📝
domain: Корпоративный блог
total_screens: 6
viewed: 6
edits_specific: 0
edits_global_accepted: 1
components_private: 6
components_global: 5
app_functions_count: 2
status: запланирован
path: mockups/blog-balloo-su/
```

---

## 4. Полный список экранов с путями

### Экраны у_00 (shared) — 8 экранов

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_00_01 | Ошибка 404 (не найдено) | mockups/shared/error-404.html | mockups/shared/error-404.md | Просмотрен |
| 1_00_02 | Ошибка 403 (доступ запрещён) | mockups/shared/error-403.html | mockups/shared/error-403.md | Просмотрен |
| 1_00_03 | Ошибка 500 (внутренняя ошибка) | mockups/shared/error-500.html | mockups/shared/error-500.md | Просмотрен |
| 1_00_04 | Ошибка 503 (сервис недоступен) | mockups/shared/error-503.html | mockups/shared/error-503.md | Просмотрен |
| 1_00_05 | Офлайн (авторизованный) | mockups/shared/offline-authed.html | mockups/shared/offline-authed.md | Просмотрен |
| 1_00_06 | Офлайн (гость / неавторизованный) | mockups/shared/offline-guest.html | mockups/shared/offline-guest.md | Просмотрен |
| 1_00_07 | Ошибка 555 (аккаунт заблокирован) | mockups/shared/error-555.html | mockups/shared/error-555.md | Просмотрен |
| 1_00_08 | Обжалование бана (оверлей) | mockups/shared/ban-appeal.html | mockups/shared/ban-appeal.md | Просмотрен |

### Экраны у_01 (balloo.su) — 41 экран

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_01 | Онбординг | mockups/balloo-su/onboarding.html | mockups/balloo-su/onboarding.md | Принят |
| 1_01_02 | Вход | mockups/balloo-su/login.html | mockups/balloo-su/login.md | Просмотрен |
| 1_01_03 | Регистрация | mockups/balloo-su/register.html | mockups/balloo-su/register.md | Просмотрен |
| 1_01_04 | Список чатов | mockups/balloo-su/chats.html | mockups/balloo-su/chats.md | Просмотрен |
| 1_01_05 | Контакты | mockups/balloo-su/contacts.html | mockups/balloo-su/contacts.md | Просмотрен |
| 1_01_06 | Глобальный поиск | mockups/balloo-su/search.html | mockups/balloo-su/search.md | Просмотрен |
| 1_01_07 | Архив чатов | mockups/balloo-su/archive.html | mockups/balloo-su/archive.md | Просмотрен |
| 1_01_08 | Профиль | mockups/balloo-su/profile.html | mockups/balloo-su/profile.md | Просмотрен |
| 1_01_09 | Публичный профиль | mockups/balloo-su/public-profile.html | mockups/balloo-su/public-profile.md | Просмотрен |
| 1_01_10 | Звонки | mockups/balloo-su/calls.html | mockups/balloo-su/calls.md | Просмотрен |
| 1_01_11 | Активный звонок | mockups/balloo-su/active-call.html | mockups/balloo-su/active-call.md | Принят |
| 1_01_12 | Правила платформы | mockups/balloo-su/rules.html | mockups/balloo-su/rules.md | Принят |
| 1_01_13 | Приглашения | mockups/balloo-su/invites.html | mockups/balloo-su/invites.md | Принят |
| 1_01_14 | Техподдержка | mockups/balloo-su/support.html | mockups/balloo-su/support.md | Принят |
| 1_01_15 | Боты | mockups/balloo-su/bots.html | mockups/balloo-su/bots.md | Принят |
| 1_01_16 | О компании | mockups/balloo-su/about-company.html | mockups/balloo-su/about-company.md | Принят |
| 1_01_17 | О Balloo | mockups/balloo-su/about-balloo.html | mockups/balloo-su/about-balloo.md | Принят |
| 1_01_18 | Создание группы | mockups/balloo-su/group-create.html | mockups/balloo-su/group-create.md | Просмотрен |
| 1_01_19 | Настройки группы | mockups/balloo-su/group-settings.html | mockups/balloo-su/group-settings.md | Просмотрен |
| 1_01_20 | Настройки приложения | mockups/balloo-su/settings.html | mockups/balloo-su/settings.md | Просмотрен |
| 1_01_21 | Мои устройства | mockups/balloo-su/my-devices.html | mockups/balloo-su/my-devices.md | Просмотрен |
| 1_01_22 | Мультиаккаунт | mockups/balloo-su/accounts.html | mockups/balloo-su/accounts.md | Просмотрен |
| 1_01_23 | Добавить устройство | mockups/balloo-su/add-device.html | mockups/balloo-su/add-device.md | Просмотрен |
| 1_01_24 | Донат | mockups/balloo-su/donate.html | mockups/balloo-su/donate.md | Принят |
| 1_01_25 | Вложения чата | mockups/balloo-su/chat-attachments.html | mockups/balloo-su/chat-attachments.md | Принят |
| 1_01_26 | Жалоба на сообщение | mockups/balloo-su/report-message.html | mockups/balloo-su/report-message.md | Принят |
| 1_01_27 | Сторис | mockups/balloo-su/stories.html | mockups/balloo-su/stories.md | Просмотрен |
| 1_01_28 | Редактор опроса | mockups/balloo-su/poll-editor.html | mockups/balloo-su/poll-editor.md | Принят |
| 1_01_29 | Восстановление пароля | mockups/balloo-su/password-reset.html | mockups/balloo-su/password-reset.md | Просмотрен |
| 1_01_30 | Двухфакторная аутентификация | mockups/balloo-su/two-factor.html | mockups/balloo-su/two-factor.md | Просмотрен |
| 1_01_31 | Мои донаты | mockups/balloo-su/my-donates.html | mockups/balloo-su/my-donates.md | Просмотрен |
| 1_01_32 | Редактор сообщения | mockups/balloo-su/message-editor.html | mockups/balloo-su/message-editor.md | Просмотрен |
| 1_01_33 | Просмотр файла/изображения | mockups/balloo-su/file-viewer.html | mockups/balloo-su/file-viewer.md | Просмотрен |
| 1_01_34 | Настройки уведомлений | mockups/balloo-su/notification-settings.html | mockups/balloo-su/notification-settings.md | Просмотрен |
| 1_01_35 | Создание канала | mockups/balloo-su/channel-create.html | mockups/balloo-su/channel-create.md | Просмотрен |
| 1_01_36 | Пустой чат | mockups/balloo-su/empty-chat.html | mockups/balloo-su/empty-chat.md | Просмотрен |
| 1_01_37 | Настройки приватности | mockups/balloo-su/privacy-settings.html | mockups/balloo-su/privacy-settings.md | Просмотрен |
| 1_01_38 | Блокированные пользователи | mockups/balloo-su/blocked-users.html | mockups/balloo-su/blocked-users.md | Просмотрен |
| 1_01_39 | Запись голосового | mockups/balloo-su/voice-message.html | mockups/balloo-su/voice-message.md | Просмотрен |
| 1_01_40 | Панель вложений | mockups/balloo-su/attachment-panel.html | mockups/balloo-su/attachment-panel.md | Просмотрен |
| 1_01_41 | Создание историй | mockups/balloo-su/story-create.html | mockups/balloo-su/story-create.md | Просмотрен |

### Экраны у_02 (admin.balloo.su) — 25 экранов

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_02_01 | Объявления | mockups/admin-balloo-su/announcements.html | mockups/admin-balloo-su/announcements.md | Просмотрен |
| 1_02_02 | Аудит-лог | mockups/admin-balloo-su/audit-log.html | mockups/admin-balloo-su/audit-log.md | Просмотрен |
| 1_02_03 | Бан-лист | mockups/admin-balloo-su/bans.html | mockups/admin-balloo-su/bans.md | Просмотрен |
| 1_02_05 | Каналы блога | mockups/admin-balloo-su/blog-channels.html | mockups/admin-balloo-su/blog-channels.md | Просмотрен |
| 1_02_06 | Миграция блога | mockups/admin-balloo-su/blog-migrate.html | mockups/admin-balloo-su/blog-migrate.md | Просмотрен |
| 1_02_07 | Очередь блога | mockups/admin-balloo-su/blog-queue.html | mockups/admin-balloo-su/blog-queue.md | Просмотрен |
| 1_02_08 | Ревью блога | mockups/admin-balloo-su/blog-review.html | mockups/admin-balloo-su/blog-review.md | Просмотрен |
| 1_02_09 | Статистика блога | mockups/admin-balloo-su/blog-stats.html | mockups/admin-balloo-su/blog-stats.md | Просмотрен |
| 1_02_10 | Управление ботами | mockups/admin-balloo-su/bots-mgmt.html | mockups/admin-balloo-su/bots-mgmt.md | Просмотрен |
| 1_02_13 | Донаты | mockups/admin-balloo-su/donations.html | mockups/admin-balloo-su/donations.md | Просмотрен |
| 1_02_14 | Сотрудники | mockups/admin-balloo-su/employees.html | mockups/admin-balloo-su/employees.md | Просмотрен |
| 1_02_15 | Feature flags | mockups/admin-balloo-su/features-flags.html | mockups/admin-balloo-su/features-flags.md | Просмотрен |
| 1_02_16 | Управление фичами | mockups/admin-balloo-su/features-mgmt.html | mockups/admin-balloo-su/features-mgmt.md | Просмотрен |
| 1_02_17 | Файлы | mockups/admin-balloo-su/files.html | mockups/admin-balloo-su/files.md | Просмотрен |
| 1_02_18 | Управление группами | mockups/admin-balloo-su/groups-mgmt.html | mockups/admin-balloo-su/groups-mgmt.md | Просмотрен |
| 1_02_20 | Метрики | mockups/admin-balloo-su/metrics.html | mockups/admin-balloo-su/metrics.md | Просмотрен |
| 1_02_21 | Отчёты | mockups/admin-balloo-su/reports.html | mockups/admin-balloo-su/reports.md | Просмотрен |
| 1_02_22 | Статус сервиса | mockups/admin-balloo-su/service-status.html | mockups/admin-balloo-su/service-status.md | Просмотрен |
| 1_02_23 | Тексты | mockups/admin-balloo-su/texts.html | mockups/admin-balloo-su/texts.md | Просмотрен |
| 1_02_24 | Пользователи | mockups/admin-balloo-su/users.html | mockups/admin-balloo-su/users.md | Просмотрен |
| 1_02_26 | Версии | mockups/admin-balloo-su/versions.html | mockups/admin-balloo-su/versions.md | Просмотрен |
| 1_03_02 | Дашборд | mockups/command-balloo-su/dashboard.html | mockups/admin-balloo-su/dashboard.md | Принят |
| 1_03_15 | Отделы | mockups/command-balloo-su/departments.html | mockups/admin-balloo-su/departments.md | Принят |
| 1_03_07 | Вакансии | mockups/command-balloo-su/vacancies.html | mockups/admin-balloo-su/vacancies.md | Принят |
| 1_01_02 | Вход | mockups/balloo-su/login.html | mockups/admin-balloo-su/login.md | Просмотрен |

### Экраны у_03 (command.balloo.su) — 26 экранов

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_03_01 | Вход | mockups/command-balloo-su/login.html | mockups/command-balloo-su/login.md | Принят |
| 1_03_02 | Дашборд | mockups/command-balloo-su/dashboard.html | mockups/command-balloo-su/dashboard.md | Принят |
| 1_03_03 | HR-модуль | mockups/command-balloo-su/hr.html | mockups/command-balloo-su/hr.md | Принят |
| 1_03_04 | База знаний | mockups/command-balloo-su/knowledge-base.html | mockups/command-balloo-su/knowledge-base.md | Принят |
| 1_03_05 | Найм | mockups/command-balloo-su/hiring.html | mockups/command-balloo-su/hiring.md | Принят |
| 1_03_06 | Мониторинг продукта | mockups/command-balloo-su/monitoring.html | mockups/command-balloo-su/monitoring.md | Принят |
| 1_03_07 | Вакансии | mockups/command-balloo-su/vacancies.html | mockups/command-balloo-su/vacancies.md | Принят |
| 1_03_08 | Детали вакансии | mockups/command-balloo-su/vacancy-detail.html | mockups/command-balloo-su/vacancy-detail.md | Принят |
| 1_03_09 | Анкета кандидата | mockups/command-balloo-su/application-form.html | mockups/command-balloo-su/application-form.md | Принят |
| 1_03_10 | Почему мы | mockups/command-balloo-su/why-us.html | mockups/command-balloo-su/why-us.md | Принят |
| 1_03_11 | Внутренний чат | mockups/command-balloo-su/internal-chat.html | mockups/command-balloo-su/internal-chat.md | Принят |
| 1_03_12 | Встречи | mockups/command-balloo-su/meetings.html | mockups/command-balloo-su/meetings.md | Принят |
| 1_03_13 | Мои задачи | mockups/command-balloo-su/todo.html | mockups/command-balloo-su/todo.md | Принят |
| 1_03_14 | Мой отдел | mockups/command-balloo-su/my-department.html | mockups/command-balloo-su/my-department.md | Принят |
| 1_03_15 | Отделы | mockups/command-balloo-su/departments.html | mockups/command-balloo-su/departments.md | Принят |
| 1_03_16 | Управление отделами | mockups/command-balloo-su/department-management.html | mockups/command-balloo-su/department-management.md | Принят |
| 1_03_17 | Мои публикации | mockups/command-balloo-su/blog-my-posts.html | mockups/command-balloo-su/blog-my-posts.md | Принят |
| 1_03_18 | Редактор блога | mockups/command-balloo-su/blog-editor.html | mockups/command-balloo-su/blog-editor.md | Принят |
| 1_03_19 | Мой канал | mockups/command-balloo-su/blog-my-channel.html | mockups/command-balloo-su/blog-my-channel.md | Принят |
| 1_03_20 | Настройки канала | mockups/command-balloo-su/blog-channel-settings.html | mockups/command-balloo-su/blog-channel-settings.md | Принят |
| 1_03_21 | Профиль сотрудника | mockups/command-balloo-su/employee-profile.html | mockups/command-balloo-su/employee-profile.md | Принят |
| 1_03_22 | Календарь | mockups/command-balloo-su/calendar.html | mockups/command-balloo-su/calendar.md | Принят |
| 1_03_23 | Карточка кандидата | mockups/command-balloo-su/candidate.html | mockups/command-balloo-su/candidate.md | Принят |
| 1_03_24 | Карточка кандидата (интервью) | mockups/command-balloo-su/candidate-interview.html | mockups/command-balloo-su/candidate-interview.md | Просмотрен |
| 1_03_25 | Дашборд руководителя | mockups/command-balloo-su/manager-dashboard.html | mockups/command-balloo-su/manager-dashboard.md | Просмотрен |
| 1_03_26 | Отпуска и отсутствие | mockups/command-balloo-su/time-off.html | mockups/command-balloo-su/time-off.md | Просмотрен |

### Экраны у_04 (features.balloo.su) — 6 экранов

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_02 | Вход | mockups/balloo-su/login.html | mockups/features-balloo-su/login.md | Просмотрен |
| 1_01_24 | Донат | mockups/balloo-su/donate.html | mockups/features-balloo-su/donate.md | Принят |
| 1_04_02 | Детали фич-реквеста | mockups/features-balloo-su/feature-detail.html | mockups/features-balloo-su/feature-detail.md | Просмотрен |
| 1_04_03 | Список фич-реквестов | mockups/features-balloo-su/list.html | mockups/features-balloo-su/list.md | Принят |
| 1_04_04 | Голосование по фичам | mockups/features-balloo-su/vote.html | mockups/features-balloo-su/vote.md | Просмотрен |
| 1_04_05 | Отправить фич-реквест | mockups/features-balloo-su/submit.html | mockups/features-balloo-su/submit.md | Принят |

### Экраны у_05 (history.balloo.su) — 3 экрана

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_24 | Донат | mockups/balloo-su/donate.html | mockups/history-balloo-su/donate.md | Принят |
| 1_05_02 | Детали версии | mockups/history-balloo-su/version-detail.html | mockups/history-balloo-su/version-detail.md | Просмотрен |
| 1_05_03 | Список версий | mockups/history-balloo-su/version-list.html | mockups/history-balloo-su/version-list.md | Принят |

### Экраны у_06 (download.balloo.su) — 2 экрана

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_24 | Донат | mockups/balloo-su/donate.html | mockups/download-balloo-su/donate.md | Принят |
| 1_06_02 | Загрузки | mockups/download-balloo-su/downloads.html | mockups/download-balloo-su/downloads.md | Просмотрен |

### Экраны у_07 (docs.balloo.su) — 1 экран

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_07_01 | Документация API | mockups/docs-balloo-su/api-docs.html | mockups/docs-balloo-su/api-docs.md | Просмотрен |

### Экраны у_08 (mobile) — 23 экрана

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_08_01 | Обзор / Приветствие | mockups/mobile/overview.html | mockups/mobile/overview.md | Принят |
| 1_08_02 | Чат | mockups/mobile/chat.html | mockups/mobile/chat.md | Принят |
| 1_08_03 | История звонков | mockups/mobile/calls-history.html | mockups/mobile/calls-history.md | Принят |
| 1_08_04 | Настройки приложения | mockups/mobile/settings.html | mockups/mobile/settings.md | Принят |
| 1_08_05 | Мои устройства | mockups/mobile/my-devices.html | mockups/mobile/my-devices.md | Принят |
| 1_08_06 | Добавить устройство | mockups/mobile/add-device.html | mockups/mobile/add-device.md | Принят |
| 1_08_07 | Донат | mockups/mobile/donate.html | mockups/mobile/donate.md | Принят |
| 1_08_08 | Вложения чата | mockups/mobile/chat-attachments.html | mockups/mobile/chat-attachments.md | Принят |
| 1_08_09 | Жалоба на сообщение | mockups/mobile/report-message.html | mockups/mobile/report-message.md | Принят |
| 1_08_10 | Вход | mockups/mobile/login.html | mockups/mobile/login.md | Принят |
| 1_08_11 | Регистрация | mockups/mobile/register.html | mockups/mobile/register.md | Принят |
| 1_08_12 | Восстановление пароля | mockups/mobile/password-reset.html | mockups/mobile/password-reset.md | Принят |
| 1_08_13 | Двухфакторная аутентификация | mockups/mobile/two-factor.html | mockups/mobile/two-factor.md | Принят |
| 1_08_14 | Мои донаты | mockups/mobile/my-donates.html | mockups/mobile/my-donates.md | Принят |
| 1_08_15 | Сторис | mockups/mobile/stories.html | mockups/mobile/stories.md | Принят |
| 1_08_16 | Архив чатов | mockups/mobile/archive.html | mockups/mobile/archive.md | Принят |
| 1_08_17 | Контакты | mockups/mobile/contacts.html | mockups/mobile/contacts.md | Принят |
| 1_08_18 | Профиль | mockups/mobile/profile.html | mockups/mobile/profile.md | Принят |
| 1_08_19 | Создание группы | mockups/mobile/group-create.html | mockups/mobile/group-create.md | Принят |
| 1_08_20 | Редактор опроса | mockups/mobile/poll-editor.html | mockups/mobile/poll-editor.md | Принят |
| 1_08_21 | Пустой чат | mockups/mobile/empty-chat.html | mockups/mobile/empty-chat.md | Просмотрен |
| 1_08_22 | Полноэкранный просмотрщик медиа | mockups/mobile/media-viewer.html | mockups/mobile/media-viewer.md | Просмотрен |
| 1_08_23 | Запись голосового (mobile) | mockups/mobile/voice-record.html | mockups/mobile/voice-record.md | Просмотрен |

### Экраны у_09 (desktop) — 23 экрана

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_02 | Вход | mockups/balloo-su/login.html | mockups/desktop/login.md | Просмотрен |
| 1_01_03 | Регистрация | mockups/balloo-su/register.html | mockups/desktop/register.md | Просмотрен |
| 1_09_01 | Обзор / Приветствие | mockups/desktop/overview.html | mockups/desktop/overview.md | Принят |
| 1_09_02 | Modes | mockups/desktop/modes.html | mockups/desktop/modes.md | Принят |
| 1_09_03 | Мои устройства | mockups/desktop/my-devices.html | mockups/desktop/my-devices.md | Принят |
| 1_09_04 | Добавить устройство | mockups/desktop/add-device.html | mockups/desktop/add-device.md | Принят |
| 1_09_05 | Донат | mockups/desktop/donate.html | mockups/desktop/donate.md | Принят |
| 1_09_06 | Вложения чата | mockups/desktop/chat-attachments.html | mockups/desktop/chat-attachments.md | Принят |
| 1_09_07 | Жалоба на сообщение | mockups/desktop/report-message.html | mockups/desktop/report-message.md | Принят |
| 1_09_08 | Восстановление пароля | mockups/desktop/password-reset.html | mockups/desktop/password-reset.md | Просмотрен |
| 1_09_09 | Двухфакторная аутентификация | mockups/desktop/two-factor.html | mockups/desktop/two-factor.md | Просмотрен |
| 1_09_10 | Мои донаты | mockups/desktop/my-donates.html | mockups/desktop/my-donates.md | Принят |
| 1_09_11 | Чат | mockups/desktop/chat.html | mockups/desktop/chat.md | Принят |
| 1_09_12 | Сторис | mockups/desktop/stories.html | mockups/desktop/stories.md | Принят |
| 1_09_13 | История звонков | mockups/desktop/calls-history.html | mockups/desktop/calls-history.md | Принят |
| 1_09_14 | Архив чатов | mockups/desktop/archive.html | mockups/desktop/archive.md | Принят |
| 1_09_15 | Контакты | mockups/desktop/contacts.html | mockups/desktop/contacts.md | Принят |
| 1_09_16 | Создание группы | mockups/desktop/group-create.html | mockups/desktop/group-create.md | Принят |
| 1_09_17 | Редактор опроса | mockups/desktop/poll-editor.html | mockups/desktop/poll-editor.md | Принят |
| 1_09_18 | Настройки приложения | mockups/desktop/settings.html | mockups/desktop/settings.md | Принят |
| 1_09_19 | Профиль | mockups/desktop/profile.html | mockups/desktop/profile.md | Принят |
| 1_09_20 | Настройки уведомлений | mockups/desktop/notification-settings.html | mockups/desktop/notification-settings.md | Просмотрен |
| 1_09_21 | Полноэкранный просмотрщик медиа | mockups/desktop/media-viewer.html | mockups/desktop/media-viewer.md | Просмотрен |

### Экраны у_10 (specifity.balloo.su) — 7 экранов

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_12 | Правила платформы | mockups/balloo-su/rules.html | mockups/specifity-balloo-su/rules.md | Принят |
| 1_10_01 | Компоненты | mockups/specifity-balloo-su/components.html | mockups/specifity-balloo-su/components.md | Принят |
| 1_10_02 | Данные | mockups/specifity-balloo-su/data.html | mockups/specifity-balloo-su/data.md | Принят |
| 1_10_03 | Эндпоинты | mockups/specifity-balloo-su/endpoints.html | mockups/specifity-balloo-su/endpoints.md | Принят |
| 1_10_04 | Главная спецификации | mockups/specifity-balloo-su/home.html | mockups/specifity-balloo-su/home.md | Принят |
| 1_10_06 | Экраны | mockups/specifity-balloo-su/screens.html | mockups/specifity-balloo-su/screens.md | Принят |
| 1_10_07 | Спецификация | mockups/specifity-balloo-su/specification.html | mockups/specifity-balloo-su/specification.md | Принят |

### Экраны у_11 (blog.balloo.su) — 6 экранов

| ID | Name | HTML path | MD path | Status |
|---|---|---|---|---|
| 1_01_06 | Глобальный поиск | mockups/balloo-su/search.html | mockups/blog-balloo-su/search.md | Просмотрен |
| 1_11_01 | Категория блога | mockups/blog-balloo-su/category.html | mockups/blog-balloo-su/category.md | Просмотрен |
| 1_11_02 | Канал блога | mockups/blog-balloo-su/channel.html | mockups/blog-balloo-su/channel.md | Принят |
| 1_11_03 | Лента блога | mockups/blog-balloo-su/feed.html | mockups/blog-balloo-su/feed.md | Принят |
| 1_11_04 | Персональная лента | mockups/blog-balloo-su/personal-feed.html | mockups/blog-balloo-su/personal-feed.md | Принят |
| 1_11_05 | Пост блога | mockups/blog-balloo-su/post.html | mockups/blog-balloo-su/post.md | Принят |

---

## 5. Зависимости между узлами

### Shared-зависимости (у_00 → все)

Все узлы используют 8 общих экранов из у_00:
- error-404, error-403, error-500, error-503, error-555
- offline-authed, offline-guest, ban-appeal

### Кросс-узловые экраны

| Экран (ID) | Источник | Используются в узлах |
|---|---|---|
| 1_01_02 Вход | у_01 | у_02 (admin), у_04 (features), у_09 (desktop) |
| 1_01_03 Регистрация | у_01 | у_09 (desktop) |
| 1_01_06 Поиск | у_01 | у_11 (blog) |
| 1_01_12 Правила | у_01 | у_10 (specifity) |
| 1_01_24 Донат | у_01 | у_04, у_05, у_06, у_08, у_09 |

### Зависимости по доменам

```yaml
у_01 (balloo.su):
  базовый узел — источник общего UI
  ↳ у_08 (mobile) — адаптация
  ↳ у_09 (desktop) — адаптация
  ↳ у_04 (features) — аутентификация + донат
  ↳ у_05 (history) — донат
  ↳ у_06 (download) — донат
  ↳ у_11 (blog) — поиск

у_02 (admin):
  ↳ у_03 (command) — дашборд, отделы, вакансии
  ↳ у_01 (balloo) — вход

у_03 (command):
  ↳ у_11 (blog) — редактор блога, каналы

у_08 (mobile):
  ↳ у_01 (balloo) — адаптация для мобильных

у_09 (desktop):
  ↳ у_01 (balloo) — адаптация для десктопа
```

---

## 6. Правила генерации кода

### Правило 1: Макет → Код

Макеты (`mockups/`) — **единственный источник правды**. Код в `packages/` должен 100% соответствовать макетам по дизайну и функционалу.

### Правило 2: Дизайн-система

Все компоненты используют общую дизайн-систему:
- CSS: `mockups/assets/common.css`
- JS: `mockups/assets/common.js`
- **Не использовать border-radius** (кроме switch и аватарок)
- **Аватарки**: octagon clip-path (`--octagon-clip`)
- **Пузыри сообщений**: прямые углы с угловыми срезами (`--bubble-sender`, `--bubble-receiver`)
- **Акцент**: `--accent: #2db84d` (зелёный)
- **Шрифт**: Inter / Manrope
- **3 темы**: dark (по умолчанию), light, russian

### Правило 3: Нумерация объектов

Все новые объекты должны иметь уникальные ID по формату `z_xx_yy`:
- Экраны: `1_xx_yy`
- Функции: `0_xx_yy`
- Эндпоинты: `2_xx_yy`
- Сущности: `3_xx_yy`
- Компоненты: `4_xx_yy`

### Правило 4: Порядок создания

При добавлении нового функционала:
1. Создать экран (HTML)
2. Создать MD-документацию
3. Обновить `index.html`, `index_ecrans.md`, `index_ecrans.json`
4. Обновить `docs/` при необходимости

### Правило 5: Shared-компоненты

Переиспользуемые экраны создаются один раз в `mockups/shared/` и подключаются через shared-компоненты в `packages/shared/src/`.

### Правило 6: Структура пакетов

```
packages/
├── web/src/           # balloo.su (у_01)
├── desktop/src/       # desktop (у_09)
├── mobile-android/    # mobile (у_08) Android
├── mobile-ios/        # mobile (у_08) iOS
├── server/src/        # Backend (все узлы)
└── shared/src/        # Общие компоненты и утилиты
```

---

## 7. Шаблоны для AI

### Шаблон 1: Создание нового экрана

```
# Новая задача: создать экран {name} для узла {node_id}

# Шаги:
# 1. Определить ID: 1_{node_number}_{next_seq}
# 2. Создать файл: mockups/{node_folder}/{screen_file}.html
# 3. Создать MD: mockups/{node_folder}/{screen_file}.md
# 4. Обновить index_ecrans.json: добавить screen в node.screens
# 5. Обновить index_ecrans.md: добавить экран в таблицу узла
# 6. Обновить index.html: добавить карточку в узел
# 7. Обновить total_screens и screens_unviewed
```

### Шаблон 2: Генерация React-компонента

```
# Новая задача: создать React-компонент {component_name}

# Шаги:
# 1. Определить ID: 4_{node_number}_{next_seq}
# 2. Создать HTML-макет: mockups/components/{name}/{name}.html
# 3. Создать MD: mockups/components/{name}/{name}.md
# 4. Создать React-компонент: packages/shared/src/components/{name}/index.tsx
# 5. Добавить в общий каталог компонентов
```

### Шаблон 3: Добавление эндпоинта

```
# Новая задача: добавить API-эндпоинт {endpoint_name}

# Шаги:
# 1. Определить ID: 2_{node_number}_{next_seq}
# 2. Добавить в docs/04-api-websocket-spec.md
# 3. Добавить в docs/03-database-schema.md если нужны новые таблицы
# 4. Реализовать в packages/server/src/routes/
```

### Шаблон 4: Обновление статуса

```
# Новая задача: обновить статус экрана {screen_id}

# Доступные статусы:
# - запланирован → задокументирован → спроектирован → написан → протестирован → готов

# Шаги:
# 1. Обновить status в index_ecrans.json
# 2. Обновить status в index_ecrans.md
# 3. Если все экраны узла "готов" → обновить status узла
```

---

## 8. Порядок работы с макетами

### При правке существующего экрана

```
1. Открыть mockups/{node}/{screen}.html
2. Внести изменения
3. Обновить MD рядом: mockups/{node}/{screen}.md
4. Увеличить edits_specific у узла в index_ecrans.json
5. Обновить статус при необходимости
```

### При добавлении нового экрана

```
1. Создать HTML: mockups/{node}/{screen}.html
2. Создать MD: mockups/{node}/{screen}.md
3. Обновить index_ecrans.json:
   - Добавить screen в node.screens
   - Увеличить total_screens
   - Увеличить total_screens на проекте
   - Уменьшить screens_unviewed
   - Обновить last_updated
4. Обновить index_ecrans.md:
   - Добавить экран в таблицу узла
   - Обновить статистику узла
5. Обновить index.html:
   - Добавить карточку в узел
   - Обновить счётчики
6. Обновить docs/ при необходимости
```

### При удалении экрана

```
1. НЕ удалять HTML/MD файлы (ID не переиспользуется)
2. Уменьшить total_screens в index_ecrans.json
3. Отметить экран как "удалён" или удалить из массива screens
4. Обновить индексные файлы
```

---

## 📊 Метрики проекта

### Общие метрики

```yaml
total_screens: 173
total_nodes: 12
total_functions: 114
total_components_private: 173
total_components_global: 5
screens_unviewed: 0
```

### Распределение экранов по узлам

```yaml
у_00 (shared): 8
у_01 (balloo.su): 41
у_02 (admin): 25
у_03 (command): 26
у_04 (features): 6
у_05 (history): 3
у_06 (download): 2
у_07 (docs): 1
у_08 (mobile): 23
у_09 (desktop): 23
у_10 (specifity): 7
у_11 (blog): 6
```

### Распределение функций по узлам

```yaml
у_01 (balloo.su): 27
у_02 (admin): 21
у_03 (command): 22
у_04 (features): 5
у_05 (history): 4
у_06 (download): 2
у_07 (docs): 1
у_08 (mobile): 13
у_09 (desktop): 16
у_10 (specifity): 7
у_11 (blog): 2
```

---

## 🛠️ Инструменты и источники данных

### Обязательные источники

| Файл | Описание | Путь |
|---|---|---|
| `index_ecrans.json` | Структурированные метаданные | `mockups/index_ecrans.json` |
| `index_ecrans.md` | Человекочитаемая документация | `mockups/index_ecrans.md` |
| `index.html` | Интерактивный каталог | `mockups/index.html` |
| `common.css` | Дизайн-система | `mockups/assets/common.css` |
| `common.js` | Интерактивность | `mockups/assets/common.js` |
| `data_schema.json` | Схема данных | `mockups/data_schema.json` |
| `pre_filled_data.json` | Seed-данные | `mockups/pre_filled_data.json` |
| `api_schema.md` | API спецификация | `mockups/api_schema.md` |

### Дополнительные источники

| Файл | Описание | Путь |
|---|---|---|
| `AGENTS.md` | Инструкции AI-ассистента | `AGENTS.md` |
| `00-master-build-guide.md` | Мастер-гайд | `docs/00-master-build-guide.md` |
| `01-architecture-decisions.md` | Архитектурные решения | `docs/01-architecture-decisions.md` |
| `02-requirements-checklist.md` | Чеклист требований | `docs/02-requirements-checklist.md` |
| `03-database-schema.md` | Схема БД | `docs/03-database-schema.md` |
| `04-api-websocket-spec.md` | API/WebSocket | `docs/04-api-websocket-spec.md` |
| `05-frontend-spec.md` | Фронтенд-спецификация | `docs/05-frontend-spec.md` |
| `06-devops-infrastructure.md` | DevOps | `docs/06-devops-infrastructure.md` |

---

_Создано автоматически из `mockups/index_ecrans.json`. Дата: 2026-07-23_
