# Balloo Messenger — Индекс экранов монорепо


> **Готовность:** `✅ 100%` — все экраны просмотрены и приняты  
> **Дата обновления:** 2026-07-30  
> **Всего узлов:** 12  
> **Всего экранов:** 173  
> **Просмотрено:** 173 / 173  
> **Темы оформления:** 3 (dark, light, russian) — эталон зафиксирован в `mockups/index.html`  
> **Каталог `mockups/index.html`:** 4 раздела — Экраны, API, Данные, Компоненты.  
> **Нумерация объектов:** `z_xx_yy`: экраны(1), функции(0), эндпоинты(2), сущности(3), компоненты(4).  
> **API документация:** `mockups/api_schema.md` (150 эндпоинтов, 24 WS-события)  
> **Схема данных:** `mockups/data_schema.json` (81 таблица)  

---

## Система нумерации `z_xx_yy`


| Префикс `z` | Тип объекта |
|---|---|

| `у` | Узел (node) |
| `0` | Функция (function) |
| `1` | Экран (screen) |
| `2` | API-эндпоинт |
| `3` | Сущность данных |
| `4` | Компонент |

- `xx` — номер узла (00–11)
- `yy` — порядковый номер внутри узла
- ID не меняются при правках, не переиспользуются



## Легенда статусов реализации


| Статус | Описание |
|---|---|

| `задокументирован` | Описан в планах, макет не начат |
| `задокументирован` | Написана документация |
| `спроектирован` | Макет/дизайн готов |
| `написан` | Код написан, не протестирован |
| `протестирован` | Код протестирован |
| `готов` | Релизнут |



## Сводная таблица узлов


| ID узла | Узел | Иконка | Экранов | Статус | Просмотрено | Правок частн. | Правок глоб. | Документация | Компоненты (ч./глом.) | Функций | Реализация |
|---|---|---|---|---|---|---|---|---|---|---|---|

| `у_00` | shared | 🔗 | 8 | ✅ | ✅ | 0 | 0 | ❌ | 8 / 5 | 0 | задокументирован |

| `у_01` | balloo.su | 💬 | 41 | ✅ | ✅ | 11 | 3 | ❌ | 41 / 5 | 27 | задокументирован |

| `у_02` | admin.balloo.su | 🛡️ | 25 | ✅ | ✅ | 1 | 4 | ❌ | 25 / 5 | 21 | задокументирован |

| `у_03` | command.balloo.su | 🏢 | 26 | ✅ | ✅ | 0 | 4 | ❌ | 26 / 5 | 22 | задокументирован |

| `у_04` | features.balloo.su | 💡 | 6 | ✅ | ✅ | 0 | 4 | ❌ | 6 / 5 | 5 | задокументирован |

| `у_05` | history.balloo.su | 📜 | 3 | ✅ | ✅ | 0 | 3 | ❌ | 3 / 5 | 4 | задокументирован |

| `у_06` | download.balloo.su | ⬇️ | 2 | ✅ | ✅ | 0 | 2 | ❌ | 2 / 5 | 2 | задокументирован |

| `у_07` | docs.balloo.su | 📚 | 1 | ✅ | ✅ | 0 | 0 | ❌ | 1 / 5 | 1 | задокументирован |

| `у_08` | mobile (сборные) | 📱 | 23 | ✅ | ✅ | 8 | 5 | ❌ | 23 / 5 | 13 | задокументирован |

| `у_09` | desktop (генеральный) | 🖥️ | 23 | ✅ | ✅ | 2 | 3 | ❌ | 23 / 5 | 16 | задокументирован |

| `у_10` | specifity.balloo.su | 📐 | 7 | ✅ | ✅ | 0 | 0 | ❌ | 7 / 5 | 7 | задокументирован |

| `у_11` | blog.balloo.su | 📝 | 6 | ✅ | ✅ | 0 | 1 | ❌ | 6 / 5 | 2 | задокументирован |


---



## 1. 🔗 shared — Общие экраны (`у_00`)


- **Просмотрено:** 8/8

- **Правок частных:** 0

- **Правок глобальных принятых:** 0

- **Компоненты:** 8 частных / 5 глобальных

- **Функций:** 0

- **Статус реализации:** задокументирован


### Экраны (8)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_00_08` | Обжалование бана (оверлей) | `shared/ban-appeal.html` | Просмотрен | `shared/ban-appeal.md` |

| `1_00_02` | Ошибка 403 (доступ запрещён) | `shared/error-403.html` | Просмотрен | `shared/error-403.md` |

| `1_00_01` | Ошибка 404 (не найдено) | `shared/error-404.html` | Просмотрен | `shared/error-404.md` |

| `1_00_03` | Ошибка 500 (внутренняя ошибка) | `shared/error-500.html` | Просмотрен | `shared/error-500.md` |

| `1_00_04` | Ошибка 503 (сервис недоступен) | `shared/error-503.html` | Просмотрен | `shared/error-503.md` |

| `1_00_07` | Ошибка 555 (аккаунт заблокирован) | `shared/error-555.html` | Просмотрен | `shared/error-555.md` |

| `1_00_05` | Офлайн (авторизованный) | `shared/offline-authed.html` | Просмотрен | `shared/offline-authed.md` |

| `1_00_06` | Офлайн (гость / неавторизованный) | `shared/offline-guest.html` | Просмотрен | `shared/offline-guest.md` |


---



## 2. 💬 balloo.su — Основной мессенджер (`у_01`)


- **Просмотрено:** 41/41

- **Правок частных:** 11

- **Правок глобальных принятых:** 3

- **Компоненты:** 41 частных / 5 глобальных

- **Функций:** 27

- **Статус реализации:** задокументирован


### Функции приложения


1. Аутентификация

2. Управление устройствами

3. Мультиаккаунт

4. Онбординг

5. Текстовый чат

6. Групповые чаты

7. Звонки

8. Приглашения

9. Поиск

10. Архив чатов

11. Профиль

12. Публичный профиль

13. Боты

14. Техподдержка

15. Настройки приложения

16. Правила

17. О компании

18. О Balloo

19. Донат

20. Вложения

21. Жалобы

22. Сторис

23. Опросы

24. Создание групп

25. Создание каналов

26. Редактор сообщения

27. Просмотр файлов



### Экраны (41)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_01_17` | О Balloo | `balloo-su/about-balloo.html` | Принят | `balloo-su/about-balloo.md` |

| `1_01_16` | О компании | `balloo-su/about-company.html` | Принят | `balloo-su/about-company.md` |

| `1_01_22` | Мультиаккаунт | `balloo-su/accounts.html` | Просмотрен | `balloo-su/accounts.md` |

| `1_01_11` | Активный звонок | `balloo-su/active-call.html` | Принят | `balloo-su/active-call.md` |

| `1_01_23` | Добавить устройство | `balloo-su/add-device.html` | Просмотрен | `balloo-su/add-device.md` |

| `1_01_07` | Архив чатов | `balloo-su/archive.html` | Просмотрен | `balloo-su/archive.md` |

| `1_01_40` | Панель вложений | `balloo-su/attachment-panel.html` | Просмотрен | `balloo-su/attachment-panel.md` |

| `1_01_38` | Блокированные пользователи | `balloo-su/blocked-users.html` | Просмотрен | `balloo-su/blocked-users.md` |

| `1_01_15` | Боты | `balloo-su/bots.html` | Просмотрен | `balloo-su/bots.md` |

| `1_01_10` | Звонки | `balloo-su/calls.html` | Просмотрен | `balloo-su/calls.md` |

| `1_01_35` | Создание канала | `balloo-su/channel-create.html` | Просмотрен | `balloo-su/channel-create.md` |

| `1_01_25` | Вложения чата | `balloo-su/chat-attachments.html` | Принят | `balloo-su/chat-attachments.md` |

| `1_01_04` | Список чатов | `balloo-su/chats.html` | Просмотрен | `balloo-su/chats.md` |

| `1_01_05` | Контакты | `balloo-su/contacts.html` | Просмотрен | `balloo-su/contacts.md` |

| `1_01_24` | Донат | `balloo-su/donate.html` | Принят | `balloo-su/donate.md` |

| `1_01_36` | Пустой чат | `balloo-su/empty-chat.html` | Просмотрен | `balloo-su/empty-chat.md` |

| `1_01_33` | Просмотр файла/изображения | `balloo-su/file-viewer.html` | Просмотрен | `balloo-su/file-viewer.md` |

| `1_01_18` | Создание группы | `balloo-su/group-create.html` | Просмотрен | `balloo-su/group-create.md` |

| `1_01_19` | Настройки группы | `balloo-su/group-settings.html` | Просмотрен | `balloo-su/group-settings.md` |

| `1_01_13` | Приглашения | `balloo-su/invites.html` | Принят | `balloo-su/invites.md` |

| `1_01_02` | Вход | `balloo-su/login.html` | Просмотрен | `balloo-su/login.md` |

| `1_01_32` | Редактор сообщения | `balloo-su/message-editor.html` | Просмотрен | `balloo-su/message-editor.md` |

| `1_01_21` | Мои устройства | `balloo-su/my-devices.html` | Просмотрен | `balloo-su/my-devices.md` |

| `1_01_31` | Мои донаты | `balloo-su/my-donates.html` | Просмотрен | `balloo-su/my-donates.md` |

| `1_01_34` | Настройки уведомлений | `balloo-su/notification-settings.html` | Просмотрен | `balloo-su/notification-settings.md` |

| `1_01_01` | Онбординг | `balloo-su/onboarding.html` | Принят | `balloo-su/onboarding.md` |

| `1_01_29` | Восстановление пароля | `balloo-su/password-reset.html` | Просмотрен | `balloo-su/password-reset.md` |

| `1_01_28` | Редактор опроса | `balloo-su/poll-editor.html` | Принят | `balloo-su/poll-editor.md` |

| `1_01_37` | Настройки приватности | `balloo-su/privacy-settings.html` | Просмотрен | `balloo-su/privacy-settings.md` |

| `1_01_08` | Профиль | `balloo-su/profile.html` | Просмотрен | `balloo-su/profile.md` |

| `1_01_09` | Публичный профиль | `balloo-su/public-profile.html` | Просмотрен | `balloo-su/public-profile.md` |

| `1_01_03` | Регистрация | `balloo-su/register.html` | Просмотрен | `balloo-su/register.md` |

| `1_01_26` | Жалоба на сообщение | `balloo-su/report-message.html` | Принят | `balloo-su/report-message.md` |

| `1_01_12` | Правила платформы | `balloo-su/rules.html` | Принят | `balloo-su/rules.md` |

| `1_01_06` | Глобальный поиск | `balloo-su/search.html` | Просмотрен | `balloo-su/search.md` |

| `1_01_20` | Настройки приложения | `balloo-su/settings.html` | Просмотрен | `balloo-su/settings.md` |

| `1_01_27` | Сторис | `balloo-su/stories.html` | Просмотрен | `balloo-su/stories.md` |

| `1_01_41` | Создание историй | `balloo-su/story-create.html` | Просмотрен | `balloo-su/story-create.md` |

| `1_01_14` | Техподдержка | `balloo-su/support.html` | Принят | `balloo-su/support.md` |

| `1_01_30` | Двухфакторная аутентификация | `balloo-su/two-factor.html` | Просмотрен | `balloo-su/two-factor.md` |

| `1_01_39` | Запись голосового | `balloo-su/voice-message.html` | Просмотрен | `balloo-su/voice-message.md` |


---



## 3. 🛡️ admin.balloo.su — Админ-панель (`у_02`)


- **Просмотрено:** 25/25

- **Правок частных:** 1

- **Правок глобальных принятых:** 4

- **Компоненты:** 25 частных / 5 глобальных

- **Функций:** 21

- **Статус реализации:** задокументирован


### Функции приложения


1. Аутентификация админа

2. Дашборд админа

3. Управление сотрудниками

4. Управление бан-листом

5. Feature flags

6. Управление фичами

7. Аудит-лог

8. Управление группами

9. Донаты

10. Файлы

11. Управление отделами

12. Вакансии

13. Отчёты

14. Статус сервиса

15. Тексты

16. Категории блога

17. Каналы блога

18. Миграция блога

19. Очередь блога

20. Ревью блога

21. Статистика блога

22. Управление ботами



### Экраны (25)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_02_01` | Объявления | `admin-balloo-su/announcements.html` | Просмотрен | `admin-balloo-su/announcements.md` |

| `1_02_02` | Аудит-лог | `admin-balloo-su/audit-log.html` | Просмотрен | `admin-balloo-su/audit-log.md` |

| `1_02_03` | Бан-лист | `admin-balloo-su/bans.html` | Просмотрен | `admin-balloo-su/bans.md` |

| `1_02_05` | Каналы блога | `admin-balloo-su/blog-channels.html` | Просмотрен | `admin-balloo-su/blog-channels.md` |

| `1_02_06` | Миграция блога | `admin-balloo-su/blog-migrate.html` | Просмотрен | `admin-balloo-su/blog-migrate.md` |

| `1_02_07` | Очередь блога | `admin-balloo-su/blog-queue.html` | Просмотрен | `admin-balloo-su/blog-queue.md` |

| `1_02_08` | Ревью блога | `admin-balloo-su/blog-review.html` | Просмотрен | `admin-balloo-su/blog-review.md` |

| `1_02_09` | Статистика блога | `admin-balloo-su/blog-stats.html` | Просмотрен | `admin-balloo-su/blog-stats.md` |

| `1_02_10` | Управление ботами | `admin-balloo-su/bots-mgmt.html` | Просмотрен | `admin-balloo-su/bots-mgmt.md` |

| `1_03_02` | Дашборд | `command-balloo-su/dashboard.html` | Принят | `admin-balloo-su/dashboard.md` |

| `1_03_15` | Отделы | `command-balloo-su/departments.html` | Принят | `admin-balloo-su/departments.md` |

| `1_02_13` | Донаты | `admin-balloo-su/donations.html` | Просмотрен | `admin-balloo-su/donations.md` |

| `1_02_14` | Сотрудники | `admin-balloo-su/employees.html` | Просмотрен | `admin-balloo-su/employees.md` |

| `1_02_15` | Feature flags | `admin-balloo-su/features-flags.html` | Просмотрен | `admin-balloo-su/features-flags.md` |

| `1_02_16` | Управление фичами | `admin-balloo-su/features-mgmt.html` | Просмотрен | `admin-balloo-su/features-mgmt.md` |

| `1_02_17` | Файлы | `admin-balloo-su/files.html` | Просмотрен | `admin-balloo-su/files.md` |

| `1_02_18` | Управление группами | `admin-balloo-su/groups-mgmt.html` | Просмотрен | `admin-balloo-su/groups-mgmt.md` |

| `1_01_02` | Вход | `balloo-su/login.html` | Просмотрен | `admin-balloo-su/login.md` |

| `1_02_20` | Метрики | `admin-balloo-su/metrics.html` | Просмотрен | `admin-balloo-su/metrics.md` |

| `1_02_21` | Отчёты | `admin-balloo-su/reports.html` | Просмотрен | `admin-balloo-su/reports.md` |

| `1_02_22` | Статус сервиса | `admin-balloo-su/service-status.html` | Просмотрен | `admin-balloo-su/service-status.md` |

| `1_02_23` | Тексты | `admin-balloo-su/texts.html` | Просмотрен | `admin-balloo-su/texts.md` |

| `1_02_24` | Пользователи | `admin-balloo-su/users.html` | Просмотрен | `admin-balloo-su/users.md` |

| `1_03_07` | Вакансии | `command-balloo-su/vacancies.html` | Принят | `admin-balloo-su/vacancies.md` |

| `1_02_26` | Версии | `admin-balloo-su/versions.html` | Просмотрен | `admin-balloo-su/versions.md` |


---



## 4. 🏢 command.balloo.su — Портал сотрудников (`у_03`)


- **Просмотрено:** 26/26

- **Правок частных:** 0

- **Правок глобальных принятых:** 4

- **Компоненты:** 26 частных / 5 глобальных

- **Функций:** 22

- **Статус реализации:** задокументирован


### Функции приложения


1. Аутентификация сотрудников

2. Дашборд сотрудника

3. HR-модуль

4. База знаний

5. Найм

6. Мониторинг продукта

7. Вакансии

8. Анкеты кандидатов

9. Почему мы

10. Внутренний чат

11. Встречи

12. Мои задачи

13. Мой отдел

14. Отделы

15. Управление отделами

16. Мои публикации

17. Редактор блога

18. Мой канал

19. Настройки канала

20. Профиль сотрудника

21. Календарь

22. Интервью

23. Дашборд руководителя

24. Отпуска



### Экраны (26)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_03_09` | Анкета кандидата | `command-balloo-su/application-form.html` | Принят | `command-balloo-su/application-form.md` |

| `1_03_20` | Настройки канала | `command-balloo-su/blog-channel-settings.html` | Принят | `command-balloo-su/blog-channel-settings.md` |

| `1_03_18` | Редактор блога | `command-balloo-su/blog-editor.html` | Принят | `command-balloo-su/blog-editor.md` |

| `1_03_19` | Мой канал | `command-balloo-su/blog-my-channel.html` | Принят | `command-balloo-su/blog-my-channel.md` |

| `1_03_17` | Мои публикации | `command-balloo-su/blog-my-posts.html` | Принят | `command-balloo-su/blog-my-posts.md` |

| `1_03_22` | Календарь | `command-balloo-su/calendar.html` | Принят | `command-balloo-su/calendar.md` |

| `1_03_24` | Карточка кандидата (интервью) | `command-balloo-su/candidate-interview.html` | Просмотрен | `command-balloo-su/candidate-interview.md` |

| `1_03_23` | Карточка кандидата | `command-balloo-su/candidate.html` | Принят | `command-balloo-su/candidate.md` |

| `1_03_02` | Дашборд | `command-balloo-su/dashboard.html` | Принят | `command-balloo-su/dashboard.md` |

| `1_03_16` | Управление отделами | `command-balloo-su/department-management.html` | Принят | `command-balloo-su/department-management.md` |

| `1_03_15` | Отделы | `command-balloo-su/departments.html` | Принят | `command-balloo-su/departments.md` |

| `1_03_21` | Профиль сотрудника | `command-balloo-su/employee-profile.html` | Принят | `command-balloo-su/employee-profile.md` |

| `1_03_05` | Найм | `command-balloo-su/hiring.html` | Принят | `command-balloo-su/hiring.md` |

| `1_03_03` | HR-модуль | `command-balloo-su/hr.html` | Принят | `command-balloo-su/hr.md` |

| `1_03_11` | Внутренний чат | `command-balloo-su/internal-chat.html` | Принят | `command-balloo-su/internal-chat.md` |

| `1_03_04` | База знаний | `command-balloo-su/knowledge-base.html` | Принят | `command-balloo-su/knowledge-base.md` |

| `1_03_01` | Вход | `command-balloo-su/login.html` | Принят | `command-balloo-su/login.md` |

| `1_03_25` | Дашборд руководителя | `command-balloo-su/manager-dashboard.html` | Просмотрен | `command-balloo-su/manager-dashboard.md` |

| `1_03_12` | Встречи | `command-balloo-su/meetings.html` | Принят | `command-balloo-su/meetings.md` |

| `1_03_06` | Мониторинг продукта | `command-balloo-su/monitoring.html` | Принят | `command-balloo-su/monitoring.md` |

| `1_03_14` | Мой отдел | `command-balloo-su/my-department.html` | Принят | `command-balloo-su/my-department.md` |

| `1_03_26` | Отпуска и отсутствие | `command-balloo-su/time-off.html` | Просмотрен | `command-balloo-su/time-off.md` |

| `1_03_13` | Мои задачи | `command-balloo-su/todo.html` | Реализован | `command-balloo-su/todo.md` | `packages/web/src/screens/command/TasksScreen.tsx` |

| `1_03_07` | Вакансии | `command-balloo-su/vacancies.html` | Принят | `command-balloo-su/vacancies.md` |

| `1_03_08` | Детали вакансии | `command-balloo-su/vacancy-detail.html` | Принят | `command-balloo-su/vacancy-detail.md` |

| `1_03_10` | Почему мы | `command-balloo-su/why-us.html` | Принят | `command-balloo-su/why-us.md` |


---



## 5. 💡 features.balloo.su — Фич-реквесты (`у_04`)


- **Просмотрено:** 6/6

- **Правок частных:** 0

- **Правок глобальных принятых:** 4

- **Компоненты:** 6 частных / 5 глобальных

- **Функций:** 5

- **Статус реализации:** задокументирован


### Функции приложения


1. Аутентификация

2. Список фич-реквестов

3. Создание фич-реквеста

4. Детали фич-реквеста

5. Донат



### Экраны (6)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_01_24` | Донат | `balloo-su/donate.html` | Принят | `features-balloo-su/donate.md` |

| `1_04_02` | Детали фич-реквеста | `features-balloo-su/feature-detail.html` | Просмотрен | `features-balloo-su/feature-detail.md` |

| `1_04_03` | Список фич-реквестов | `features-balloo-su/list.html` | Принят | `features-balloo-su/list.md` |

| `1_01_02` | Вход | `balloo-su/login.html` | Просмотрен | `features-balloo-su/login.md` |

| `1_04_05` | Отправить фич-реквест | `features-balloo-su/submit.html` | Принят | `features-balloo-su/submit.md` |

| `1_04_04` | Голосование по фичам | `features-balloo-su/vote.html` | Просмотрен | `features-balloo-su/vote.md` |


---



## 6. 📜 history.balloo.su — История версий (`у_05`)


- **Просмотрено:** 3/3

- **Правок частных:** 0

- **Правок глобальных принятых:** 3

- **Компоненты:** 3 частных / 5 глобальных

- **Функций:** 4

- **Статус реализации:** задокументирован


### Функции приложения


1. Список версий

2. Детали версии

3. Донат



### Экраны (3)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_01_24` | Донат | `balloo-su/donate.html` | Принят | `history-balloo-su/donate.md` |

| `1_05_02` | Детали версии | `history-balloo-su/version-detail.html` | Просмотрен | `history-balloo-su/version-detail.md` |

| `1_05_03` | Список версий | `history-balloo-su/version-list.html` | Принят | `history-balloo-su/version-list.md` |


---



## 7. ⬇️ download.balloo.su — Загрузки (`у_06`)


- **Просмотрено:** 2/2

- **Правок частных:** 0

- **Правок глобальных принятых:** 2

- **Компоненты:** 2 частных / 5 глобальных

- **Функций:** 2

- **Статус реализации:** задокументирован


### Функции приложения


1. Загрузки

2. Донат



### Экраны (2)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_01_24` | Донат | `balloo-su/donate.html` | Принят | `download-balloo-su/donate.md` |

| `1_06_02` | Загрузки | `download-balloo-su/downloads.html` | Просмотрен | `download-balloo-su/downloads.md` |


---



## 8. 📚 docs.balloo.su — API документация (`у_07`)


- **Просмотрено:** 1/1

- **Правок частных:** 0

- **Правок глобальных принятых:** 0

- **Компоненты:** 1 частных / 5 глобальных

- **Функций:** 1

- **Статус реализации:** задокументирован


### Функции приложения


1. Документация API



### Экраны (1)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_07_01` | Документация API | `docs-balloo-su/api-docs.html` | Просмотрен | `docs-balloo-su/api-docs.md` |


---



## 9. 📱 mobile (сборные) — Мобильные макеты (`у_08`)


- **Просмотрено:** 23/23

- **Правок частных:** 8

- **Правок глобальных принятых:** 5

- **Компоненты:** 23 частных / 5 глобальных

- **Функций:** 13

- **Статус реализации:** задокументирован


### Функции приложения


1. Мобильный чат

2. История звонков

3. Мобильные настройки

4. Устройства

5. QR-привязка

6. Донат

7. Вложения чата

8. Жалобы

9. Вход/Регистрация

10. Сторис

11. Архив

12. Контакты

13. Профиль



### Экраны (23)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_08_06` | Добавить устройство | `mobile/add-device.html` | Принят | `mobile/add-device.md` |

| `1_08_16` | Архив чатов | `mobile/archive.html` | Принят | `mobile/archive.md` |

| `1_08_03` | История звонков | `mobile/calls-history.html` | Принят | `mobile/calls-history.md` |

| `1_08_08` | Вложения чата | `mobile/chat-attachments.html` | Принят | `mobile/chat-attachments.md` |

| `1_08_02` | Чат | `mobile/chat.html` | Принят | `mobile/chat.md` |

| `1_08_17` | Контакты | `mobile/contacts.html` | Принят | `mobile/contacts.md` |

| `1_08_07` | Донат | `mobile/donate.html` | Принят | `mobile/donate.md` |

| `1_08_21` | Пустой чат | `mobile/empty-chat.html` | Просмотрен | `mobile/empty-chat.md` |

| `1_08_19` | Создание группы | `mobile/group-create.html` | Принят | `mobile/group-create.md` |

| `1_08_10` | Вход | `mobile/login.html` | Принят | `mobile/login.md` |

| `1_08_22` | Полноэкранный просмотрщик медиа | `mobile/media-viewer.html` | Просмотрен | `mobile/media-viewer.md` |

| `1_08_05` | Мои устройства | `mobile/my-devices.html` | Принят | `mobile/my-devices.md` |

| `1_08_14` | Мои донаты | `mobile/my-donates.html` | Принят | `mobile/my-donates.md` |

| `1_08_01` | Обзор / Приветствие | `mobile/overview.html` | Принят | `mobile/overview.md` |

| `1_08_12` | Восстановление пароля | `mobile/password-reset.html` | Принят | `mobile/password-reset.md` |

| `1_08_20` | Редактор опроса | `mobile/poll-editor.html` | Принят | `mobile/poll-editor.md` |

| `1_08_18` | Профиль | `mobile/profile.html` | Принят | `mobile/profile.md` |

| `1_08_11` | Регистрация | `mobile/register.html` | Принят | `mobile/register.md` |

| `1_08_09` | Жалоба на сообщение | `mobile/report-message.html` | Принят | `mobile/report-message.md` |

| `1_08_04` | Настройки приложения | `mobile/settings.html` | Принят | `mobile/settings.md` |

| `1_08_15` | Сторис | `mobile/stories.html` | Принят | `mobile/stories.md` |

| `1_08_13` | Двухфакторная аутентификация | `mobile/two-factor.html` | Принят | `mobile/two-factor.md` |

| `1_08_23` | Запись голосового (mobile) | `mobile/voice-record.html` | Просмотрен | `mobile/voice-record.md` |


---



## 10. 🖥️ desktop (генеральный) — ПК обёртки (`у_09`)


- **Просмотрено:** 23/23

- **Правок частных:** 2

- **Правок глобальных принятых:** 3

- **Компоненты:** 23 частных / 5 глобальных

- **Функций:** 16

- **Статус реализации:** задокументирован


### Функции приложения


1. Окно приложения

2. Режимы окна

3. Системная интеграция

4. Многоканальность

5. Мои устройства

6. Донат

7. Вложения чата

8. Жалобы

9. Вход/Регистрация

10. Сторис

11. Архив

12. Контакты

13. Профиль

14. Настройки

15. Настройки уведомлений

16. Просмотр медиа



### Экраны (23)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_09_04` | Добавить устройство | `desktop/add-device.html` | Принят | `desktop/add-device.md` |

| `1_09_14` | Архив чатов | `desktop/archive.html` | Принят | `desktop/archive.md` |

| `1_09_13` | История звонков | `desktop/calls-history.html` | Принят | `desktop/calls-history.md` |

| `1_09_06` | Вложения чата | `desktop/chat-attachments.html` | Принят | `desktop/chat-attachments.md` |

| `1_09_11` | Чат | `desktop/chat.html` | Принят | `desktop/chat.md` |

| `1_09_15` | Контакты | `desktop/contacts.html` | Принят | `desktop/contacts.md` |

| `1_09_05` | Донат | `desktop/donate.html` | Принят | `desktop/donate.md` |

| `1_09_16` | Создание группы | `desktop/group-create.html` | Принят | `desktop/group-create.md` |

| `1_01_02` | Вход | `balloo-su/login.html` | Просмотрен | `desktop/login.md` |

| `1_09_21` | Полноэкранный просмотрщик медиа | `desktop/media-viewer.html` | Просмотрен | `desktop/media-viewer.md` |

| `1_09_02` | Modes | `desktop/modes.html` | Принят | `desktop/modes.md` |

| `1_09_03` | Мои устройства | `desktop/my-devices.html` | Принят | `desktop/my-devices.md` |

| `1_09_10` | Мои донаты | `desktop/my-donates.html` | Принят | `desktop/my-donates.md` |

| `1_09_20` | Настройки уведомлений | `desktop/notification-settings.html` | Просмотрен | `desktop/notification-settings.md` |

| `1_09_01` | Обзор / Приветствие | `desktop/overview.html` | Принят | `desktop/overview.md` |

| `1_09_08` | Восстановление пароля | `desktop/password-reset.html` | Просмотрен | `desktop/password-reset.md` |

| `1_09_17` | Редактор опроса | `desktop/poll-editor.html` | Принят | `desktop/poll-editor.md` |

| `1_09_19` | Профиль | `desktop/profile.html` | Принят | `desktop/profile.md` |

| `1_01_03` | Регистрация | `balloo-su/register.html` | Просмотрен | `desktop/register.md` |

| `1_09_07` | Жалоба на сообщение | `desktop/report-message.html` | Принят | `desktop/report-message.md` |

| `1_09_18` | Настройки приложения | `desktop/settings.html` | Принят | `desktop/settings.md` |

| `1_09_12` | Сторис | `desktop/stories.html` | Принят | `desktop/stories.md` |

| `1_09_09` | Двухфакторная аутентификация | `desktop/two-factor.html` | Просмотрен | `desktop/two-factor.md` |


---



## 11. 📐 specifity.balloo.su — Спецификация (`у_10`)


- **Просмотрено:** 7/7

- **Правок частных:** 0

- **Правок глобальных принятых:** 0

- **Компоненты:** 7 частных / 5 глобальных

- **Функций:** 7

- **Статус реализации:** задокументирован


### Функции приложения


1. Главная

2. Экраны

3. Эндпоинты

4. Данные

5. Компоненты

6. Правила

7. Спецификация



### Экраны (7)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_10_01` | Компоненты | `specifity-balloo-su/components.html` | Принят | `specifity-balloo-su/components.md` |

| `1_10_02` | Данные | `specifity-balloo-su/data.html` | Принят | `specifity-balloo-su/data.md` |

| `1_10_03` | Эндпоинты | `specifity-balloo-su/endpoints.html` | Принят | `specifity-balloo-su/endpoints.md` |

| `1_10_04` | Главная спецификации | `specifity-balloo-su/home.html` | Принят | `specifity-balloo-su/home.md` |

| `1_01_12` | Правила платформы | `balloo-su/rules.html` | Принят | `specifity-balloo-su/rules.md` |

| `1_10_06` | Экраны | `specifity-balloo-su/screens.html` | Принят | `specifity-balloo-su/screens.md` |

| `1_10_07` | Спецификация | `specifity-balloo-su/specification.html` | Принят | `specifity-balloo-su/specification.md` |


---



## 12. 📝 blog.balloo.su — Корпоративный блог (`у_11`)


- **Просмотрено:** 6/6

- **Правок частных:** 0

- **Правок глобальных принятых:** 1

- **Компоненты:** 6 частных / 5 глобальных

- **Функций:** 2

- **Статус реализации:** задокументирован


### Функции приложения


1. Лента блога

2. Поиск



### Экраны (6)


| ID | Экран | Файл | Статус | Документация |
|---|---|---|---|---|

| `1_11_01` | Категория блога | `blog-balloo-su/category.html` | Просмотрен | `blog-balloo-su/category.md` |

| `1_11_02` | Канал блога | `blog-balloo-su/channel.html` | Принят | `blog-balloo-su/channel.md` |

| `1_11_03` | Лента блога | `blog-balloo-su/feed.html` | Принят | `blog-balloo-su/feed.md` |

| `1_11_04` | Персональная лента | `blog-balloo-su/personal-feed.html` | Принят | `blog-balloo-su/personal-feed.md` |

| `1_11_05` | Пост блога | `blog-balloo-su/post.html` | Принят | `blog-balloo-su/post.md` |

| `1_01_06` | Глобальный поиск | `balloo-su/search.html` | Просмотрен | `blog-balloo-su/search.md` |


---



## Порядок работы с макетами


1. **Макеты** (`mockups/`) — единственный источник правды

1. **MD рядом с макетом** — задание на создание страницы

1. **index.html** — интерактивный каталог

1. **index_ecrans.json** — структурированные метаданные

1. **index_ecrans.md** — человекочитаемая документация

1. **docs/** — глобальная документация под капотом



## Структура файлов


```
balloo/mockups/

├── index.html

├── index_ecrans.json

├── index_ecrans.md

├── api_schema.json

├── api_schema.md

├── data_schema.json

├── pre_filled_data.json

├── assets/

├── shared/

├── balloo-su/

├── admin-balloo-su/

├── command-balloo-su/

├── features-balloo-su/

├── history-balloo-su/

├── download-balloo-su/

├── docs-balloo-su/

├── mobile/

├── desktop/

├── specifity-balloo-su/

├── blog-balloo-su/

```



## 📐 Нумерация объектов `z_xx_yy` (сводка)


| ID узла | Узел | Экранов | Функций | Эндпоинтов | Сущностей данных |
|---|---|---|---|---|---|

| `у_00` | shared | 8 | 0 | — | — |

| `у_01` | balloo.su | 41 | 27 | — | — |

| `у_02` | admin.balloo.su | 25 | 21 | — | — |

| `у_03` | command.balloo.su | 26 | 22 | — | — |

| `у_04` | features.balloo.su | 6 | 5 | — | — |

| `у_05` | history.balloo.su | 3 | 4 | — | — |

| `у_06` | download.balloo.su | 2 | 2 | — | — |

| `у_07` | docs.balloo.su | 1 | 1 | — | — |

| `у_08` | mobile (сборные) | 23 | 13 | — | — |

| `у_09` | desktop (генеральный) | 23 | 16 | — | — |

| `у_10` | specifity.balloo.su | 7 | 7 | — | — |

| `у_11` | blog.balloo.su | 6 | 2 | — | — |


---

_Сгенерировано автоматически из файловой системы `mockups/`. Дата: 2026-07-30_