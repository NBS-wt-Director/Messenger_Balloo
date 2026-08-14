# Balloo Messenger — Схема API (REST + WebSocket)

> Единый источник правды по API-эндпоинтам монорепо. Сгенерировано из HTML-макетов (151+ экран). Каждый UI-элемент (форма, кнопка, список, фильтр, модалка) обслуживается эндпоинтом или WS-событием.
>
> **Версия:** 1.0.0 · **Обновлено:** 2026-07-22 · **Групп:** 16 · **Эндпоинтов:** 150 · **WS-событий:** 24

**Источник правды:** `mockups/api_schema.json`. Этот файл — человекочитаемое представление, генерируется из JSON.

---

## 📑 Оглавление

1. [Конвенции](#конвенции)
2. [Аутентификация и аккаунт (у_01)](#аутентификация-и-аккаунт-у-01)
3. [Устройства (у_01)](#устройства-у-01)
4. [Профиль и приватность (у_01)](#профиль-и-приватность-у-01)
5. [Чаты и сообщения (у_01)](#чаты-и-сообщения-у-01)
6. [Группы и каналы (у_01)](#группы-и-каналы-у-01)
7. [Контакты и поиск (у_01)](#контакты-и-поиск-у-01)
8. [Звонки (у_01)](#звонки-у-01)
9. [Сторис (у_01)](#сторис-у-01)
10. [Приглашения, поддержка, боты, донаты, статика (у_01)](#приглашения-поддержка-боты-донаты-статика-у-01)
11. [Админ-панель (admin.balloo.su) (у_02)](#админ-панель-adminballoosu-у-02)
12. [Портал сотрудников (command.balloo.su) (у_03)](#портал-сотрудников-commandballoosu-у-03)
13. [Фич-реквесты (features.balloo.su) (у_04)](#фич-реквесты-featuresballoosu-у-04)
14. [История версий (history.balloo.su) (у_05)](#история-версий-historyballoosu-у-05)
15. [Загрузки (download.balloo.su) (у_06)](#загрузки-downloadballoosu-у-06)
16. [Блог (blog.balloo.su) (у_11)](#блог-blogballoosu-у-11)
17. [Платформенные (mobile/desktop): push, обновления (у_08_у_09)](#платформенные-mobiledesktop-push-обновления-у-08-у-09)
18. [WebSocket-события](#websocket-события)

---

## Конвенции

| Параметр | Значение |
|---|---|
| Base URL (REST) | `https://api.balloo.su/v1` |
| WebSocket URL | `wss://ws.balloo.su/v1` |
| Идентификаторы | Все id — String (cuid) |
| Временные метки | Все даты — BigInt Unix seconds |
| Локализация | Заголовок Accept-Language (20 локалей, см. data_schema.json → conventions.languages) |

### Типы авторизации

| Тип | Описание |
|---|---|
| `JWT` | Bearer-токен авторизованного пользователя (Authorization: Bearer <token>) |
| `Admin` | JWT с ролью admin/moderator (админ-панель) |
| `Staff` | JWT с ролью staff (портал сотрудников command.balloo.su) |
| `Bot` | Bot-токен (X-Bot-Token) |
| `Public` | Без авторизации (гости) |

### Формат ошибок

Все ошибки возвращаются в едином конверте:

```json
{
  "error": {
    "code": "String",
    "message": "String",
    "details": "Json?"
  }
}
```

**Общие коды ошибок:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `CONFLICT`, `BANNED`, `INTERNAL`

### HTTP-коды ошибок

| Код | Описание |
|---|---|
| `400` | VALIDATION_ERROR — неверные данные запроса |
| `401` | UNAUTHORIZED — нет/просрочен токен |
| `403` | FORBIDDEN — нет прав |
| `404` | NOT_FOUND — объект не найден |
| `409` | CONFLICT — конфликт (дубликат, гонка) |
| `429` | RATE_LIMITED — превышен лимит |
| `500` | INTERNAL — внутренняя ошибка |
| `555` | BANNED — аккаунт заблокирован (кастомный код, экран 1_00_07) |

### Пагинация

Курсорная пагинация. Query-параметры и формат ответа:

**Query:**

```json
{
  "cursor": "String?",
  "limit": "Int? (default 30, max 100)"
}
```

**Response:**

```json
{
  "items": "[]",
  "nextCursor": "String?",
  "total": "Int?"
}
```

**Фильтрация и сортировка** — обычные query-параметры конкретных эндпоинтов (например, `?status=`, `?q=`, `?sort=`), перечислены в поле `query` каждого эндпоинта.

---

## Аутентификация и аккаунт (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_01`, `1_01_02`, `1_01_03`, `1_01_29`, `1_01_30`, `1_01_22`, `1_00_07`, `1_00_08`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_01` | `POST` | `/auth/register` | Регистрация по email | `Public` |
| `2_01_02` | `POST` | `/auth/login` | Вход по email и паролю | `Public` |
| `2_01_03` | `POST` | `/auth/oauth/{provider}` | OAuth-вход (yandex | mailru | rambler) | `Public` |
| `2_01_04` | `POST` | `/auth/refresh` | Обновление access-токена | `Public` |
| `2_01_05` | `POST` | `/auth/logout` | Выход (текущее устройство) | `JWT` |
| `2_01_06` | `POST` | `/auth/password-reset/request` | Запрос восстановления пароля (письмо) | `Public` |
| `2_01_07` | `POST` | `/auth/password-reset/confirm` | Установка нового пароля по коду | `Public` |
| `2_01_08` | `POST` | `/auth/2fa/enable` | Включение 2FA (TOTP), выдача секрета и QR | `JWT` |
| `2_01_09` | `POST` | `/auth/2fa/verify` | Подтверждение кода 2FA (при входе или включении) | `Public` |
| `2_01_10` | `DELETE` | `/auth/2fa` | Отключение 2FA | `JWT` |
| `2_01_11` | `GET` | `/auth/accounts` | Список привязанных аккаунтов (мультиаккаунт) | `JWT` |
| `2_01_12` | `POST` | `/auth/accounts/switch` | Переключение активного аккаунта | `JWT` |
| `2_01_13` | `POST` | `/ban/appeal` | Обжалование бана (экран 1_00_08) | `Public` |
| `2_01_14` | `GET` | `/onboarding/steps` | Шаги онбординга (seed, локализованные) | `Public` |

### `POST /auth/register`

**ID:** `2_01_01` · **Авторизация:** `Public`

Регистрация по email

**Тело запроса:**

```json
{
  "email": "String",
  "password": "String",
  "displayName": "String",
  "acceptRules": "Boolean"
}
```

**Успешный ответ:**

```json
{
  "user": "User",
  "accessToken": "String",
  "refreshToken": "String"
}
```

**Ошибки:** `VALIDATION_ERROR`, `CONFLICT (email занят)`, `RATE_LIMITED`

### `POST /auth/login`

**ID:** `2_01_02` · **Авторизация:** `Public`

Вход по email и паролю

**Тело запроса:**

```json
{
  "email": "String",
  "password": "String"
}
```

**Успешный ответ:**

```json
{
  "user": "User",
  "accessToken": "String",
  "refreshToken": "String",
  "twoFactorRequired": "Boolean"
}
```

**Ошибки:** `UNAUTHORIZED (неверные данные)`, `BANNED`, `RATE_LIMITED`

### `POST /auth/oauth/{provider}`

**ID:** `2_01_03` · **Авторизация:** `Public`

OAuth-вход (yandex | mailru | rambler)

**Тело запроса:**

```json
{
  "code": "String",
  "redirectUri": "String"
}
```

**Успешный ответ:**

```json
{
  "user": "User",
  "accessToken": "String",
  "refreshToken": "String",
  "isNewUser": "Boolean"
}
```

**Ошибки:** `VALIDATION_ERROR`, `BANNED`

### `POST /auth/refresh`

**ID:** `2_01_04` · **Авторизация:** `Public`

Обновление access-токена

**Тело запроса:**

```json
{
  "refreshToken": "String"
}
```

**Успешный ответ:**

```json
{
  "accessToken": "String",
  "refreshToken": "String"
}
```

**Ошибки:** `UNAUTHORIZED`

### `POST /auth/logout`

**ID:** `2_01_05` · **Авторизация:** `JWT`

Выход (текущее устройство)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `UNAUTHORIZED`

### `POST /auth/password-reset/request`

**ID:** `2_01_06` · **Авторизация:** `Public`

Запрос восстановления пароля (письмо)

**Тело запроса:**

```json
{
  "email": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `RATE_LIMITED`

### `POST /auth/password-reset/confirm`

**ID:** `2_01_07` · **Авторизация:** `Public`

Установка нового пароля по коду

**Тело запроса:**

```json
{
  "token": "String",
  "newPassword": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `VALIDATION_ERROR`, `NOT_FOUND (токен истёк)`

### `POST /auth/2fa/enable`

**ID:** `2_01_08` · **Авторизация:** `JWT`

Включение 2FA (TOTP), выдача секрета и QR

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "secret": "String",
  "qrDataUrl": "String"
}
```

**Ошибки:** `CONFLICT (уже включена)`

### `POST /auth/2fa/verify`

**ID:** `2_01_09` · **Авторизация:** `Public`

Подтверждение кода 2FA (при входе или включении)

**Тело запроса:**

```json
{
  "userId": "String",
  "code": "String"
}
```

**Успешный ответ:**

```json
{
  "accessToken": "String",
  "refreshToken": "String",
  "backupCodes": "[String]?"
}
```

**Ошибки:** `UNAUTHORIZED (неверный код)`, `RATE_LIMITED`

### `DELETE /auth/2fa`

**ID:** `2_01_10` · **Авторизация:** `JWT`

Отключение 2FA

**Тело запроса:**

```json
{
  "code": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `UNAUTHORIZED`

### `GET /auth/accounts`

**ID:** `2_01_11` · **Авторизация:** `JWT`

Список привязанных аккаунтов (мультиаккаунт)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "accounts": "[AccountBrief]"
}
```

### `POST /auth/accounts/switch`

**ID:** `2_01_12` · **Авторизация:** `JWT`

Переключение активного аккаунта

**Тело запроса:**

```json
{
  "accountId": "String"
}
```

**Успешный ответ:**

```json
{
  "accessToken": "String",
  "refreshToken": "String"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /ban/appeal`

**ID:** `2_01_13` · **Авторизация:** `Public`

Обжалование бана (экран 1_00_08)

**Тело запроса:**

```json
{
  "email": "String",
  "banId": "String?",
  "message": "String"
}
```

**Успешный ответ:**

```json
{
  "appealId": "String"
}
```

**Ошибки:** `RATE_LIMITED`, `CONFLICT (уже подано)`

### `GET /onboarding/steps`

**ID:** `2_01_14` · **Авторизация:** `Public`

Шаги онбординга (seed, локализованные)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "steps": "[OnboardingStep]"
}
```

---

## Устройства (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_21`, `1_01_23`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_15` | `GET` | `/devices` | Список моих устройств | `JWT` |
| `2_01_16` | `DELETE` | `/devices/{deviceId}` | Завершить сессию устройства | `JWT` |
| `2_01_17` | `DELETE` | `/devices` | Завершить все сессии, кроме текущей | `JWT` |
| `2_01_18` | `POST` | `/devices/qr` | Сгенерировать QR для входа нового устройства | `JWT` |
| `2_01_19` | `POST` | `/auth/qr-login` | Вход по QR-токену с нового устройства | `Public` |

### `GET /devices`

**ID:** `2_01_15` · **Авторизация:** `JWT`

Список моих устройств

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "devices": "[Device]"
}
```

### `DELETE /devices/{deviceId}`

**ID:** `2_01_16` · **Авторизация:** `JWT`

Завершить сессию устройства

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `DELETE /devices`

**ID:** `2_01_17` · **Авторизация:** `JWT`

Завершить все сессии, кроме текущей

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean",
  "closed": "Int"
}
```

### `POST /devices/qr`

**ID:** `2_01_18` · **Авторизация:** `JWT`

Сгенерировать QR для входа нового устройства

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "qrToken": "String",
  "expiresAt": "BigInt"
}
```

### `POST /auth/qr-login`

**ID:** `2_01_19` · **Авторизация:** `Public`

Вход по QR-токену с нового устройства

**Тело запроса:**

```json
{
  "qrToken": "String",
  "deviceInfo": "Json"
}
```

**Успешный ответ:**

```json
{
  "accessToken": "String",
  "refreshToken": "String"
}
```

**Ошибки:** `NOT_FOUND (истёк)`, `UNAUTHORIZED`

---

## Профиль и приватность (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_08`, `1_01_09`, `1_01_20`, `1_01_34`, `1_01_37`, `1_01_38`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_20` | `GET` | `/me` | Мой профиль | `JWT` |
| `2_01_21` | `PATCH` | `/me` | Обновление профиля (имя, bio, username) | `JWT` |
| `2_01_22` | `POST` | `/me/avatar` | Загрузка аватара (multipart) | `JWT` |
| `2_01_23` | `GET` | `/users/{username}` | Публичный профиль пользователя | `JWT` |
| `2_01_24` | `GET` | `/me/settings` | Настройки приложения (тема, язык, уведомления, приватность) | `JWT` |
| `2_01_25` | `PATCH` | `/me/settings` | Обновление настроек (частичное) | `JWT` |
| `2_01_26` | `GET` | `/me/blocked` | Список заблокированных пользователей | `JWT` |
| `2_01_27` | `POST` | `/users/{userId}/block` | Заблокировать пользователя | `JWT` |
| `2_01_28` | `DELETE` | `/users/{userId}/block` | Разблокировать пользователя | `JWT` |
| `2_01_29` | `DELETE` | `/me` | Удаление аккаунта | `JWT` |

### `GET /me`

**ID:** `2_01_20` · **Авторизация:** `JWT`

Мой профиль

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "user": "User"
}
```

### `PATCH /me`

**ID:** `2_01_21` · **Авторизация:** `JWT`

Обновление профиля (имя, bio, username)

**Тело запроса:**

```json
{
  "displayName": "String?",
  "username": "String?",
  "bio": "String?",
  "birthday": "BigInt?"
}
```

**Успешный ответ:**

```json
{
  "user": "User"
}
```

**Ошибки:** `VALIDATION_ERROR`, `CONFLICT (username занят)`

### `POST /me/avatar`

**ID:** `2_01_22` · **Авторизация:** `JWT`

Загрузка аватара (multipart)

**Тело запроса:**

```json
{
  "file": "File"
}
```

**Успешный ответ:**

```json
{
  "avatarUrl": "String"
}
```

**Ошибки:** `VALIDATION_ERROR (формат/размер)`

### `GET /users/{username}`

**ID:** `2_01_23` · **Авторизация:** `JWT`

Публичный профиль пользователя

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "user": "PublicUser"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /me/settings`

**ID:** `2_01_24` · **Авторизация:** `JWT`

Настройки приложения (тема, язык, уведомления, приватность)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "settings": "UserSettings"
}
```

### `PATCH /me/settings`

**ID:** `2_01_25` · **Авторизация:** `JWT`

Обновление настроек (частичное)

**Тело запроса:**

```json
{
  "theme": "String?",
  "locale": "String?",
  "notifications": "Json?",
  "privacy": "Json?"
}
```

**Успешный ответ:**

```json
{
  "settings": "UserSettings"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `GET /me/blocked`

**ID:** `2_01_26` · **Авторизация:** `JWT`

Список заблокированных пользователей

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[PublicUser]",
  "nextCursor": "String?"
}
```

### `POST /users/{userId}/block`

**ID:** `2_01_27` · **Авторизация:** `JWT`

Заблокировать пользователя

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`, `CONFLICT`

### `DELETE /users/{userId}/block`

**ID:** `2_01_28` · **Авторизация:** `JWT`

Разблокировать пользователя

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `DELETE /me`

**ID:** `2_01_29` · **Авторизация:** `JWT`

Удаление аккаунта

**Тело запроса:**

```json
{
  "password": "String",
  "reason": "String?"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `UNAUTHORIZED`

---

## Чаты и сообщения (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_04`, `1_01_07`, `1_01_18`, `1_01_19`, `1_01_25`, `1_01_26`, `1_01_28`, `1_01_32`, `1_01_33`, `1_01_35`, `1_01_36`, `1_01_39`, `1_01_40`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_30` | `GET` | `/chats` | Список чатов (с фильтром archived) | `JWT` |
| `2_01_31` | `POST` | `/chats` | Создать личный чат с пользователем | `JWT` |
| `2_01_32` | `GET` | `/chats/{chatId}` | Данные чата | `JWT` |
| `2_01_33` | `GET` | `/chats/{chatId}/messages` | История сообщений (cursor-пагинация назад) | `JWT` |
| `2_01_34` | `POST` | `/chats/{chatId}/messages` | Отправить сообщение (текст/вложения/reply) | `JWT` |
| `2_01_35` | `PATCH` | `/messages/{messageId}` | Редактировать сообщение (модалка 1_01_32) | `JWT` |
| `2_01_36` | `DELETE` | `/messages/{messageId}` | Удалить сообщение (для себя / для всех) | `JWT` |
| `2_01_37` | `POST` | `/messages/{messageId}/reactions` | Поставить/сменить реакцию | `JWT` |
| `2_01_38` | `DELETE` | `/messages/{messageId}/reactions` | Убрать реакцию | `JWT` |
| `2_01_39` | `POST` | `/chats/{chatId}/read` | Отметить прочитанным до сообщения | `JWT` |
| `2_01_40` | `POST` | `/chats/{chatId}/archive` | Архивировать чат | `JWT` |
| `2_01_41` | `DELETE` | `/chats/{chatId}/archive` | Вернуть из архива | `JWT` |
| `2_01_42` | `POST` | `/chats/{chatId}/mute` | Отключить/настроить уведомления чата | `JWT` |
| `2_01_43` | `POST` | `/chats/{chatId}/pin` | Закрепить чат в списке | `JWT` |
| `2_01_44` | `GET` | `/chats/{chatId}/attachments` | Вложения чата по типам (медиа/файлы/ссылки/голосовые) | `JWT` |
| `2_01_45` | `POST` | `/attachments` | Загрузка вложения (multipart, панель 1_01_40) | `JWT` |
| `2_01_46` | `GET` | `/attachments/{attachmentId}` | Метаданные и ссылки вложения (viewer 1_01_33) | `JWT` |
| `2_01_47` | `POST` | `/messages/{messageId}/report` | Жалоба на сообщение (1_01_26) | `JWT` |
| `2_01_48` | `POST` | `/chats/{chatId}/polls` | Создать опрос/квиз (1_01_28) | `JWT` |
| `2_01_49` | `POST` | `/polls/{pollId}/vote` | Проголосовать в опросе | `JWT` |
| `2_01_50` | `POST` | `/messages/forward` | Переслать сообщения | `JWT` |

### `GET /chats`

**ID:** `2_01_30` · **Авторизация:** `JWT`

Список чатов (с фильтром archived)

**Query-параметры:**

```json
{
  "archived": "Boolean?",
  "cursor": "String?",
  "limit": "Int?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[ChatBrief]",
  "nextCursor": "String?"
}
```

### `POST /chats`

**ID:** `2_01_31` · **Авторизация:** `JWT`

Создать личный чат с пользователем

**Тело запроса:**

```json
{
  "userId": "String"
}
```

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `NOT_FOUND`, `FORBIDDEN (заблокирован)`

### `GET /chats/{chatId}`

**ID:** `2_01_32` · **Авторизация:** `JWT`

Данные чата

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `NOT_FOUND`, `FORBIDDEN`

### `GET /chats/{chatId}/messages`

**ID:** `2_01_33` · **Авторизация:** `JWT`

История сообщений (cursor-пагинация назад)

**Query-параметры:**

```json
{
  "cursor": "String?",
  "limit": "Int?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Message]",
  "nextCursor": "String?"
}
```

**Ошибки:** `FORBIDDEN`

### `POST /chats/{chatId}/messages`

**ID:** `2_01_34` · **Авторизация:** `JWT`

Отправить сообщение (текст/вложения/reply)

**Тело запроса:**

```json
{
  "text": "String?",
  "attachmentIds": "[String]?",
  "replyToId": "String?",
  "clientId": "String"
}
```

**Успешный ответ:**

```json
{
  "message": "Message"
}
```

**Ошибки:** `VALIDATION_ERROR`, `FORBIDDEN`, `RATE_LIMITED`

### `PATCH /messages/{messageId}`

**ID:** `2_01_35` · **Авторизация:** `JWT`

Редактировать сообщение (модалка 1_01_32)

**Тело запроса:**

```json
{
  "text": "String"
}
```

**Успешный ответ:**

```json
{
  "message": "Message"
}
```

**Ошибки:** `FORBIDDEN (не автор)`, `NOT_FOUND`, `CONFLICT (время истекло)`

### `DELETE /messages/{messageId}`

**ID:** `2_01_36` · **Авторизация:** `JWT`

Удалить сообщение (для себя / для всех)

**Query-параметры:**

```json
{
  "forAll": "Boolean?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `FORBIDDEN`, `NOT_FOUND`

### `POST /messages/{messageId}/reactions`

**ID:** `2_01_37` · **Авторизация:** `JWT`

Поставить/сменить реакцию

**Тело запроса:**

```json
{
  "emoji": "String"
}
```

**Успешный ответ:**

```json
{
  "reactions": "Json"
}
```

**Ошибки:** `NOT_FOUND`

### `DELETE /messages/{messageId}/reactions`

**ID:** `2_01_38` · **Авторизация:** `JWT`

Убрать реакцию

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "reactions": "Json"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /chats/{chatId}/read`

**ID:** `2_01_39` · **Авторизация:** `JWT`

Отметить прочитанным до сообщения

**Тело запроса:**

```json
{
  "messageId": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

### `POST /chats/{chatId}/archive`

**ID:** `2_01_40` · **Авторизация:** `JWT`

Архивировать чат

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `DELETE /chats/{chatId}/archive`

**ID:** `2_01_41` · **Авторизация:** `JWT`

Вернуть из архива

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /chats/{chatId}/mute`

**ID:** `2_01_42` · **Авторизация:** `JWT`

Отключить/настроить уведомления чата

**Тело запроса:**

```json
{
  "until": "BigInt?"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

### `POST /chats/{chatId}/pin`

**ID:** `2_01_43` · **Авторизация:** `JWT`

Закрепить чат в списке

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

### `GET /chats/{chatId}/attachments`

**ID:** `2_01_44` · **Авторизация:** `JWT`

Вложения чата по типам (медиа/файлы/ссылки/голосовые)

**Query-параметры:**

```json
{
  "type": "String (media|file|link|voice)",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Attachment]",
  "nextCursor": "String?"
}
```

**Ошибки:** `FORBIDDEN`

### `POST /attachments`

**ID:** `2_01_45` · **Авторизация:** `JWT`

Загрузка вложения (multipart, панель 1_01_40)

**Тело запроса:**

```json
{
  "file": "File",
  "kind": "String (image|video|file|voice)"
}
```

**Успешный ответ:**

```json
{
  "attachment": "Attachment"
}
```

**Ошибки:** `VALIDATION_ERROR (размер/формат)`, `RATE_LIMITED`

### `GET /attachments/{attachmentId}`

**ID:** `2_01_46` · **Авторизация:** `JWT`

Метаданные и ссылки вложения (viewer 1_01_33)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "attachment": "Attachment",
  "downloadUrl": "String"
}
```

**Ошибки:** `NOT_FOUND`, `FORBIDDEN`

### `POST /messages/{messageId}/report`

**ID:** `2_01_47` · **Авторизация:** `JWT`

Жалоба на сообщение (1_01_26)

**Тело запроса:**

```json
{
  "reason": "String",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "reportId": "String"
}
```

**Ошибки:** `CONFLICT (уже подана)`, `NOT_FOUND`

### `POST /chats/{chatId}/polls`

**ID:** `2_01_48` · **Авторизация:** `JWT`

Создать опрос/квиз (1_01_28)

**Тело запроса:**

```json
{
  "question": "String",
  "options": "[String]",
  "isQuiz": "Boolean",
  "correctIndex": "Int?",
  "isAnonymous": "Boolean",
  "multipleChoice": "Boolean"
}
```

**Успешный ответ:**

```json
{
  "message": "Message"
}
```

**Ошибки:** `VALIDATION_ERROR`, `FORBIDDEN`

### `POST /polls/{pollId}/vote`

**ID:** `2_01_49` · **Авторизация:** `JWT`

Проголосовать в опросе

**Тело запроса:**

```json
{
  "optionIndexes": "[Int]"
}
```

**Успешный ответ:**

```json
{
  "poll": "Poll"
}
```

**Ошибки:** `CONFLICT (уже голосовал)`, `NOT_FOUND`

### `POST /messages/forward`

**ID:** `2_01_50` · **Авторизация:** `JWT`

Переслать сообщения

**Тело запроса:**

```json
{
  "messageIds": "[String]",
  "targetChatIds": "[String]"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `FORBIDDEN`

---

## Группы и каналы (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_18`, `1_01_19`, `1_01_35`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_51` | `POST` | `/groups` | Создать группу (1_01_18) | `JWT` |
| `2_01_52` | `POST` | `/channels` | Создать канал (1_01_35) | `JWT` |
| `2_01_53` | `PATCH` | `/groups/{chatId}` | Настройки группы/канала (1_01_19) | `JWT` |
| `2_01_54` | `GET` | `/groups/{chatId}/members` | Участники группы | `JWT` |
| `2_01_55` | `POST` | `/groups/{chatId}/members` | Добавить участников | `JWT` |
| `2_01_56` | `DELETE` | `/groups/{chatId}/members/{userId}` | Удалить участника | `JWT` |
| `2_01_57` | `PATCH` | `/groups/{chatId}/members/{userId}/role` | Изменить роль (admin/moderator/member) | `JWT` |
| `2_01_58` | `POST` | `/groups/{chatId}/leave` | Покинуть группу/канал | `JWT` |
| `2_01_59` | `POST` | `/groups/{chatId}/invite-link` | Сгенерировать инвайт-ссылку | `JWT` |
| `2_01_60` | `POST` | `/invite/{code}/join` | Вступить по инвайт-ссылке | `JWT` |

### `POST /groups`

**ID:** `2_01_51` · **Авторизация:** `JWT`

Создать группу (1_01_18)

**Тело запроса:**

```json
{
  "title": "String",
  "description": "String?",
  "isPrivate": "Boolean",
  "isCorporate": "Boolean",
  "memberIds": "[String]"
}
```

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `POST /channels`

**ID:** `2_01_52` · **Авторизация:** `JWT`

Создать канал (1_01_35)

**Тело запроса:**

```json
{
  "title": "String",
  "description": "String?",
  "username": "String?",
  "isPrivate": "Boolean"
}
```

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `CONFLICT (username занят)`

### `PATCH /groups/{chatId}`

**ID:** `2_01_53` · **Авторизация:** `JWT`

Настройки группы/канала (1_01_19)

**Тело запроса:**

```json
{
  "title": "String?",
  "description": "String?",
  "avatar": "String?",
  "permissions": "Json?",
  "corporate": "Json?"
}
```

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `FORBIDDEN (не админ)`

### `GET /groups/{chatId}/members`

**ID:** `2_01_54` · **Авторизация:** `JWT`

Участники группы

**Query-параметры:**

```json
{
  "cursor": "String?",
  "search": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Member]",
  "nextCursor": "String?"
}
```

**Ошибки:** `FORBIDDEN`

### `POST /groups/{chatId}/members`

**ID:** `2_01_55` · **Авторизация:** `JWT`

Добавить участников

**Тело запроса:**

```json
{
  "userIds": "[String]"
}
```

**Успешный ответ:**

```json
{
  "added": "Int"
}
```

**Ошибки:** `FORBIDDEN`

### `DELETE /groups/{chatId}/members/{userId}`

**ID:** `2_01_56` · **Авторизация:** `JWT`

Удалить участника

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `FORBIDDEN`

### `PATCH /groups/{chatId}/members/{userId}/role`

**ID:** `2_01_57` · **Авторизация:** `JWT`

Изменить роль (admin/moderator/member)

**Тело запроса:**

```json
{
  "role": "String"
}
```

**Успешный ответ:**

```json
{
  "member": "Member"
}
```

**Ошибки:** `FORBIDDEN`

### `POST /groups/{chatId}/leave`

**ID:** `2_01_58` · **Авторизация:** `JWT`

Покинуть группу/канал

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /groups/{chatId}/invite-link`

**ID:** `2_01_59` · **Авторизация:** `JWT`

Сгенерировать инвайт-ссылку

**Тело запроса:**

```json
{
  "expiresAt": "BigInt?",
  "maxUses": "Int?"
}
```

**Успешный ответ:**

```json
{
  "link": "String"
}
```

**Ошибки:** `FORBIDDEN`

### `POST /invite/{code}/join`

**ID:** `2_01_60` · **Авторизация:** `JWT`

Вступить по инвайт-ссылке

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `NOT_FOUND (истёк)`, `CONFLICT (уже участник)`

---

## Контакты и поиск (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_05`, `1_01_06`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_61` | `GET` | `/contacts` | Список контактов | `JWT` |
| `2_01_62` | `POST` | `/contacts` | Добавить контакт | `JWT` |
| `2_01_63` | `DELETE` | `/contacts/{contactId}` | Удалить контакт | `JWT` |
| `2_01_64` | `GET` | `/search` | Глобальный поиск (люди, чаты, сообщения, каналы) | `JWT` |

### `GET /contacts`

**ID:** `2_01_61` · **Авторизация:** `JWT`

Список контактов

**Query-параметры:**

```json
{
  "search": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Contact]",
  "nextCursor": "String?"
}
```

### `POST /contacts`

**ID:** `2_01_62` · **Авторизация:** `JWT`

Добавить контакт

**Тело запроса:**

```json
{
  "userId": "String",
  "alias": "String?"
}
```

**Успешный ответ:**

```json
{
  "contact": "Contact"
}
```

**Ошибки:** `NOT_FOUND`, `CONFLICT`

### `DELETE /contacts/{contactId}`

**ID:** `2_01_63` · **Авторизация:** `JWT`

Удалить контакт

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /search`

**ID:** `2_01_64` · **Авторизация:** `JWT`

Глобальный поиск (люди, чаты, сообщения, каналы)

**Query-параметры:**

```json
{
  "q": "String",
  "type": "String? (users|chats|messages|channels)",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "users": "[PublicUser]",
  "chats": "[ChatBrief]",
  "messages": "[MessageHit]",
  "nextCursor": "String?"
}
```

**Ошибки:** `VALIDATION_ERROR (q < 2)`

---

## Звонки (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_10`, `1_01_11`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_65` | `GET` | `/calls` | История звонков | `JWT` |
| `2_01_66` | `POST` | `/calls` | Инициировать звонок (audio|video) | `JWT` |
| `2_01_67` | `POST` | `/calls/{callId}/answer` | Принять звонок | `JWT` |
| `2_01_68` | `POST` | `/calls/{callId}/decline` | Отклонить звонок | `JWT` |
| `2_01_69` | `POST` | `/calls/{callId}/end` | Завершить звонок | `JWT` |

### `GET /calls`

**ID:** `2_01_65` · **Авторизация:** `JWT`

История звонков

**Query-параметры:**

```json
{
  "cursor": "String?",
  "missed": "Boolean?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[CallLog]",
  "nextCursor": "String?"
}
```

### `POST /calls`

**ID:** `2_01_66` · **Авторизация:** `JWT`

Инициировать звонок (audio|video)

**Тело запроса:**

```json
{
  "chatId": "String",
  "kind": "String (audio|video)"
}
```

**Успешный ответ:**

```json
{
  "callId": "String",
  "iceServers": "Json",
  "wsRoom": "String"
}
```

**Ошибки:** `FORBIDDEN`, `CONFLICT (уже в звонке)`

### `POST /calls/{callId}/answer`

**ID:** `2_01_67` · **Авторизация:** `JWT`

Принять звонок

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "iceServers": "Json",
  "wsRoom": "String"
}
```

**Ошибки:** `NOT_FOUND (завершён)`

### `POST /calls/{callId}/decline`

**ID:** `2_01_68` · **Авторизация:** `JWT`

Отклонить звонок

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /calls/{callId}/end`

**ID:** `2_01_69` · **Авторизация:** `JWT`

Завершить звонок

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean",
  "duration": "Int"
}
```

**Ошибки:** `NOT_FOUND`

---

## Сторис (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_27`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_70` | `GET` | `/stories` | Лента сторис контактов | `JWT` |
| `2_01_71` | `POST` | `/stories` | Создать сторис (медиа + текст + стикеры) | `JWT` |
| `2_01_72` | `POST` | `/stories/{storyId}/view` | Отметить просмотр | `JWT` |
| `2_01_73` | `POST` | `/stories/{storyId}/reaction` | Реакция на сторис | `JWT` |
| `2_01_74` | `DELETE` | `/stories/{storyId}` | Удалить свою сторис | `JWT` |
| `2_01_75` | `GET` | `/stories/{storyId}/viewers` | Кто смотрел мою сторис | `JWT` |

### `GET /stories`

**ID:** `2_01_70` · **Авторизация:** `JWT`

Лента сторис контактов

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[StoryGroup]"
}
```

### `POST /stories`

**ID:** `2_01_71` · **Авторизация:** `JWT`

Создать сторис (медиа + текст + стикеры)

**Тело запроса:**

```json
{
  "attachmentId": "String",
  "caption": "String?",
  "visibility": "String (all|contacts|close)",
  "ttlHours": "Int (default 24)"
}
```

**Успешный ответ:**

```json
{
  "story": "Story"
}
```

**Ошибки:** `VALIDATION_ERROR`, `RATE_LIMITED`

### `POST /stories/{storyId}/view`

**ID:** `2_01_72` · **Авторизация:** `JWT`

Отметить просмотр

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /stories/{storyId}/reaction`

**ID:** `2_01_73` · **Авторизация:** `JWT`

Реакция на сторис

**Тело запроса:**

```json
{
  "emoji": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `DELETE /stories/{storyId}`

**ID:** `2_01_74` · **Авторизация:** `JWT`

Удалить свою сторис

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `FORBIDDEN`, `NOT_FOUND`

### `GET /stories/{storyId}/viewers`

**ID:** `2_01_75` · **Авторизация:** `JWT`

Кто смотрел мою сторис

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[PublicUser]",
  "total": "Int"
}
```

**Ошибки:** `FORBIDDEN`

---

## Приглашения, поддержка, боты, донаты, статика (у_01)

**Узел:** balloo.su — основной мессенджер

**Экраны:** `1_01_13`, `1_01_14`, `1_01_15`, `1_01_24`, `1_01_31`, `1_01_12`, `1_01_16`, `1_01_17`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_01_76` | `GET` | `/invites` | Мои приглашения (входящие/исходящие) | `JWT` |
| `2_01_77` | `POST` | `/invites/{inviteId}/accept` | Принять приглашение | `JWT` |
| `2_01_78` | `POST` | `/invites/{inviteId}/decline` | Отклонить приглашение | `JWT` |
| `2_01_79` | `POST` | `/support/tickets` | Создать обращение в поддержку | `JWT` |
| `2_01_80` | `GET` | `/support/tickets/{ticketId}/messages` | Переписка с поддержкой | `JWT` |
| `2_01_81` | `GET` | `/bots` | Каталог ботов | `JWT` |
| `2_01_82` | `POST` | `/bots/{botId}/start` | Начать диалог с ботом | `JWT` |
| `2_01_83` | `GET` | `/donate/tiers` | Тарифы доната (seed) | `Public` |
| `2_01_84` | `POST` | `/donate/checkout` | Создать платёж/подписку доната | `JWT` |
| `2_01_85` | `GET` | `/donate/my` | Мои донаты и подписки (1_01_31) | `JWT` |
| `2_01_86` | `DELETE` | `/donate/subscriptions/{donationId}` | Отменить донат-подписку | `JWT` |
| `2_01_87` | `GET` | `/pages/{slug}` | Текстовые страницы: rules, about-company, about-balloo (seed, локализ.) | `Public` |

### `GET /invites`

**ID:** `2_01_76` · **Авторизация:** `JWT`

Мои приглашения (входящие/исходящие)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "incoming": "[Invite]",
  "outgoing": "[Invite]"
}
```

### `POST /invites/{inviteId}/accept`

**ID:** `2_01_77` · **Авторизация:** `JWT`

Принять приглашение

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /invites/{inviteId}/decline`

**ID:** `2_01_78` · **Авторизация:** `JWT`

Отклонить приглашение

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /support/tickets`

**ID:** `2_01_79` · **Авторизация:** `JWT`

Создать обращение в поддержку

**Тело запроса:**

```json
{
  "subject": "String",
  "message": "String",
  "attachmentIds": "[String]?"
}
```

**Успешный ответ:**

```json
{
  "ticket": "SupportTicket"
}
```

**Ошибки:** `RATE_LIMITED`

### `GET /support/tickets/{ticketId}/messages`

**ID:** `2_01_80` · **Авторизация:** `JWT`

Переписка с поддержкой

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Message]"
}
```

**Ошибки:** `FORBIDDEN`

### `GET /bots`

**ID:** `2_01_81` · **Авторизация:** `JWT`

Каталог ботов

**Query-параметры:**

```json
{
  "search": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Bot]"
}
```

### `POST /bots/{botId}/start`

**ID:** `2_01_82` · **Авторизация:** `JWT`

Начать диалог с ботом

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "chat": "Chat"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /donate/tiers`

**ID:** `2_01_83` · **Авторизация:** `Public`

Тарифы доната (seed)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[DonateTier]"
}
```

### `POST /donate/checkout`

**ID:** `2_01_84` · **Авторизация:** `JWT`

Создать платёж/подписку доната

**Тело запроса:**

```json
{
  "tierId": "String",
  "period": "String (month|year|once)"
}
```

**Успешный ответ:**

```json
{
  "paymentUrl": "String",
  "donationId": "String"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `GET /donate/my`

**ID:** `2_01_85` · **Авторизация:** `JWT`

Мои донаты и подписки (1_01_31)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "active": "[Donation]",
  "history": "[Donation]"
}
```

### `DELETE /donate/subscriptions/{donationId}`

**ID:** `2_01_86` · **Авторизация:** `JWT`

Отменить донат-подписку

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /pages/{slug}`

**ID:** `2_01_87` · **Авторизация:** `Public`

Текстовые страницы: rules, about-company, about-balloo (seed, локализ.)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "page": "TextPage"
}
```

**Ошибки:** `NOT_FOUND`

---

## Админ-панель (admin.balloo.su) (у_02)

**Узел:** admin.balloo.su — админ-панель

**Экраны:** `все экраны узла у_02 (26 шт.)`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_02_01` | `POST` | `/admin/auth/login` | Вход в админ-панель (email+пароль+2FA) | `Public` |
| `2_02_02` | `GET` | `/admin/dashboard` | Метрики дашборда (DAU/MAU, сообщения, репорты) | `Admin` |
| `2_02_03` | `GET` | `/admin/users` | Список пользователей (поиск, фильтры, пагинация) | `Admin` |
| `2_02_04` | `GET` | `/admin/users/{userId}` | Карточка пользователя | `Admin` |
| `2_02_05` | `POST` | `/admin/users/{userId}/ban` | Забанить пользователя | `Admin` |
| `2_02_06` | `DELETE` | `/admin/users/{userId}/ban` | Разбанить | `Admin` |
| `2_02_07` | `GET` | `/admin/reports` | Очередь жалоб (фильтры по типу/статусу) | `Admin` |
| `2_02_08` | `POST` | `/admin/reports/{reportId}/resolve` | Решение по жалобе (approve/reject + действие) | `Admin` |
| `2_02_09` | `GET` | `/admin/appeals` | Обжалования банов | `Admin` |
| `2_02_10` | `POST` | `/admin/appeals/{appealId}/resolve` | Решение по обжалованию | `Admin` |
| `2_02_11` | `GET` | `/admin/support/tickets` | Очередь тикетов поддержки | `Admin` |
| `2_02_12` | `POST` | `/admin/support/tickets/{ticketId}/reply` | Ответ в тикет | `Admin` |
| `2_02_13` | `GET` | `/admin/groups` | Модерация групп/каналов | `Admin` |
| `2_02_14` | `DELETE` | `/admin/groups/{chatId}` | Удалить/заблокировать группу | `Admin` |
| `2_02_15` | `GET` | `/admin/bots` | Управление ботами (список, статусы) | `Admin` |
| `2_02_16` | `PATCH` | `/admin/bots/{botId}` | Одобрить/заблокировать бота | `Admin` |
| `2_02_17` | `GET` | `/admin/donations` | Донаты и подписки (сводка, список) | `Admin` |
| `2_02_18` | `GET` | `/admin/audit-log` | Журнал действий админов | `Admin` |
| `2_02_19` | `GET` | `/admin/settings` | Системные настройки платформы | `Admin` |
| `2_02_20` | `PATCH` | `/admin/settings` | Изменить системные настройки | `Admin` |
| `2_02_21` | `GET` | `/admin/stories` | Модерация сторис | `Admin` |
| `2_02_22` | `DELETE` | `/admin/stories/{storyId}` | Удалить сторис (модерация) | `Admin` |

### `POST /admin/auth/login`

**ID:** `2_02_01` · **Авторизация:** `Public`

Вход в админ-панель (email+пароль+2FA)

**Тело запроса:**

```json
{
  "email": "String",
  "password": "String",
  "totp": "String?"
}
```

**Успешный ответ:**

```json
{
  "accessToken": "String",
  "admin": "AdminUser"
}
```

**Ошибки:** `UNAUTHORIZED`, `RATE_LIMITED`

### `GET /admin/dashboard`

**ID:** `2_02_02` · **Авторизация:** `Admin`

Метрики дашборда (DAU/MAU, сообщения, репорты)

**Query-параметры:**

```json
{
  "period": "String (day|week|month)"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "metrics": "Json",
  "charts": "Json"
}
```

### `GET /admin/users`

**ID:** `2_02_03` · **Авторизация:** `Admin`

Список пользователей (поиск, фильтры, пагинация)

**Query-параметры:**

```json
{
  "search": "String?",
  "status": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[AdminUserRow]",
  "nextCursor": "String?",
  "total": "Int"
}
```

### `GET /admin/users/{userId}`

**ID:** `2_02_04` · **Авторизация:** `Admin`

Карточка пользователя

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "user": "AdminUserFull",
  "sessions": "[Device]",
  "bans": "[Ban]"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /admin/users/{userId}/ban`

**ID:** `2_02_05` · **Авторизация:** `Admin`

Забанить пользователя

**Тело запроса:**

```json
{
  "reason": "String",
  "until": "BigInt?",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "ban": "Ban"
}
```

**Ошибки:** `CONFLICT (уже забанен)`

### `DELETE /admin/users/{userId}/ban`

**ID:** `2_02_06` · **Авторизация:** `Admin`

Разбанить

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /admin/reports`

**ID:** `2_02_07` · **Авторизация:** `Admin`

Очередь жалоб (фильтры по типу/статусу)

**Query-параметры:**

```json
{
  "status": "String?",
  "type": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Report]",
  "nextCursor": "String?"
}
```

### `POST /admin/reports/{reportId}/resolve`

**ID:** `2_02_08` · **Авторизация:** `Admin`

Решение по жалобе (approve/reject + действие)

**Тело запроса:**

```json
{
  "resolution": "String (approved|rejected)",
  "action": "String? (delete_message|ban_user|warn)",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "report": "Report"
}
```

**Ошибки:** `CONFLICT (уже решена)`

### `GET /admin/appeals`

**ID:** `2_02_09` · **Авторизация:** `Admin`

Обжалования банов

**Query-параметры:**

```json
{
  "status": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[BanAppeal]",
  "nextCursor": "String?"
}
```

### `POST /admin/appeals/{appealId}/resolve`

**ID:** `2_02_10` · **Авторизация:** `Admin`

Решение по обжалованию

**Тело запроса:**

```json
{
  "resolution": "String (unban|keep)",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "appeal": "BanAppeal"
}
```

**Ошибки:** `CONFLICT`

### `GET /admin/support/tickets`

**ID:** `2_02_11` · **Авторизация:** `Admin`

Очередь тикетов поддержки

**Query-параметры:**

```json
{
  "status": "String?",
  "assignee": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[SupportTicket]",
  "nextCursor": "String?"
}
```

### `POST /admin/support/tickets/{ticketId}/reply`

**ID:** `2_02_12` · **Авторизация:** `Admin`

Ответ в тикет

**Тело запроса:**

```json
{
  "message": "String",
  "close": "Boolean?"
}
```

**Успешный ответ:**

```json
{
  "message": "Message"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /admin/groups`

**ID:** `2_02_13` · **Авторизация:** `Admin`

Модерация групп/каналов

**Query-параметры:**

```json
{
  "search": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[AdminChatRow]",
  "nextCursor": "String?"
}
```

### `DELETE /admin/groups/{chatId}`

**ID:** `2_02_14` · **Авторизация:** `Admin`

Удалить/заблокировать группу

**Тело запроса:**

```json
{
  "reason": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /admin/bots`

**ID:** `2_02_15` · **Авторизация:** `Admin`

Управление ботами (список, статусы)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Bot]"
}
```

### `PATCH /admin/bots/{botId}`

**ID:** `2_02_16` · **Авторизация:** `Admin`

Одобрить/заблокировать бота

**Тело запроса:**

```json
{
  "status": "String (approved|blocked)"
}
```

**Успешный ответ:**

```json
{
  "bot": "Bot"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /admin/donations`

**ID:** `2_02_17` · **Авторизация:** `Admin`

Донаты и подписки (сводка, список)

**Query-параметры:**

```json
{
  "period": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "summary": "Json",
  "items": "[Donation]"
}
```

### `GET /admin/audit-log`

**ID:** `2_02_18` · **Авторизация:** `Admin`

Журнал действий админов

**Query-параметры:**

```json
{
  "adminId": "String?",
  "action": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[AuditEntry]",
  "nextCursor": "String?"
}
```

### `GET /admin/settings`

**ID:** `2_02_19` · **Авторизация:** `Admin`

Системные настройки платформы

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "settings": "Json"
}
```

### `PATCH /admin/settings`

**ID:** `2_02_20` · **Авторизация:** `Admin`

Изменить системные настройки

**Тело запроса:**

```json
{
  "settings": "Json"
}
```

**Успешный ответ:**

```json
{
  "settings": "Json"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `GET /admin/stories`

**ID:** `2_02_21` · **Авторизация:** `Admin`

Модерация сторис

**Query-параметры:**

```json
{
  "reported": "Boolean?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Story]",
  "nextCursor": "String?"
}
```

### `DELETE /admin/stories/{storyId}`

**ID:** `2_02_22` · **Авторизация:** `Admin`

Удалить сторис (модерация)

**Тело запроса:**

```json
{
  "reason": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

---

## Портал сотрудников (command.balloo.su) (у_03)

**Узел:** command.balloo.su — портал сотрудников

**Экраны:** `все экраны узла у_03 (26 шт.)`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_03_01` | `POST` | `/staff/auth/login` | Вход сотрудника | `Public` |
| `2_03_02` | `GET` | `/staff/dashboard` | Дашборд сотрудника (задачи, новости, встречи) | `Staff` |
| `2_03_03` | `GET` | `/staff/tasks` | Задачи (kanban, фильтры) | `Staff` |
| `2_03_04` | `POST` | `/staff/tasks` | Создать задачу | `Staff` |
| `2_03_05` | `PATCH` | `/staff/tasks/{taskId}` | Обновить задачу (статус, исполнитель) | `Staff` |
| `2_03_06` | `GET` | `/staff/employees` | Каталог сотрудников (оргструктура) | `Staff` |
| `2_03_07` | `GET` | `/staff/employees/{employeeId}` | Карточка сотрудника | `Staff` |
| `2_03_08` | `GET` | `/staff/vacancies` | Вакансии (HR) | `Staff` |
| `2_03_09` | `GET` | `/staff/candidates` | Кандидаты по вакансиям (pipeline по стадиям) | `Staff` |
| `2_03_10` | `GET` | `/staff/candidates/{candidateId}` | Карточка кандидата (интервью, 1_03_24) | `Staff` |
| `2_03_11` | `POST` | `/staff/candidates/{candidateId}/interview` | Сохранить итог интервью (оценки, решение) | `Staff` |
| `2_03_12` | `PATCH` | `/staff/candidates/{candidateId}/stage` | Перевести кандидата на стадию | `Staff` |
| `2_03_13` | `GET` | `/staff/manager/dashboard` | Дашборд руководителя (1_03_25): метрики команды, burn-down | `Staff` |
| `2_03_14` | `GET` | `/staff/time-off` | Отпуска и отсутствия (1_03_26): мои заявки + календарь отдела | `Staff` |
| `2_03_15` | `POST` | `/staff/time-off` | Подать заявку на отпуск/отсутствие | `Staff` |
| `2_03_16` | `POST` | `/staff/time-off/{requestId}/approve` | Утвердить/отклонить заявку (руководитель) | `Staff` |
| `2_03_17` | `GET` | `/staff/knowledge` | База знаний (категории, статьи, поиск) | `Staff` |
| `2_03_18` | `GET` | `/staff/news` | Внутренние новости | `Staff` |
| `2_03_19` | `GET` | `/staff/meetings` | Календарь встреч | `Staff` |

### `POST /staff/auth/login`

**ID:** `2_03_01` · **Авторизация:** `Public`

Вход сотрудника

**Тело запроса:**

```json
{
  "email": "String",
  "password": "String"
}
```

**Успешный ответ:**

```json
{
  "accessToken": "String",
  "staff": "StaffUser"
}
```

**Ошибки:** `UNAUTHORIZED`

### `GET /staff/dashboard`

**ID:** `2_03_02` · **Авторизация:** `Staff`

Дашборд сотрудника (задачи, новости, встречи)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "tasks": "[Task]",
  "news": "[NewsItem]",
  "meetings": "[Meeting]"
}
```

### `GET /staff/tasks`

**ID:** `2_03_03` · **Авторизация:** `Staff`

Задачи (kanban, фильтры)

**Query-параметры:**

```json
{
  "status": "String?",
  "assignee": "String?",
  "sprint": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Task]"
}
```

### `POST /staff/tasks`

**ID:** `2_03_04` · **Авторизация:** `Staff`

Создать задачу

**Тело запроса:**

```json
{
  "title": "String",
  "description": "String?",
  "assigneeId": "String?",
  "priority": "String",
  "dueDate": "BigInt?"
}
```

**Успешный ответ:**

```json
{
  "task": "Task"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `PATCH /staff/tasks/{taskId}`

**ID:** `2_03_05` · **Авторизация:** `Staff`

Обновить задачу (статус, исполнитель)

**Тело запроса:**

```json
{
  "status": "String?",
  "assigneeId": "String?",
  "priority": "String?"
}
```

**Успешный ответ:**

```json
{
  "task": "Task"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /staff/employees`

**ID:** `2_03_06` · **Авторизация:** `Staff`

Каталог сотрудников (оргструктура)

**Query-параметры:**

```json
{
  "department": "String?",
  "search": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Employee]"
}
```

### `GET /staff/employees/{employeeId}`

**ID:** `2_03_07` · **Авторизация:** `Staff`

Карточка сотрудника

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "employee": "Employee"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /staff/vacancies`

**ID:** `2_03_08` · **Авторизация:** `Staff`

Вакансии (HR)

**Query-параметры:**

```json
{
  "status": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Vacancy]"
}
```

### `GET /staff/candidates`

**ID:** `2_03_09` · **Авторизация:** `Staff`

Кандидаты по вакансиям (pipeline по стадиям)

**Query-параметры:**

```json
{
  "vacancyId": "String?",
  "stage": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Candidate]"
}
```

### `GET /staff/candidates/{candidateId}`

**ID:** `2_03_10` · **Авторизация:** `Staff`

Карточка кандидата (интервью, 1_03_24)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "candidate": "Candidate",
  "interviews": "[Interview]",
  "notes": "[Note]"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /staff/candidates/{candidateId}/interview`

**ID:** `2_03_11` · **Авторизация:** `Staff`

Сохранить итог интервью (оценки, решение)

**Тело запроса:**

```json
{
  "scores": "Json",
  "notes": "String",
  "decision": "String (hire|reject|other_role)"
}
```

**Успешный ответ:**

```json
{
  "interview": "Interview"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `PATCH /staff/candidates/{candidateId}/stage`

**ID:** `2_03_12` · **Авторизация:** `Staff`

Перевести кандидата на стадию

**Тело запроса:**

```json
{
  "stageId": "String"
}
```

**Успешный ответ:**

```json
{
  "candidate": "Candidate"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /staff/manager/dashboard`

**ID:** `2_03_13` · **Авторизация:** `Staff`

Дашборд руководителя (1_03_25): метрики команды, burn-down

**Query-параметры:**

```json
{
  "teamId": "String?",
  "sprint": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "metrics": "Json",
  "burndown": "Json",
  "tasks": "[Task]",
  "deadlines": "[Task]"
}
```

**Ошибки:** `FORBIDDEN (не руководитель)`

### `GET /staff/time-off`

**ID:** `2_03_14` · **Авторизация:** `Staff`

Отпуска и отсутствия (1_03_26): мои заявки + календарь отдела

**Query-параметры:**

```json
{
  "department": "String?",
  "from": "BigInt?",
  "to": "BigInt?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "myRequests": "[TimeOffRequest]",
  "calendar": "[TimeOffEntry]"
}
```

### `POST /staff/time-off`

**ID:** `2_03_15` · **Авторизация:** `Staff`

Подать заявку на отпуск/отсутствие

**Тело запроса:**

```json
{
  "type": "String (vacation|sick|remote|other)",
  "from": "BigInt",
  "to": "BigInt",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "request": "TimeOffRequest"
}
```

**Ошибки:** `VALIDATION_ERROR`, `CONFLICT (пересечение)`

### `POST /staff/time-off/{requestId}/approve`

**ID:** `2_03_16` · **Авторизация:** `Staff`

Утвердить/отклонить заявку (руководитель)

**Тело запроса:**

```json
{
  "approved": "Boolean",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "request": "TimeOffRequest"
}
```

**Ошибки:** `FORBIDDEN`

### `GET /staff/knowledge`

**ID:** `2_03_17` · **Авторизация:** `Staff`

База знаний (категории, статьи, поиск)

**Query-параметры:**

```json
{
  "categoryId": "String?",
  "search": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "categories": "[KnowledgeCategory]",
  "articles": "[Article]"
}
```

### `GET /staff/news`

**ID:** `2_03_18` · **Авторизация:** `Staff`

Внутренние новости

**Query-параметры:**

```json
{
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[NewsItem]",
  "nextCursor": "String?"
}
```

### `GET /staff/meetings`

**ID:** `2_03_19` · **Авторизация:** `Staff`

Календарь встреч

**Query-параметры:**

```json
{
  "from": "BigInt",
  "to": "BigInt"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Meeting]"
}
```

---

## Фич-реквесты (features.balloo.su) (у_04)

**Узел:** features.balloo.su — фич-реквесты

**Экраны:** `все экраны узла у_04 (5 шт.)`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_04_01` | `GET` | `/features` | Список фич-реквестов (фильтры, сортировка по голосам) | `Public` |
| `2_04_02` | `GET` | `/features/{featureId}` | Детали фич-реквеста + комментарии | `Public` |
| `2_04_03` | `POST` | `/features` | Создать фич-реквест | `JWT` |
| `2_04_04` | `POST` | `/features/{featureId}/vote` | Голос за фичу (toggle) | `JWT` |
| `2_04_05` | `POST` | `/features/{featureId}/comments` | Комментарий к фиче | `JWT` |
| `2_04_06` | `GET` | `/features/categories` | Категории фич (seed) | `Public` |
| `2_04_07` | `PATCH` | `/admin/features/{featureId}` | Смена статуса фичи (админ: planned|in_progress|done|declined) | `Admin` |

### `GET /features`

**ID:** `2_04_01` · **Авторизация:** `Public`

Список фич-реквестов (фильтры, сортировка по голосам)

**Query-параметры:**

```json
{
  "categoryId": "String?",
  "status": "String?",
  "sort": "String (votes|new)",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[FeatureRequest]",
  "nextCursor": "String?"
}
```

### `GET /features/{featureId}`

**ID:** `2_04_02` · **Авторизация:** `Public`

Детали фич-реквеста + комментарии

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "feature": "FeatureRequest",
  "comments": "[Comment]"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /features`

**ID:** `2_04_03` · **Авторизация:** `JWT`

Создать фич-реквест

**Тело запроса:**

```json
{
  "title": "String",
  "description": "String",
  "categoryId": "String"
}
```

**Успешный ответ:**

```json
{
  "feature": "FeatureRequest"
}
```

**Ошибки:** `VALIDATION_ERROR`, `RATE_LIMITED`

### `POST /features/{featureId}/vote`

**ID:** `2_04_04` · **Авторизация:** `JWT`

Голос за фичу (toggle)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "votes": "Int",
  "voted": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /features/{featureId}/comments`

**ID:** `2_04_05` · **Авторизация:** `JWT`

Комментарий к фиче

**Тело запроса:**

```json
{
  "text": "String"
}
```

**Успешный ответ:**

```json
{
  "comment": "Comment"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `GET /features/categories`

**ID:** `2_04_06` · **Авторизация:** `Public`

Категории фич (seed)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[FeatureCategory]"
}
```

### `PATCH /admin/features/{featureId}`

**ID:** `2_04_07` · **Авторизация:** `Admin`

Смена статуса фичи (админ: planned|in_progress|done|declined)

**Тело запроса:**

```json
{
  "status": "String",
  "comment": "String?"
}
```

**Успешный ответ:**

```json
{
  "feature": "FeatureRequest"
}
```

**Ошибки:** `NOT_FOUND`

---

## История версий (history.balloo.su) (у_05)

**Узел:** history.balloo.su — история версий

**Экраны:** `все экраны узла у_05 (4 шт.)`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_05_01` | `GET` | `/changelog` | Список релизов (фильтр по платформе) | `Public` |
| `2_05_02` | `GET` | `/changelog/{version}` | Детали релиза | `Public` |
| `2_05_03` | `GET` | `/roadmap` | Роадмап (планируемые версии) | `Public` |

### `GET /changelog`

**ID:** `2_05_01` · **Авторизация:** `Public`

Список релизов (фильтр по платформе)

**Query-параметры:**

```json
{
  "platform": "String? (web|desktop|android|ios)",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[Release]",
  "nextCursor": "String?"
}
```

### `GET /changelog/{version}`

**ID:** `2_05_02` · **Авторизация:** `Public`

Детали релиза

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "release": "Release"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /roadmap`

**ID:** `2_05_03` · **Авторизация:** `Public`

Роадмап (планируемые версии)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[RoadmapItem]"
}
```

---

## Загрузки (download.balloo.su) (у_06)

**Узел:** download.balloo.su — загрузки

**Экраны:** `все экраны узла у_06 (2 шт.)`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_06_01` | `GET` | `/downloads` | Актуальные сборки по платформам | `Public` |
| `2_06_02` | `GET` | `/downloads/{buildId}/file` | Скачивание сборки (redirect на CDN) | `Public` |

### `GET /downloads`

**ID:** `2_06_01` · **Авторизация:** `Public`

Актуальные сборки по платформам

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "builds": "[Build]"
}
```

### `GET /downloads/{buildId}/file`

**ID:** `2_06_02` · **Авторизация:** `Public`

Скачивание сборки (redirect на CDN)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "redirect": "302 → CDN URL"
}
```

**Ошибки:** `NOT_FOUND`

---

## Блог (blog.balloo.su) (у_11)

**Узел:** blog.balloo.su — корпоративный блог

**Экраны:** `все экраны узла у_11 (6 шт.)`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_11_01` | `GET` | `/blog/posts` | Лента постов (фильтры: категория, канал, поиск) | `Public` |
| `2_11_02` | `GET` | `/blog/posts/{slug}` | Пост (контент + похожие) | `Public` |
| `2_11_03` | `GET` | `/blog/categories` | Категории блога (seed, локализ.) | `Public` |
| `2_11_04` | `GET` | `/blog/channels/{channelId}` | Канал блога + его посты | `Public` |
| `2_11_05` | `POST` | `/blog/channels/{channelId}/subscribe` | Подписка на канал (персональная лента) | `JWT` |
| `2_11_06` | `GET` | `/blog/feed` | Персональная лента (по подпискам) | `JWT` |
| `2_11_07` | `POST` | `/blog/posts/{postId}/reaction` | Реакция на пост | `JWT` |

### `GET /blog/posts`

**ID:** `2_11_01` · **Авторизация:** `Public`

Лента постов (фильтры: категория, канал, поиск)

**Query-параметры:**

```json
{
  "categoryId": "String?",
  "channelId": "String?",
  "q": "String?",
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[BlogPost]",
  "nextCursor": "String?"
}
```

### `GET /blog/posts/{slug}`

**ID:** `2_11_02` · **Авторизация:** `Public`

Пост (контент + похожие)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "post": "BlogPost",
  "related": "[BlogPost]"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /blog/categories`

**ID:** `2_11_03` · **Авторизация:** `Public`

Категории блога (seed, локализ.)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[BlogCategory]"
}
```

### `GET /blog/channels/{channelId}`

**ID:** `2_11_04` · **Авторизация:** `Public`

Канал блога + его посты

**Query-параметры:**

```json
{
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "channel": "BlogChannel",
  "items": "[BlogPost]"
}
```

**Ошибки:** `NOT_FOUND`

### `POST /blog/channels/{channelId}/subscribe`

**ID:** `2_11_05` · **Авторизация:** `JWT`

Подписка на канал (персональная лента)

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "subscribed": "Boolean"
}
```

**Ошибки:** `NOT_FOUND`

### `GET /blog/feed`

**ID:** `2_11_06` · **Авторизация:** `JWT`

Персональная лента (по подпискам)

**Query-параметры:**

```json
{
  "cursor": "String?"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "items": "[BlogPost]",
  "nextCursor": "String?"
}
```

### `POST /blog/posts/{postId}/reaction`

**ID:** `2_11_07` · **Авторизация:** `JWT`

Реакция на пост

**Тело запроса:**

```json
{
  "emoji": "String"
}
```

**Успешный ответ:**

```json
{
  "reactions": "Json"
}
```

**Ошибки:** `NOT_FOUND`

---

## Платформенные (mobile/desktop): push, обновления (у_08_у_09)

**Узел:** mobile / desktop — платформенные

**Экраны:** `узлы у_08, у_09 переиспользуют API у_01; ниже — специфичные`

| ID | Метод | Путь | Описание | Auth |
|---|---|---|---|---|
| `2_08_01` | `POST` | `/push/register` | Регистрация push-токена устройства (FCM/APNs/RuStore) | `JWT` |
| `2_08_02` | `DELETE` | `/push/register` | Отзыв push-токена (выход) | `JWT` |
| `2_09_01` | `GET` | `/app/update-check` | Проверка обновления (desktop auto-update) | `Public` |

### `POST /push/register`

**ID:** `2_08_01` · **Авторизация:** `JWT`

Регистрация push-токена устройства (FCM/APNs/RuStore)

**Тело запроса:**

```json
{
  "token": "String",
  "platform": "String (android|ios|web|desktop)",
  "provider": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

**Ошибки:** `VALIDATION_ERROR`

### `DELETE /push/register`

**ID:** `2_08_02` · **Авторизация:** `JWT`

Отзыв push-токена (выход)

**Тело запроса:**

```json
{
  "token": "String"
}
```

**Успешный ответ:**

```json
{
  "ok": "Boolean"
}
```

### `GET /app/update-check`

**ID:** `2_09_01` · **Авторизация:** `Public`

Проверка обновления (desktop auto-update)

**Query-параметры:**

```json
{
  "platform": "String",
  "version": "String"
}
```

**Тело запроса:**

_нет_

**Успешный ответ:**

```json
{
  "updateAvailable": "Boolean",
  "latest": "Build?"
}
```

---

## WebSocket-события

**URL:** `wss://ws.balloo.su/v1`

**Авторизация:** JWT в query (?token=) или первым фреймом { type: 'auth', token }

**Конверт сообщения:**

```json
{
  "type": "String",
  "payload": "Json",
  "ts": "BigInt"
}
```

### Список событий

| Событие | Направление | Описание |
|---|---|---|
| `message.new` | server→client | Новое сообщение в любом чате пользователя |
| `message.edited` | server→client | Сообщение отредактировано |
| `message.deleted` | server→client | Сообщение удалено |
| `message.reaction` | server→client | Изменение реакций |
| `chat.read` | server→client | Собеседник прочитал сообщения |
| `typing.start` | bidirectional | Индикатор «печатает» (клиент шлёт, сервер ретранслирует) |
| `typing.stop` | bidirectional | Окончание набора |
| `presence.update` | server→client | Изменение онлайн-статуса контакта |
| `call.incoming` | server→client | Входящий звонок |
| `call.answered` | server→client | Звонок принят на другом устройстве/собеседником |
| `call.ended` | server→client | Звонок завершён/отклонён |
| `call.signal` | bidirectional | WebRTC-сигналинг (offer/answer/ICE) |
| `chat.updated` | server→client | Изменение чата (название, аватар, участники) |
| `chat.member.joined` | server→client | Участник вступил |
| `chat.member.left` | server→client | Участник вышел/удалён |
| `story.new` | server→client | Новая сторис у контакта |
| `invite.new` | server→client | Новое приглашение |
| `poll.updated` | server→client | Обновление результатов опроса |
| `device.new-login` | server→client | Вход с нового устройства (уведомление безопасности) |
| `device.qr-scanned` | server→client | QR отсканирован — подтверждение входа (экран 1_01_23) |
| `notification.new` | server→client | Прочие уведомления (донат, поддержка ответила, фича сменила статус) |
| `support.message` | server→client | Ответ поддержки в тикете |
| `admin.report.new` | server→client | Новая жалоба (реалтайм в админ-панели) |
| `staff.task.updated` | server→client | Обновление задачи на kanban (command.balloo.su) |

### Детали событий

#### `message.new`

**Направление:** server→client

Новое сообщение в любом чате пользователя

**Payload:**

```json
{
  "message": "Message"
}
```

#### `message.edited`

**Направление:** server→client

Сообщение отредактировано

**Payload:**

```json
{
  "message": "Message"
}
```

#### `message.deleted`

**Направление:** server→client

Сообщение удалено

**Payload:**

```json
{
  "chatId": "String",
  "messageId": "String"
}
```

#### `message.reaction`

**Направление:** server→client

Изменение реакций

**Payload:**

```json
{
  "messageId": "String",
  "reactions": "Json"
}
```

#### `chat.read`

**Направление:** server→client

Собеседник прочитал сообщения

**Payload:**

```json
{
  "chatId": "String",
  "userId": "String",
  "messageId": "String"
}
```

#### `typing.start`

**Направление:** bidirectional

Индикатор «печатает» (клиент шлёт, сервер ретранслирует)

**Payload:**

```json
{
  "chatId": "String",
  "userId": "String?"
}
```

#### `typing.stop`

**Направление:** bidirectional

Окончание набора

**Payload:**

```json
{
  "chatId": "String",
  "userId": "String?"
}
```

#### `presence.update`

**Направление:** server→client

Изменение онлайн-статуса контакта

**Payload:**

```json
{
  "userId": "String",
  "status": "String (online|offline|away)",
  "lastSeen": "BigInt?"
}
```

#### `call.incoming`

**Направление:** server→client

Входящий звонок

**Payload:**

```json
{
  "callId": "String",
  "from": "PublicUser",
  "kind": "String (audio|video)"
}
```

#### `call.answered`

**Направление:** server→client

Звонок принят на другом устройстве/собеседником

**Payload:**

```json
{
  "callId": "String"
}
```

#### `call.ended`

**Направление:** server→client

Звонок завершён/отклонён

**Payload:**

```json
{
  "callId": "String",
  "reason": "String",
  "duration": "Int?"
}
```

#### `call.signal`

**Направление:** bidirectional

WebRTC-сигналинг (offer/answer/ICE)

**Payload:**

```json
{
  "callId": "String",
  "sdp": "Json?",
  "candidate": "Json?"
}
```

#### `chat.updated`

**Направление:** server→client

Изменение чата (название, аватар, участники)

**Payload:**

```json
{
  "chat": "ChatBrief"
}
```

#### `chat.member.joined`

**Направление:** server→client

Участник вступил

**Payload:**

```json
{
  "chatId": "String",
  "member": "Member"
}
```

#### `chat.member.left`

**Направление:** server→client

Участник вышел/удалён

**Payload:**

```json
{
  "chatId": "String",
  "userId": "String"
}
```

#### `story.new`

**Направление:** server→client

Новая сторис у контакта

**Payload:**

```json
{
  "story": "StoryBrief"
}
```

#### `invite.new`

**Направление:** server→client

Новое приглашение

**Payload:**

```json
{
  "invite": "Invite"
}
```

#### `poll.updated`

**Направление:** server→client

Обновление результатов опроса

**Payload:**

```json
{
  "pollId": "String",
  "results": "Json"
}
```

#### `device.new-login`

**Направление:** server→client

Вход с нового устройства (уведомление безопасности)

**Payload:**

```json
{
  "device": "Device"
}
```

#### `device.qr-scanned`

**Направление:** server→client

QR отсканирован — подтверждение входа (экран 1_01_23)

**Payload:**

```json
{
  "qrToken": "String",
  "deviceInfo": "Json"
}
```

#### `notification.new`

**Направление:** server→client

Прочие уведомления (донат, поддержка ответила, фича сменила статус)

**Payload:**

```json
{
  "notification": "Json"
}
```

#### `support.message`

**Направление:** server→client

Ответ поддержки в тикете

**Payload:**

```json
{
  "ticketId": "String",
  "message": "Message"
}
```

#### `admin.report.new`

**Направление:** server→client

Новая жалоба (реалтайм в админ-панели)

**Payload:**

```json
{
  "report": "Report"
}
```

#### `staff.task.updated`

**Направление:** server→client

Обновление задачи на kanban (command.balloo.su)

**Payload:**

```json
{
  "task": "Task"
}
```

---

_Сгенерировано из `mockups/api_schema.json` v1.0.0 (2026-07-22)._
