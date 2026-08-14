# 🗝️ Чеклист регистрации API-ключей для Balloo Messenger

**Проект:** Balloo Messenger v1.0  
**Дата:** 2026-07-31  
**Статус:** ⏳ Ожидает заполнения

---

## 📋 Инструкция

1. Пройдитесь по каждому сервису в списке ниже
2. Перейдите по ссылке регистрации
3. Создайте аккаунт / приложение
4. Получите необходимые ключи
5. Заполните `api-keys-questionnaire.md` (следующий файл)
6. Выполните команду: `прочитай документ: tickets/api-keys-questionnaire.md и примени ключи`

---

## 🔹 Шаг 1: Базовая инфраструктура (локально)

### 1.1 PostgreSQL

| Параметр | Значение |
|---|---|
| **Тип** | Self-hosted (локально / VPS) |
| **Ссылка** | https://www.postgresql.org/ |
| **Требуется** | Пароль для пользователя `balloo` |
| **ENV-переменные** | `DATABASE_URL`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| **По умолчанию** | `balloo:balloo123@localhost:5432/balloo` |
| **Инструкция** | 1. Установить PostgreSQL 16 (`apt install postgresql-16` или Docker) 2. Создать БД `balloo` 3. Создать пользователя `balloo` с паролем 4. Записать connection string в `DATABASE_URL` |

### 1.2 Redis

| Параметр | Значение |
|---|---|
| **Тип** | Self-hosted (локально / VPS) |
| **Ссылка** | https://redis.io/ |
| **Требуется** | Опциональный пароль |
| **ENV-переменные** | `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| **По умолчанию** | `redis://localhost:6379` (без пароля) |
| **Инструкция** | 1. Установить Redis 7 (`apt install redis-server` или Docker) 2. Если нужен пароль — установить в `redis.conf` 3. Записать URL в `REDIS_URL` |

### 1.3 MinIO (хранилище файлов)

| Параметр | Значение |
|---|---|
| **Тип** | Self-hosted (S3-совместимое) |
| **Ссылка** | https://min.io/ |
| **Требуется** | `access_key`, `secret_key`, имя bucket |
| **ENV-переменные** | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` |
| **По умолчанию** | `localhost:9000`, `minioadmin/minioadmin`, `balloo-media` |
| **Инструкция** | 1. Запустить Docker: `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"` 2. Войти в консоль: http://localhost:9001 3. Создать bucket `balloo-media` 4. Записать ключи в `.env` |

### 1.4 SMTP / Postfix (email)

| Параметр | Значение |
|---|---|
| **Тип** | Self-hosted |
| **Ссылка** | https://wiki.postfix.org/ |
| **Требуется** | `host`, `port`, `user`, `password` |
| **ENV-переменные** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` |
| **По умолчанию** | `localhost:25`, без аутентификации |
| **Инструкция** | 1. Установить Postfix (`apt install postfix`) 2. Настроить SPF/DKIM/DMARC 3. Создать адрес `noreply@balloo.su` 4. Записать credentials в `.env` |

---

## 🔹 Шаг 2: OAuth авторизация (3 сервиса)

### 2.1 Yandex ID

| Параметр | Значение |
|---|---|
| **Тип** | SaaS OAuth |
| **Ссылка на регистрацию** | https://developer.tech.yandex.ru/ |
| **Тариф** | Бесплатно, безлимит |
| **Требуется** | `client_id`, `client_secret` |
| **ENV-переменные** | `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` |
| **Инструкция** | 1. Перейти https://developer.tech.yandex.ru/ 2. Нажать «Подключить приложение» 3. Выбрать тип «Веб-сервис» 4. Указать `http://localhost:3000/api/auth/oauth/yandex/callback` (dev) или `https://balloo.su/auth/yandex/callback` (prod) 5. Сохранить `client_id` и `client_secret` |
| **Где найти ключи** | Панель приложения → «Пароли» → создать пароль → скопировать ID и секрет |
| **Scopes** | `login:email`, `login:login`, `login:avatar` |
| **Документация** | https://yandex.ru/dev/id/doc/ |

### 2.2 VK ID

| Параметр | Значение |
|---|---|
| **Тип** | SaaS OAuth |
| **Ссылка на регистрацию** | https://vk.com/apps?act=manage |
| **Тариф** | Бесплатно, безлимит |
| **Требуется** | `client_id`, `client_secret` |
| **ENV-переменные** | `VK_CLIENT_ID`, `VK_CLIENT_SECRET` |
| **Инструкция** | 1. Перейти https://vk.com/apps?act=manage 2. Нажать «Создать приложение» 3. Выбрать тип «Веб-приложение» 4. Указать `http://localhost:3000/api/auth/oauth/vk/callback` (dev) 5. В настройках: включить API «Оценки», «Сообщения», «Фото» 6. Сохранить ID приложения и защищённый ключ |
| **Где найти ключи** | Настройки приложения → «Основная информация» → «ID приложения» и «Защищённый ключ» |
| **Scopes** | `email`, `photo` |
| **Документация** | https://dev.vk.com/ |

### 2.3 Mail.ru ID

| Параметр | Значение |
|---|---|
| **Тип** | SaaS OAuth |
| **Ссылка на регистрацию** | https://help.mail.ru/developer/oauth/docs |
| **Тариф** | Бесплатно, безлимит |
| **Требуется** | `client_id`, `client_secret` |
| **ENV-переменные** | `MAILRU_CLIENT_ID`, `MAILRU_CLIENT_SECRET` |
| **Инструкция** | 1. Перейти https://help.mail.ru/developer/oauth/docs 2. Создать приложение в личном кабинете разработчика 3. Указать `http://localhost:3000/api/auth/oauth/mail/callback` (dev) 4. Сохранить ID и секрет |
| **Где найти ключи** | Личный кабинет разработчика → моё приложение → параметры |
| **Scopes** | `email`, `login:avatar`, `login:email` |
| **Документация** | https://help.mail.ru/developer/oauth/docs |

---

## 🔹 Шаг 3: Платежи

### 3.1 ЮKassa

| Параметр | Значение |
|---|---|
| **Тип** | SaaS Payment Gateway |
| **Ссылка на регистрацию** | https://yookassa.ru |
| **Тариф** | Комиссия 2.2–6% |
| **Требуется** | `shopId`, `API-ключ` |
| **ENV-переменные** | `YOOKASSA_SHOP_ID`, `YOOKASSA_API_KEY` |
| **Инструкция** | 1. Зарегистрироваться на https://yookassa.ru 2. Заполнить анкету (ИНН, сайт, оферта) 3. Дождаться верификации 4. Перейти в «Настройки» → «API» 5. Скопировать `ID магазина` (shopId) и `Ключ авторизации` (API key) 6. Настроить webhook: `https://api.balloo.su/api/payments/webhook/yookassa` |
| **Где найти ключи** | Настройки → API → ID магазина + Ключ авторизации |
| **Страница для верификации** | `balloo.su/for_kassa` |
| **Документация** | https://yookassa.ru/developers/api |

---

## 🔹 Шаг 4: CDN / Хранение

### 4.1 Yandex Object Storage (опционально, если MinIO не используется)

| Параметр | Значение |
|---|---|
| **Тип** | S3 Cloud |
| **Ссылка на регистрацию** | https://cloud.yandex.ru/services/object-storage |
| **Тариф** | от 3.4 ₽/ГБ, 8 ГБ бесплатно |
| **Требуется** | `access_key`, `secret_key`, имя bucket, регион |
| **ENV-переменные** | `CDN_YANDEX_ACCESS_KEY`, `CDN_YANDEX_SECRET_KEY`, `CDN_YANDEX_BUCKET`, `CDN_YANDEX_REGION` |
| **Инструкция** | 1. Зарегистрироваться в Yandex Cloud 2. Создать bucket в Object Storage 3. Создать сервисный аккаунт с правами на bucket 4. Создать API-ключ для сервисного аккаунта 5. Скопировать access key и secret key |
| **Где найти ключи** | Yandex Console → IAM → Сервисные аккаунты → создать ключ → скопировать |
| **Endpoint** | `https://storage.yandexcloud.net` |
| **Документация** | https://cloud.yandex.ru/docs/storage/ |

---

## 🔹 Шаг 5: Push-уведомления

### 5.1 Web Push (VAPID keys)

| Параметр | Значение |
|---|---|
| **Тип** | Self-hosted (генерируются автоматически) |
| **Ссылка** | https://web.dev/push-notifications-web-push-protocol/ |
| **Требуется** | `public_key`, `private_key` |
| **ENV-переменные** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| **Инструкция** | Ключи генерируются автоматически при первом запуске сервера библиотекой `web-push`. Не требуют регистрации. Просто убедитесь, что переменные не пустые. |
| **Mobile** | WebSocket-based уведомления (self-hosted) |
| **Desktop** | System notifications через Electron API |

---

## 🔹 Шаг 6: Аналитика

### 6.1 Яндекс.Метрика

| Параметр | Значение |
|---|---|
| **Тип** | SaaS |
| **Ссылка на регистрацию** | https://metrika.yandex.ru/ |
| **Тариф** | Бесплатно до 10 000 просмотров/сутки |
| **Требуется** | `counter_id` |
| **ENV-переменные** | `METRIKA_COUNTER_ID` |
| **Инструкция** | 1. Перейти https://metrika.yandex.ru/ 2. Нажать «Создать счётчик» 3. Указать домен `balloo.su` 4. Скопировать номер счётчика (counter_id) 5. Вставить в `.env` |
| **Где найти ключи** | Настройки счётчика → Код счётчика → номер счётчика |

---

## 🔹 Шаг 7: Безопасность и прочее

### 7.1 JWT Secret (генерация)

| Параметр | Значение |
|---|---|
| **Тип** | Self-generated |
| **Требуется** | Два случайных строковых секрета |
| **ENV-переменные** | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` |
| **Инструкция** | 1. Сгенерировать: `openssl rand -base64 64` 2. Скопировать результат для access secret 3. Сгенерировать ещё раз для refresh secret 4. Вставить оба в `.env` |

### 7.2 SETUP_PASSWORD

| Параметр | Значение |
|---|---|
| **Тип** | Жёстко заданный |
| **Значение** | `06041996ОИА` |
| **ENV-переменная** | `SETUP_PASSWORD` |
| **Инструкция** | Используется для доступа к странице первоначальной установки `/install`. Можно изменить при желании. |

---

## 📊 Сводная таблица

| # | Сервис | Тип | Ключи | Статус |
|---|---|---|---|---|
| 1 | PostgreSQL | Self-hosted | Пароль | ⬜ |
| 2 | Redis | Self-hosted | Пароль (опц.) | ⬜ |
| 3 | MinIO | Self-hosted | access/secret key | ⬜ |
| 4 | Postfix | Self-hosted | user/password | ⬜ |
| 5 | Yandex ID | SaaS OAuth | client_id/secret | ⬜ |
| 6 | VK ID | SaaS OAuth | client_id/secret | ⬜ |
| 7 | Mail.ru ID | SaaS OAuth | client_id/secret | ⬜ |
| 8 | ЮKassa | Payment | shopId/API-key | ⬜ |
| 9 | Yandex Object Storage | S3 Cloud | access/secret key | ⬜ |
| 10 | VAPID Push | Self-gen | public/private key | ⬜ |
| 11 | Яндекс.Метрика | SaaS | counter_id | ⬜ |
| 12 | JWT | Self-gen | 2 секрета | ⬜ |

**Прогресс:** 0 / 12 сервисов завершено

---

## ⚠️ Важные заметки

1. **Никогда не коммитьте `.env` в git** — файл добавлен в `.gitignore`
2. **Продакшен vs Dev**: для продакшена замените `localhost` на реальные домены
3. **SSL**: для продакшена необходим HTTPS (Let's Encrypt / certbot)
4. **Бэкапы**: настраивайте регулярный бэкап PostgreSQL и MinIO
5. **Мониторинг**: Prometheus + Grafana можно настроить позже (не блокирует запуск)

---

## 📝 Порядок действий

1. [ ] Заполнить чеклист выше (поставить ✅ после получения ключей)
2. [ ] Открыть `api-keys-questionnaire.md` и заполнить все поля
3. [ ] Выполнить: `прочитай документ: tickets/api-keys-questionnaire.md и примени ключи`
4. [ ] Проверить: `docker compose up -d` — все сервисы запущены
5. [ ] Проверить: `curl http://localhost:3100/health` — сервер отвечает
