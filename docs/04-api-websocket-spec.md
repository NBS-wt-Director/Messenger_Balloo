# AI-Agent: API & WebSocket Specification

> Этот документ — спецификация для генерации API Routes (Next.js) и WebSocket-событий (Native Node.js WebSocket).

## Версионирование
- Версия в URL: `/api/v1/...`
- Обратная совместимость на соседние версии и через одну.
- **Единое API для всех узлов** — все узлы экосистемы (balloo.su, admin.balloo.su, command.balloo.su, features.balloo.su, history.balloo.su, download.balloo.su, docs.balloo.su, blog.balloo.su) используют одно и то же API. Различия только в правах доступа (RBAC) и контексте узла.

## Документация
- Swagger/OpenAPI 3.0 — автогенерация из аннотаций Next.js API Routes.
- Отдельный сервис `docApi` доступен по адресу `balloo.su/api/docs`.

---

## REST API (Next.js API Routes)

### Auth (`/api/v1/auth`)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/auth/register` | Регистрация по email + собственная капча |
| POST | `/auth/verify-email` | Подтверждение email по 6-значному коду |
| POST | `/auth/resend-code` | Повторная отправка кода (не чаще 1 раза в 60 сек) |
| GET | `/auth/captcha` | Получение изображения капчи (серверная генерация) |
| POST | `/auth/captcha/verify` | Проверка кода капчи |
| POST | `/auth/avatar/auto` | Генерация автоаватара (из имени, случайный градиент) |
| POST | `/auth/avatar/upload` | Загрузка своей аватарки (PNG/JPEG/SVG) |
| POST | `/auth/login` | Вход по email |
| POST | `/auth/oauth/yandex` | OAuth вход через Яндекс |
| POST | `/auth/oauth/mailru` | OAuth вход через Mail.ru |
| POST | `/auth/oauth/rambler` | OAuth вход через Rambler |
| POST | `/auth/logout` | Выход |
| POST | `/auth/refresh` | Обновление JWT (refresh token) |
| GET | `/auth/session` | Текущая сессия + список устройств |
| DELETE | `/auth/session/:deviceId` | Удалить сессию устройства |
| POST | `/auth/yandex-disk/link` | Привязка Yandex Disk (OAuth) |
| DELETE | `/auth/yandex-disk/unlink` | Отвязка Yandex Disk |
| POST | `/auth/password-reset/request` | Запрос сброса пароля (email → token) |
| POST | `/auth/password-reset/confirm` | Подтверждение сброса (token + new password) |
| POST | `/auth/email-verify/send` | Повторная отправка письма подтверждения email |
| GET | `/auth/email-verify/:token` | Подтверждение email по токену из письма |
| POST | `/auth/2fa/send-code` | Отправить email-код 2FA на почту пользователя |
| POST | `/auth/2fa/verify` | Подтвердить 2FA email-кодом |

### Devices (`/api/v1/devices`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/devices` | Список устройств с активными сессиями |
| GET | `/devices/:id` | Детали устройства + сессии |
| PATCH | `/devices/:id` | Переименовать устройство |
| DELETE | `/devices/:id` | Удалить устройство (завершить все сессии) |
| DELETE | `/sessions/:id` | Остановить конкретную сессию |
| DELETE | `/sessions` | Завершить все другие сессии (кроме текущей) |
| GET | `/sessions/:id` | Детали сессии (token, IP, WS, push) |
| POST | `/devices/pair-token` | Генерация QR-токена привязки (TTL 60 сек) |
| POST | `/devices/pair/confirm` | Подтверждение привязки (оба устройства) |
| GET | `/devices/pair/:token/status` | Статус привязки (pending/confirmed/expired) |

### Accounts (`/api/v1/accounts`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/accounts` | Список подключённых аккаунтов на устройстве |
| POST | `/accounts/switch` | Переключение активного аккаунта |
| POST | `/accounts/add` | Добавление аккаунта (login flow, новый JWT) |
| DELETE | `/accounts/:id` | Отключение аккаунта (сессия удаляется, данные остаются) |
| PATCH | `/accounts/:id/notifications` | Вкл/выкл уведомлений для аккаунта |
| GET | `/accounts/:id/stats` | Статистика аккаунта (чаты, контакты, непрочитанные) |

### Users (`/api/v1/users`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/users/me` | Текущий профиль |
| PATCH | `/users/me` | Обновить профиль (имя, био, статус, аватар, язык, тема) |
| DELETE | `/users/me` | Удаление аккаунта (анонимизация через 90 дней) |
| GET | `/users/:id` | Публичный профиль по ссылке |
| GET | `/users/contacts` | Список контактов |
| POST | `/users/contacts/:id` | Добавить в контакты |
| DELETE | `/users/contacts/:id` | Удалить из контактов |
| GET | `/users/blocked` | Список заблокированных |
| POST | `/users/block/:id` | Заблокировать |
| DELETE | `/users/block/:id` | Разблокировать |
| GET | `/users/devices` | Список устройств |
| DELETE | `/users/devices/:id` | Удалить сессию устройства |

### Chats (`/api/v1/chats`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/chats` | Список чатов (пагинация, infinite scroll) |
| POST | `/chats/direct` | Создать чат 1:1 |
| POST | `/chats/:id/messages` | Отправить сообщение |
| GET | `/chats/:id/messages` | История сообщений (пагинация по 100) |
| PATCH | `/chats/:id/messages/:msgId` | Редактировать (до 5 мин, непрочитанное <1ч) |
| DELETE | `/chats/:id/messages/:msgId` | Удалить (на выбор пользователя: для всех или для меня) |
| POST | `/chats/:id/messages/:msgId/reply` | Ответить на сообщение |
| POST | `/chats/:id/forward` | Переслать (пачкой/поодному) |
| POST | `/chats/:id/messages/:msgId/reactions` | Поставить реакцию |
| DELETE | `/chats/:id/messages/:msgId/reactions/:emoji` | Убрать реакцию |
| GET | `/chats/:id/messages/:msgId/history` | История изменений (полный дифф) |
| POST | `/chats/:id/pin/:msgId` | Закрепить сообщение |
| DELETE | `/chats/:id/pin/:msgId` | Открепить |
| GET | `/chats/:id/pinned` | Список закреплённых |
| PATCH | `/chats/:id/mute` | Mute чата (8ч/1д/1н/вечно) |
| PATCH | `/chats/:id/archive` | Архивировать чат |
| GET | `/chats/:id/search` | Поиск по чату (только текст — v2: фото, файлы, ссылки) |
| POST | `/chats/:id/draft` | Сохранить черновик |
| GET | `/chats/:id/draft` | Получить черновик |
| POST | `/chats/:id/export` | Экспорт чата в PDF |
| POST | `/chats/:id/report` | Пожаловаться на сообщение |

### Attachments (`/api/v1/attachments`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/attachments?chatId={chatId}&type={type}&page={page}&q={query}` | Список вложений чата с пагинацией и поиском |
| POST | `/attachments/upload` | Загрузка файла (до 50 МБ) |
| GET | `/attachments/:id` | Скачать файл |
| GET | `/attachments/:id/preview` | Превью (для PDF, DOCX, фото) |
| POST | `/attachments/yandex-disk` | Загрузка файла на Yandex Disk пользователя |

### Groups (`/api/v1/groups`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/groups` | Список групп пользователя |
| POST | `/groups` | Создать группу (private/public/topic/corporate) |
| POST | `/groups/media` | Создать СМИ-группу (требует подтверждения документами) |
| GET | `/groups/:id` | Информация о группе |
| PATCH | `/groups/:id` | Редактировать группу |
| DELETE | `/groups/:id` | Удалить (только пустую) |
| POST | `/groups/:id/join` | Вступить в группу |
| POST | `/groups/:id/leave` | Покинуть группу |
| GET | `/groups/:id/members` | Список участников |
| POST | `/groups/:id/invite` | Пригласить по ссылке |
| POST | `/groups/:id/roles/:userId` | Назначить роль |
| DELETE | `/groups/:id/messages/:msgId` | Удалить сообщение (админ/автор) |
| PATCH | `/groups/:id/messages/:msgId/hide` | Скрыть сообщение (админ) |
| POST | `/groups/:id/polls` | Создать опрос/квиз/список/персонали |
| GET | `/groups/:id/export` | Экспорт участников/истории (только админ, PDF) |

### Polls (`/api/v1/polls`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/polls/:id` | Получить опрос |
| POST | `/polls/:id/vote` | Проголосовать |
| GET | `/polls/:id/results` | Результаты |
| POST | `/polls/:id/forward` | Переслать опрос в другой чат |

### Calls (`/api/v1/calls`)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/calls/start` | Начать звонок (audio/video, 1:1/group до 30) |
| POST | `/calls/:id/join` | Присоединиться |
| POST | `/calls/:id/leave` | Покинуть |
| POST | `/calls/:id/mute` | Mute/Unmute |
| POST | `/calls/:id/video` | Camera On/Off |
| POST | `/calls/:id/screen-share` | Демонстрация экрана (только один одновременно) |
| POST | `/calls/:id/transfer` | Перенаправить звонок |
| POST | `/calls/:id/admin/:userId` | Назначить админа звонка |
| GET | `/calls/history` | История звонков (отдельная вкладка) |

### Invites (`/api/v1/invites`)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/invites` | Создать приглашение (email, groupIds[], durationType: "permanent"\|"timed"\|"once", durationDays?: int) |
| GET | `/invites/mine` | "Мои приглашения" (список) |
| DELETE | `/invites/:id` | Отменить приглашение |
| POST | `/invites/:token/accept` | Принять приглашение |

### Stories (`/api/v1/stories`)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/stories` | Создать сторис (через Yandex Disk) |
| GET | `/stories` | Лента сторис |
| GET | `/stories/:id/views` | Кто посмотрел (список + количество) |
| DELETE | `/stories/:id` | Удалить свой сторис досрочно (🔑 JWT) |
| POST | `/stories/:id/reply` | Ответ на сторис → пересылка в чат (`replyToChatId`) (🔑 JWT) |

### Support (`/api/v1/support`)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/support/chat` | Отправить сообщение в поддержку |
| GET | `/support/chat` | Получить переписку с поддержкой |

### Onboarding (`/api/v1/onboarding`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/onboarding/steps?lang=ru` | Активные шаги онбординга на языке пользователя (публичный, кэшируется в Redis) |
| PATCH | `/users/me/onboarding` | Отметка о прохождении онбординга |

### Text Content (`/api/v1/texts`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/texts/pages/:slug?lang=ru` | Контент информационной страницы (rules, privacy, about-company, about-balloo) — публичный |

> **Правила и политика неразглашения:** контент загружается из Markdown-файлов в корне монорепо (`RULES.md`, `PRIVACY.md`). Сервер читает файлы и отдаёт отрендеренный контент. Единый источник для всех платформ (web, mobile, desktop).

---

## WebSocket Events (Native Node.js WebSocket)

### Подключение
```
ws://balloo.su/ws?token=<JWT>
```

### Client → Server

| Event | Payload | Описание |
|-------|---------|----------|
| `message:send` | `{chatId, text, attachments[], replyToId?}` | Отправка сообщения |
| `message:edit` | `{chatId, messageId, newText}` | Редактирование |
| `message:delete` | `{chatId, messageId}` | Удаление |
| `message:read` | `{chatId, messageIds[]}` | Отметить прочитанным |
| `message:typing` | `{chatId, isTyping}` | Индикатор набора |
| `reaction:add` | `{chatId, messageId, emoji}` | Реакция |
| `reaction:remove` | `{chatId, messageId, emoji}` | Убрать реакцию |
| `call:offer` | `{callId, targetUserId, sdp}` | WebRTC offer |
| `call:answer` | `{callId, sdp}` | WebRTC answer |
| `call:ice` | `{callId, candidate}` | ICE candidate |
| `call:mute` | `{callId, isMuted}` | Mute микрофона |
| `call:video` | `{callId, isVideoOn}` | Camera toggle |
| `call:screen` | `{callId, isSharing}` | Screen share toggle |
| `presence:update` | `{status}` | Онлайн/офлайн/занят/днд |
| `poll:vote` | `{pollId, optionIds[]}` | Голосование |
| `device:pair:request` | `{token}` | Запрос привязки устройства (QR-сканирование) |
| `device:pair:confirm` | `{token, deviceId}` | Подтверждение привязки на обоих устройствах |
| `account:switch` | `{accountId}` | Переключение активного аккаунта (сервер переключает WS-контекст) |

### Server → Client

| Event | Payload | Описание |
|-------|---------|----------|
| `message:new` | `{chatId, message}` | Новое сообщение |
| `message:edited` | `{chatId, messageId, newText, editedAt}` | Редактирование |
| `message:deleted` | `{chatId, messageId}` | Удаление |
| `message:read` | `{chatId, messageIds[], userId}` | Прочитано |
| `message:typing` | `{chatId, userId, isTyping}` | Печатает |
| `reaction:updated` | `{chatId, messageId, reactions[]}` | Реакция обновлена |
| `call:incoming` | `{callId, from, type}` | Входящий звонок |
| `call:offer` | `{callId, sdp}` | WebRTC offer |
| `call:answer` | `{callId, sdp}` | WebRTC answer |
| `call:ice` | `{callId, candidate}` | ICE candidate |
| `call:ended` | `{callId, reason}` | Звонок завершён |
| `call:participant:joined` | `{callId, userId}` | Участник присоединился |
| `call:participant:left` | `{callId, userId}` | Участник вышел |
| `presence:update` | `{userId, status, lastSeen}` | Статус пользователя |
| `notification` | `{type, title, body, data}` | Push-уведомление |
| `poll:updated` | `{pollId, results}` | Результаты опроса |
| `device:paired` | `{deviceId, deviceName, deviceType}` | Новое устройство привязано |
| `device:session:ended` | `{deviceId, sessionId}` | Сессия устройства завершена |
| `device:renamed` | `{deviceId, newName}` | Устройство переименовано |
| `report:created` | `{reportId, messageId, reason}` | Создана новая жалоба (админам) |
| `report:status_changed` | `{reportId, status}` | Изменение статуса жалобы |
| `ban:status` | `{banId, isBanned, reason, type, expiresAt?}` | Статус бана пользователя (снят/подтверждён) |
| `ban:appeal:started` | `{banId, deadline}` | Отсчёт обжалования инициализирован → открыть оверлей |
| `ban:appeal:confirmation` | `{banId, confirmations, total}` | Получено подтверждение от администратора (0/4 → 1/4 ...) |
| `ban:appeal:resolved` | `{banId, decision: "approved"\|"rejected"}` | Решение принято → закрыть оверлей |
| `ban:appeal:expired` | `{banId}` | Срок обжалования истёк |
| `attachment:updated` | `{chatId, attachment}` | Обновление вложения (новый файл, удаление) |
| `account:added` | `{accountId, accountName}` | Новый аккаунт подключён к устройству |
| `account:removed` | `{accountId}` | Аккаунт отключён от устройства |
| `account:notification` | `{accountId, accountName, type, title, body, data}` | Уведомление с меткой аккаунта (для всех аккаунтов одновременно) |
| `story.created` | `{storyId, userId, type, expiresAt}` | Новый сторис от контакта/подписки |
| `status.update` | `{nodeId, status, latencyMs}` | Изменение статуса узла сервиса (real-time дашборд) |
| `2fa.required` | `{userId, methods: ["email"]}` | Требуется 2FA-код (email) для завершения действия |

---

## Features (`/api/v1/features`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/features` | Список фич (категории, голосование, статусы) |
| GET | `/features/:id` | Детали фичи (описание, голоса, комментарии) |
| POST | `/features` | Предложить новую фичу |
| POST | `/features/:id/vote` | Проголосовать за фичу (гостевой голос — анонимно) |
| POST | `/features/:id/comment` | Оставить комментарий к фиче |

---

## Reports (`/api/v1/reports`)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/reports` | Создать жалобу на сообщение (reason, comment, messageId, chatId) |
| GET | `/reports/:id` | Статус жалобы (для автора) |

---

## Bans & Appeals (`/api/v1/bans`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/bans/me` | Информация о текущем бане пользователя (причина, дата, тип, срок) — JWT |
| POST | `/bans/appeal` | Подача обжалования (body: `{ text: string }`, max 2000 символов) — JWT, только если есть активный бан и срок обжалования не истёк |
| GET | `/bans/appeal/status` | Статус текущего обжалования (confirmations 0/4, decision: pending/approved/rejected) — JWT |
| GET | `/bans/appeal/history` | История обжалований пользователя — JWT |

> Срок обжалования — 72 часа с момента бана. Решение требует подтверждения 4 администраторов. При отклонении повторное обжалование доступно через 30 дней.

---

## Donate (`/api/v1/donate`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/donate/goal` | Текущая цель сбора и прогресс |
| GET | `/donate/top-donors` | Топ доноров месяца |
| GET | `/donate/tiers` | Доступные уровни поддержки |
| POST | `/donate/create-payment` | Создание разового платежа (сумма, метод, source) |
| POST | `/donate/subscribe` | Создание ежемесячной подписки |
| GET | `/donate/history` | История пожертвований текущего пользователя |
| DELETE | `/donate/subscribe/:id` | Отмена подписки |

> Source-параметр в create-payment/subscribe: `balloo`, `download`, `history`, `features`, `mobile`, `desktop` — для статистики по платформам.

---

## Vacancies (`/api/v1/vacancies`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/vacancies` | Список публичных вакансий (фильтр по отделу) |
| GET | `/vacancies/:id` | Детали вакансии |
| GET | `/vacancies/stats` | Статистика (вакансий, отделов, сотрудников) |
| POST | `/applications` | Подача заявки (vacancy_id + данные кандидата) |
| GET | `/applications/me` | Мои заявки (для авторизованных) |

---

## Departments (`/api/v1/departments`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/departments` | Все отделы (публичные) |
| GET | `/departments/:id` | Информация об отделе |
| GET | `/departments/:id/members` | Участники отдела |
| GET | `/departments/me` | Мой отдел (для сотрудников) |
| GET | `/departments/:id/tasks` | Задачи отдела |
| GET | `/departments/:id/sprint` | Прогресс спринта |
| PUT | `/departments/:id/employees/:userId/permissions` | Изменение прав (только руководитель) |
| PUT | `/departments/:id` | Настройки отдела (только руководитель) |

---

## Meetings (`/api/v1/meetings`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/meetings` | Список встреч (upcoming/past) |
| GET | `/meetings/:id` | Детали встречи |
| POST | `/meetings` | Создание встречи |
| GET | `/meetings/:id/recording` | Запись встречи |
| GET | `/meetings/:id/protocol` | Протокол встречи |

---

## Tasks / TODO (`/api/v1/tasks`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/tasks?scope=personal` | Личные задачи |
| GET | `/tasks?scope=department` | Задачи отдела |
| POST | `/tasks` | Создание задачи |
| PATCH | `/tasks/:id` | Обновление статуса |
| GET | `/sprints/current` | Текущий спринт |

---

## Versions (`/api/v1/versions`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/versions` | Список версий (фильтр: released/planned) |
| GET | `/versions/:version` | Детали версии |
| GET | `/versions/:version/neighbors` | Соседние версии (prev/next) |

---

## Admin — управление узлами (`/api/v1/admin`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/employees` | Список сотрудников |
| POST | `/admin/employees/assign` | Назначение в отдел |
| PUT | `/admin/employees/:id/permissions` | Изменение прав |
| GET/POST/PUT/DELETE | `/admin/departments` | CRUD отделов |
| GET/POST/PUT/DELETE | `/admin/vacancies` | CRUD вакансий |
| GET | `/admin/applications` | Заявки кандидатов |
| PUT | `/admin/applications/:id/stage` | Изменение этапа |
| GET/POST/PUT/DELETE | `/admin/versions` | CRUD версий |
| GET | `/admin/features?status=pending` | Фичи на модерации |
| PUT | `/admin/features/:id/approve` | Одобрить фичу |
| PUT | `/admin/features/:id/reject` | Отклонить фичу |
| GET | `/admin/donations` | Список пожертвований |
| GET | `/admin/donations/stats` | Статистика донатов |
| PUT | `/admin/donations/goal` | Обновление цели |
| GET | `/admin/texts/onboarding` | Список шагов онбординга (все, включая неактивные) |
| POST | `/admin/texts/onboarding` | Создание шага |
| PATCH | `/admin/texts/onboarding/:id` | Обновление шага (заголовок, текст, порядок, активен) |
| DELETE | `/admin/texts/onboarding/:id` | Удаление шага |
| PATCH | `/admin/texts/onboarding/reorder` | Изменение порядка (массив ID) |
| POST | `/admin/texts/onboarding/:id/illustration` | Загрузка иллюстрации (multipart, PNG/SVG до 2 МБ) |
| DELETE | `/admin/texts/onboarding/:id/illustration` | Удаление иллюстрации |
| GET | `/admin/texts/onboarding/:id/translations` | Переводы шага |
| PUT | `/admin/texts/onboarding/:id/translations` | Обновление переводов |
| GET | `/admin/texts/pages/:slug` | Контент информационной страницы |
| PUT | `/admin/texts/pages/:slug` | Обновление контента страницы |

> Все admin-эндпоинты требуют прав администратора. RBAC проверяется на сервере.

---

## Blog — публичная часть (`/api/v1/blog`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/blog/posts` | Лента статей (`?page`, `?channel`, `?category`, `?tag`, `?type=corporate\|personal`) |
| GET | `/blog/posts/:slug` | Статья по слагу (SSR) |
| GET | `/blog/channels` | Список каналов (`?type=corporate\|personal`) |
| GET | `/blog/channels/:slug` | Канал + статьи (SSR) |
| GET | `/blog/categories` | Список категорий |
| GET | `/blog/categories/:slug` | Категория + статьи (SSR) |
| GET | `/blog/tags` | Список тегов |
| GET | `/blog/search?q=&channel=` | Поиск per-channel |
| POST | `/blog/posts/:id/reactions` | Поставить реакцию (эмодзи, 🔑 JWT) |
| DELETE | `/blog/posts/:id/reactions` | Снять реакцию (🔑 JWT) |
| GET | `/blog/posts/:id/comments` | Дерево комментариев |
| POST | `/blog/posts/:id/comments` | Добавить комментарий (🔑 JWT) |
| POST | `/blog/comments/:id/reply` | Ответ на комментарий (🔑 JWT) |
| DELETE | `/blog/comments/:id` | Удалить свой комментарий (🔑 JWT) |
| GET | `/blog/posts/:id/related` | Соседние/похожие статьи |
| POST | `/blog/channels/:id/subscribe` | Подписаться на канал (🔑 JWT) |
| DELETE | `/blog/channels/:id/subscribe` | Отписаться от канала (🔑 JWT) |
| GET | `/blog/me/subscriptions` | Лента «Мои подписки» (🔑 JWT) |

## Blog — авторство (`/api/v1/blog` — 🔑 JWT сотрудника)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/blog/my-posts` | Статьи сотрудника (все каналы, где автор) |
| POST | `/blog/posts` | Создать черновик (`channelId`) |
| PUT | `/blog/posts/:id` | Обновить черновик (`draft` / `changes_requested`) |
| POST | `/blog/posts/:id/submit` | Отправить на ревью |
| DELETE | `/blog/posts/:id` | Удалить черновик (только `draft`) |
| POST | `/blog/posts/:id/media` | Загрузить медиа |
| GET | `/blog/my-channel` | Данные личного канала + статьи |
| PUT | `/blog/my-channel` | Обновить настройки канала (название, описание, цвет, слаг, видимость) |
| POST | `/blog/my-channel/avatar` | Загрузить аватар канала |
| POST | `/blog/my-channel/banner` | Загрузить баннер канала |
| GET | `/blog/my-channel/comments` | Комментарии для модерации |
| DELETE | `/blog/my-channel/comments/:id` | Скрыть комментарий (владелец канала) |
| GET | `/blog/my-channel/stats` | Статистика личного канала |

## Blog — админ-управление (`/api/v1/admin/blog` — 🔑 JWT админа, 2FA email-код)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/blog/queue` | Очередь статей (`?status=`) |
| GET | `/admin/blog/posts/:id` | Полные данные статьи для ревью |
| POST | `/admin/blog/posts/:id/approve` | Одобрить → `published` |
| POST | `/admin/blog/posts/:id/reject` | Отклонить (с комментарием) |
| POST | `/admin/blog/posts/:id/request-changes` | Запросить правки (с комментарием) |
| GET | `/admin/blog/channels` | Список всех каналов |
| POST | `/admin/blog/channels` | Создать корпоративный канал |
| POST | `/admin/blog/channels/personal` | Выдать личный канал сотруднику |
| PUT | `/admin/blog/channels/:id` | Обновить канал (описание, видимость) |
| POST | `/admin/blog/channels/:id/authors` | Назначить автора |
| DELETE | `/admin/blog/channels/:id/authors/:userId` | Снять автора |
| POST | `/admin/blog/channels/:id/moderators` | Назначить модератора |
| DELETE | `/admin/blog/channels/:id/moderators/:userId` | Снять модератора |
| POST | `/admin/blog/channels/:id/migrate` | Миграция постов (`targetChannelId` или `action: archive`) |
| POST | `/admin/blog/channels/:id/transfer` | Передать личный канал (`newOwnerId`) |
| POST | `/admin/blog/categories` | Создать категорию |
| PUT | `/admin/blog/categories/:id` | Обновить категорию |
| DELETE | `/admin/blog/categories/:id` | Удалить категорию |
| POST | `/admin/blog/tags` | Создать тег |
| DELETE | `/admin/blog/tags/:id` | Удалить тег |
| GET | `/admin/blog/stats` | Общая статистика (`?period=`) |
| DELETE | `/admin/blog/comments/:id` | Скрыть/удалить комментарий (модерация админом) |

### Admin — Bots (`/api/v1/admin/bots` — 🔑 JWT админа, 2FA email-код)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/bots` | Список ботов (`?owner`, `?verified`) |
| GET | `/admin/bots/:id` | Детали бота + токены |
| POST | `/admin/bots/:id/verify` | Выдать/подтвердить верификацию |
| DELETE | `/admin/bots/:id/verify` | Снять верификацию |
| DELETE | `/admin/bots/:id/tokens/:tokenId` | Отозвать токен бота (админ не удаляет самого бота) |

### Admin — Groups (`/api/v1/admin/groups` — 🔑 JWT админа, 2FA email-код)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/groups` | Список групп (`?type`, `?verified`, `?q`) |
| GET | `/admin/groups/:id` | Детали группы + участники/роли |
| PUT | `/admin/groups/:id/limits` | Изменить лимиты участников |
| POST | `/admin/groups/:id/verify` | Верифицировать группу |
| DELETE | `/admin/groups/:id/verify` | Снять верификацию |
| GET | `/admin/groups/media-requests` | Очередь заявок на СМИ-статус (`?status=pending`) |
| PUT | `/admin/groups/media-requests/:id` | Одобрить/отклонить заявку (`status`, `reviewComment`) |

### Admin — Announcements (`/api/v1/admin/announcements` — 🔑 JWT админа, 2FA email-код)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/announcements` | Список объявлений (`?active`) |
| POST | `/admin/announcements` | Создать объявление (`createdByAdminId` = текущий админ) |
| PUT | `/admin/announcements/:id` | Обновить объявление |
| DELETE | `/admin/announcements/:id` | Удалить объявление |
| POST | `/admin/announcements/:id/dismiss` | Скрыть для пользователя (если `isDismissible`) |

### Admin — Audit log (`/api/v1/admin/audit` — 🔑 JWT админа, 2FA email-код)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/audit` | Журнал действий (`?adminId`, `?action`, `?from`, `?to`) |

### Admin — Service status (`/api/v1/admin/status` — 🔑 JWT админа, 2FA email-код)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/status` | Текущий статус всех узлов (last snapshot per node) |
| GET | `/admin/status/history` | Time-series снимки (`?node`, `?from`, `?to`) |
| POST | `/admin/status/incidents` | Создать инцидент (`severity`, `affectedNodes`, `startsAt`) |
| PUT | `/admin/status/incidents/:id` | Обновить инцидент (`status`, `endsAt`) |

---

## Specifity (`/api/v1/specifity`)

> Dev-tool: статичные метаданные монорепо. Собственной БД не имеет — читает из `index_ecrans.json`. Все эндпоинты публичны (🌐 Public).

| Method | Path | Описание |
|--------|------|----------|
| GET | `/specifity/overview` | Сводка монорепо (счётчики узлов/экранов/таблиц/компонентов, текущая фаза) |
| GET | `/specifity/nodes` | Список узлов экосистемы (ID, иконка, название, кол-во экранов, статус) |
| GET | `/specifity/screens` | Список всех экранов для селектора (ID, название, путь к макету, описание, связанные объекты) |
| GET | `/specifity/screens/:id` | Полная спецификация экрана (описание, связанные API, таблицы БД, компоненты, технологии) |
| GET | `/specifity/endpoints` | Каталог REST-эндпоинтов и WebSocket events по доменам |
| GET | `/specifity/data` | Каталог сущностей БД (таблицы, Prisma-модели, тип Seed/Runtime) |
| GET | `/specifity/components` | Каталог UI-компонентов (глобальные + частные по узлам) |

Узел `specifity.balloo.su` — 7 экранов: Главная (`1_10_02`), Правила (`1_10_03`), Экраны (`1_10_04`), Эндпоинты (`1_10_05`), Данные (`1_10_06`), Компоненты (`1_10_07`) + split-view спецификация экрана (`1_10_01`). В продакшене (Next.js) метаданные генерируются SSG из `index_ecrans.json`.

---

## Login redirect

При попытке входа в command.balloo.su без прав сотрудника — редирект на `/vacancies` (страница вакансий).

---
