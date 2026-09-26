# 📝 Опросник API-ключей Balloo Messenger

**Проект:** Balloo Messenger v1.0  
**Дата:** 2026-07-31  
**Статус:** ⏳ Ожидает заполнения

---

## 📋 Инструкция

1. Скопируйте все ключи из предыдущих шагов чеклиста
2. Заполните таблицы ниже
3. Сохраните файл
4. Выполните команду:

```
прочитай документ: tickets/api-keys-questionnaire.md и примени ключи
```

5. Система автоматически обновит `.env` файл

---

## 🔹 Шаг 1: Базовая инфраструктура

### PostgreSQL

| ENV-переменная | Значение | Описание |
|---|---|---|
| `DATABASE_URL` | `postgresql://balloo:PASSWORD@localhost:5432/balloo?schema=public` | Connection string |
| `POSTGRES_HOST` | `localhost` | Хост БД |
| `POSTGRES_PORT` | `5432` | Порт БД |
| `POSTGRES_USER` | `balloo` | Имя пользователя |
| `POSTGRES_PASSWORD` | `balloo123` | Пароль пользователя |
| `POSTGRES_DB` | `balloo` | Имя базы данных |

### Redis

| ENV-переменная | Значение | Описание |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Connection string |
| `REDIS_HOST` | `localhost` | Хост Redis |
| `REDIS_PORT` | `6379` | Порт Redis |
| `REDIS_PASSWORD` | *(пусто)* | Пароль (опционально) |

### MinIO (хранилище файлов)

| ENV-переменная | Значение | Описание |
|---|---|---|
| `MINIO_ENDPOINT` | `localhost` | Хост MinIO |
| `MINIO_PORT` | `9000` | Порт MinIO |
| `MINIO_USE_SSL` | `false` | Использовать SSL |
| `MINIO_ACCESS_KEY` | `minioadmin` | Access key |
| `MINIO_SECRET_KEY` | `minioadmin` | Secret key |
| `MINIO_BUCKET` | `balloo-media` | Имя bucket |

### SMTP / Postfix (email)

| ENV-переменная | Значение | Описание |
|---|---|---|
| `SMTP_HOST` | `localhost` | Хост SMTP |
| `SMTP_PORT` | `25` | Порт SMTP |
| `SMTP_USER` | *(пусто)* | Пользователь SMTP |
| `SMTP_PASSWORD` | *(пусто)* | Пароль SMTP |
| `SMTP_FROM` | `noreply@balloo.su` | Адрес отправителя |

---

## 🔹 Шаг 2: OAuth авторизация

### Yandex ID

| ENV-переменная | Значение | Описание |
|---|---|---|
| `YANDEX_CLIENT_ID` | *(заполнить)* | Client ID из Yandex Developer Console |
| `YANDEX_CLIENT_SECRET` | *(заполнить)* | Client Secret из Yandex Developer Console |

> **Где взять:** https://developer.tech.yandex.ru/ → Подключить приложение → Пароли

### VK ID

| ENV-переменная | Значение | Описание |
|---|---|---|
| `VK_CLIENT_ID` | *(заполнить)* | ID приложения |
| `VK_CLIENT_SECRET` | *(заполнить)* | Защищённый ключ |

> **Где взять:** https://vk.com/apps?act=manage → Создать приложение → Настройки

### Mail.ru ID

| ENV-переменная | Значение | Описание |
|---|---|---|
| `MAILRU_CLIENT_ID` | *(заполнить)* | Client ID |
| `MAILRU_CLIENT_SECRET` | *(заполнить)* | Client Secret |

> **Где взять:** https://help.mail.ru/developer/oauth/docs → Личный кабинет разработчика

---

## 🔹 Шаг 3: Платежи

### ЮKassa

| ENV-переменная | Значение | Описание |
|---|---|---|
| `YOOKASSA_SHOP_ID` | *(заполнить)* | ID магазина |
| `YOOKASSA_API_KEY` | *(заполнить)* | Ключ авторизации |

> **Где взять:** https://yookassa.ru → Настройки → API → ID магазина + Ключ авторизации

---

## 🔹 Шаг 4: CDN / Хранение (опционально)

### Yandex Object Storage

| ENV-переменная | Значение | Описание |
|---|---|---|
| `CDN_YANDEX_ACCESS_KEY` | *(заполнить)* | Access key сервисного аккаунта |
| `CDN_YANDEX_SECRET_KEY` | *(заполнить)* | Secret key сервисного аккаунта |
| `CDN_YANDEX_BUCKET` | *(заполнить)* | Имя bucket |
| `CDN_YANDEX_REGION` | *(заполнить)* | Регион (например, `ru-1`) |

> **Где взять:** Yandex Console → IAM → Сервисные аккаунты → API-ключ

---

## 🔹 Шаг 5: Push-уведомления

### VAPID Keys

| ENV-переменная | Значение | Описание |
|---|---|---|
| `VAPID_PUBLIC_KEY` | *(сгенерировать)* | Публичный ключ VAPID |
| `VAPID_PRIVATE_KEY` | *(сгенерировать)* | Приватный ключ VAPID |
| `VAPID_SUBJECT` | `mailto:admin@balloo.su` | Контактный email |

> **Генерация:** Ключи генерируются автоматически при первом запуске сервера. Можно оставить пустыми.

---

## 🔹 Шаг 6: Аналитика

### Яндекс.Метрика

| ENV-переменная | Значение | Описание |
|---|---|---|
| `METRIKA_COUNTER_ID` | *(заполнить)* | Номер счётчика |

> **Где взять:** https://metrika.yandex.ru/ → Создать счётчик → Настройки счётчика

---

## 🔹 Шаг 7: Безопасность

### JWT Secrets

| ENV-переменная | Значение | Описание |
|---|---|---|
| `JWT_ACCESS_SECRET` | *(сгенерировать)* | Секрет для access токенов (min 32 символа) |
| `JWT_REFRESH_SECRET` | *(сгенерировать)* | Секрет для refresh токенов (min 32 символа) |

> **Генерация:** `openssl rand -base64 64` (выполнить 2 раза)

### Setup Password

| ENV-переменная | Значение | Описание |
|---|---|---|
| `SETUP_PASSWORD` | `06041996ОИА` | Пароль для первоначальной настройки |

---

## ✅ Итоговая проверка

Перед выполнением команды проверьте:

- [ ] Все обязательные поля заполнены (PostgreSQL, Redis, MinIO, JWT)
- [ ] OAuth ключи получены минимум для одного провайдера (Yandex/VK/Mail.ru)
- [ ] Ключи скопированы без лишних пробелов и переносов строк
- [ ] Файл сохранён

---

## 🚀 Применение

После заполнения выполните:

```
прочитай документ: tickets/api-keys-questionnaire.md и примени ключи
```

Это обновит файл `.env` в корне проекта.

---

## 📝 Пример заполненного файла

```markdown
## 🔹 Шаг 2: OAuth авторизация

### Yandex ID

| ENV-переменная | Значение | Описание |
|---|---|---|
| `YANDEX_CLIENT_ID` | `1234567890abcdef` | Client ID из Yandex Developer Console |
| `YANDEX_CLIENT_SECRET` | `abcdef1234567890` | Client Secret из Yandex Developer Console |
```
