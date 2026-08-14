# 🔑 Инструкция: Как получить API-ключи для Balloo Messenger

> **Цель:** Получить все внешние ключи и вписать их в `apikeys.json`
> **Время:** ~2-3 часа (если все аккаунты уже есть)
> **Безопасность:** Никогда не коммить `apikeys.json` в git. Файл уже в `.gitignore`.

---

## 📋 Список всех ключей

| # | Категория | Где получить | Сложность |
|---|-----------|-------------|-----------|
| 1 | PostgreSQL | Генерируется | 🟢 Просто |
| 2 | Redis | Генерируется | 🟢 Просто |
| 3 | JWT | Генерируется | 🟢 Просто |
| 4 | VAPID (Push) | Генерируется | 🟢 Просто |
| 5 | MinIO | Генерируется | 🟢 Просто |
| 6 | OAuth: Яндекс | OAuth.tech.yandex.ru | 🟡 Средне |
| 7 | OAuth: VK | dev.vk.com | 🟡 Средне |
| 8 | OAuth: Mail.ru | oauth.mail.ru | 🟡 Средне |
| 9 | OAuth: Max | developer.max.ru | 🟡 Средне |
| 10 | SMTP (email) | Mail.ru / Yandex / Postfix | 🟡 Средне |
| 11 | YooKassa | yookassa.ru | 🔴 Сложно |

---

## 1️⃣ Автоматические ключи (PostgreSQL, Redis, JWT, VAPID, MinIO)

Эти ключи генерируются локально — ничего регистрировать не нужно.

### Шаг 1: Запусти генератор

```bash
cd "/home/ivan/Рабочий стол/проекты/balloo"
bash scripts/generate-secrets.sh
```

Скрипт выведет в терминал:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`

### Шаг 2: Сгенерируй VAPID-ключи (для push-уведомлений)

```bash
npx web-push generate-vapid-keys
```

Выведет:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### Шаг 3: Впиши в apikeys.json

Открой `apikeys.json` и вписывай значения в секции `dev` и `production`.

**Для dev** — можно оставить простые пароли (`balloo123` и т.д.).
**Для production** — использовать сгенерированные значения.

---

## 2️⃣ OAuth: Яндекс

### Где получить
🔗 **https://oauth.yandex.ru/client/new** (или https://developer.tech.yandex.ru → OAuth → Новый клиент)

### Шаги

1. Войди в Яндекс ID (нужен подтверждённый аккаунт)
2. Создай новое приложение:
   - **Название:** `Balloo Messenger`
   - **Описание:** `Российский мессенджер`
3. В разделе «Доступы» выбери:
   - `Яндекс ID` → `Логин пользователя`
   - `Яндекс ID` → `Аватар пользователя`
   - `Яндекс ID` → `Имя пользователя`
   - `Яндекс ID` → `Пол пользователя`
   - `Яндекс ID` → `Дата рождения пользователя`
4. В разделе «Redirect URI» добавь:
   - **Dev:** `http://localhost:3000/api/auth/oauth/yandex/callback`
   - **Prod:** `https://app.balloo.su/api/auth/oauth/yandex/callback`
5. Нажми «Создать приложение»

### Что получишь

- **ClientID** → `YANDEX_CLIENT_ID`
- **ClientSecret** → `YANDEX_CLIENT_SECRET`

### Куда вписать

```json
// apikeys.json → dev.oauth.yandex
"YANDEX_CLIENT_ID": "твой_client_id",
"YANDEX_CLIENT_SECRET": "твой_client_secret"

// apikeys.json → production.oauth.yandex
"YANDEX_CLIENT_ID": "твой_client_id",
"YANDEX_CLIENT_SECRET": "твой_client_secret",
"YANDEX_REDIRECT_URI": "https://app.balloo.su/api/auth/oauth/yandex/callback"
```

---

## 3️⃣ OAuth: VK

### Где получить
🔗 **https://vk.com/apps?act=manage**

### Шаги

1. Войди в VK (нужен подтверждённый аккаунт)
2. Нажми «Создать приложение»:
   - **Название:** `Balloo Messenger`
   - **Платформа:** `Веб-сайт`
   - **Адрес сайта:** `https://balloo.su`
   - **Базовый домен:** `balloo.su`
   - **Доверенный redirect URI:**
     - Dev: `http://localhost:3000/api/auth/oauth/vk/callback`
     - Prod: `https://app.balloo.su/api/auth/oauth/vk/callback`
3. Тип приложения: `Web`
4. Нажми «Подключить приложение»

### Что получишь

- **ID приложения** → `VK_CLIENT_ID`
- **Защищённый ключ** → `VK_CLIENT_SECRET`

### Куда вписать

```json
// apikeys.json → dev.oauth.vk
"VK_CLIENT_ID": "твой_id",
"VK_CLIENT_SECRET": "твой_secret"

// apikeys.json → production.oauth.vk
"VK_CLIENT_ID": "твой_id",
"VK_CLIENT_SECRET": "твой_secret",
"VK_REDIRECT_URI": "https://app.balloo.su/api/auth/oauth/vk/callback"
```

---

## 4️⃣ OAuth: Mail.ru

### Где получить
🔗 **https://oauth.mail.ru/app/stopapp** (или https://appsmail.ru/devapp)

### Шаги

1. Войди в Mail.ru (нужен подтверждённый аккаунт)
2. Создай новое приложение:
   - **Название:** `Balloo Messenger`
   - **Описание:** `Российский мессенджер`
   - **Адрес сайта:** `https://balloo.su`
   - **Redirect URI:**
     - Dev: `http://localhost:3000/api/auth/oauth/mail/callback`
     - Prod: `https://app.balloo.su/api/auth/oauth/mail/callback`
3. Доступы:
   - `userinfo` — получение данных пользователя
4. Нажми «Зарегистрировать»

### Что получишь

- **Client ID** → `MAIL_CLIENT_ID`
- **Client Secret** → `MAIL_CLIENT_SECRET`

### Куда вписать

```json
// apikeys.json → dev.oauth.mail
"MAIL_CLIENT_ID": "твой_id",
"MAIL_CLIENT_SECRET": "твой_secret"

// apikeys.json → production.oauth.mail
"MAIL_CLIENT_ID": "твой_id",
"MAIL_CLIENT_SECRET": "твой_secret",
"MAIL_REDIRECT_URI": "https://app.balloo.su/api/auth/oauth/mail/callback"
```

---

## 5️⃣ OAuth: Max

### Где получить
🔗 **https://max.ru/dev** (или аналог — проверь актуальную ссылку)

### Шаги

1. Войди в Max (нужен аккаунт)
2. Создай новое приложение:
   - **Название:** `Balloo Messenger`
   - **Redirect URI:**
     - Dev: `http://localhost:3000/api/auth/oauth/max/callback`
     - Prod: `https://app.balloo.su/api/auth/oauth/max/callback`
3. Запроси доступы:
   - `user.info` — данные пользователя

### Что получишь

- **Client ID** → `MAX_CLIENT_ID`
- **Client Secret** → `MAX_CLIENT_SECRET`

### Куда вписать

```json
// apikeys.json → dev.oauth.max
"MAX_CLIENT_ID": "твой_id",
"MAX_CLIENT_SECRET": "твой_secret"

// apikeys.json → production.oauth.max
"MAX_CLIENT_ID": "твой_id",
"MAX_CLIENT_SECRET": "твой_secret",
"MAX_REDIRECT_URI": "https://app.balloo.su/api/auth/oauth/max/callback"
```

> ⚠️ **Важно:** Max — новый сервис. Если OAuth ещё недоступен публично, оставь поля пустыми — вход через Max можно добавить позже.

---

## 6️⃣ SMTP (Email)

### Вариант A: Mail.ru для домена (бесплатно)

🔗 **https://business.mail.ru/mail/**

1. Зарегистрируй домен `balloo.su` (если ещё не зарегистрирован)
2. Добавь домен в Mail.ru для бизнеса
3. Подтверди владение доменом (через DNS-запись)
4. Создай ящик `noreply@balloo.su`
5. Настрой DKIM и SPF записи в DNS

### Что получишь

- **SMTP сервер:** `smtp.mail.ru`
- **Порт:** `465` (SSL) или `587` (STARTTLS)
- **Логин:** `noreply@balloo.su`
- **Пароль:** пароль от ящика

### Вариант B: Yandex 360 для бизнеса

🔗 **https://360.yandex.ru/business/**

1. Добавь домен `balloo.su`
2. Подтверди владение доменом
3. Создай ящик `noreply@balloo.su`
4. Разреши SMTP-отправку в настройках

### Что получишь

- **SMTP сервер:** `smtp.yandex.ru`
- **Порт:** `465` (SSL) или `587` (STARTTLS)
- **Логин:** `noreply@balloo.su`
- **Пароль:** пароль от ящика (или app-specific password)

### Вариант C: Self-hosted Postfix

```bash
sudo apt install postfix
sudo postconf -e 'myhostname = mail.balloo.su'
sudo postconf -e 'mydomain = balloo.su'
sudo postconf -e 'smtpd_sasl_auth_enable = yes'
sudo systemctl restart postfix
```

- **SMTP сервер:** `localhost`
- **Порт:** `587`
- **Логин/пароль:** системный пользователь

### Куда вписать

```json
// apikeys.json → dev.smtp
"SMTP_HOST": "localhost",
"SMTP_PORT": "587",
"SMTP_USER": "",
"SMTP_PASSWORD": ""

// apikeys.json → production.smtp
"SMTP_HOST": "smtp.mail.ru",
"SMTP_PORT": "465",
"SMTP_USER": "noreply@balloo.su",
"SMTP_PASSWORD": "пароль_от_ящика",
"SMTP_FROM": "noreply@balloo.su",
"SMTP_TLS": "true"
```

---

## 7️⃣ YooKassa (Платежи)

### Где получить
🔗 **https://yookassa.ru/`

### Шаги

1. Зарегистрируйся на YooKassa как юридическое лицо или ИП
2. Пройди идентификацию (ИНН, ОГРН, расчётный счёт)
3. Дождись активации (1-3 рабочих дня)
4. В личном кабинете:
   - **Настройки → API → Ключ API** → скопируй
   - **Настройки → Магазин → shopId** → скопируй
5. Настрой Webhook:
   - URL: `https://api.balloo.su/api/payments/webhook/yookassa`
   - События: `payment.succeeded`, `payment.canceled`, `refund.succeeded`

### Что получишь

- **shopId** → `YOOKASSA_SHOP_ID`
- **API ключ** → `YOOKASSA_API_KEY`

### Куда вписать

```json
// apikeys.json → dev.payments
"YOOKASSA_SHOP_ID": "",
"YOOKASSA_API_KEY": ""

// apikeys.json → production.payments
"YOOKASSA_SHOP_ID": "твой_shop_id",
"YOOKASSA_API_KEY": "твой_api_key",
"YOOKASSA_WEBHOOK_URL": "https://api.balloo.su/api/payments/webhook/yookassa"
```

> ⚠️ **Важно:** YooKassa требует верификации бизнеса. Если её ещё нет — оставь пустым, донаты можно включить позже.

---

## 8️⃣ MinIO (для production)

MinIO — self-hosted S3-совместимое хранилище. Ключи генерируются при установке.

### Для dev (в Docker)

```bash
cd "/home/ivan/Рабочий стол/проекты/balloo"
docker compose -f docker/docker-compose.yml up -d minio
```

Дефолтные ключи:
- `MINIO_ACCESS_KEY` = `minioadmin`
- `MINIO_SECRET_KEY` = `minioadmin`

### Для production

Сгенерируй через `generate-secrets.sh` и вписывай.

### Создание бакетов

После запуска MinIO создай бакеты:

```bash
docker exec balloo-minio-prod mc alias set local http://localhost:9000 ACCESS_KEY SECRET_KEY
docker exec balloo-minio-prod mc mb local/balloo-avatars
docker exec balloo-minio-prod mc mb local/balloo-chats
docker exec balloo-minio-prod mc mb local/balloo-public
docker exec balloo-minio-prod mc mb local/balloo-backups
```

---

## ✅ Чек-лист готовности apikeys.json

После заполнения проверь:

- [ ] `dev.database.POSTGRES_PASSWORD` — заполнен
- [ ] `dev.jwt.JWT_ACCESS_SECRET` — заполнен (≥32 символа)
- [ ] `dev.jwt.JWT_REFRESH_SECRET` — заполнен (≥32 символа)
- [ ] `dev.oauth.yandex` — заполнен (или пустой, если OAuth не нужен для dev)
- [ ] `dev.smtp` — заполнен (или localhost для dev)
- [ ] `dev.push.VAPID_*` — заполнен
- [ ] `production.database.POSTGRES_PASSWORD` — заполнен
- [ ] `production.jwt.JWT_*` — заполнен (≥32 символа)
- [ ] `production.oauth.yandex` — заполнен
- [ ] `production.oauth.vk` — заполнен
- [ ] `production.oauth.mail` — заполнен
- [ ] `production.oauth.max` — заполнен (или пустой)
- [ ] `production.smtp` — заполнен
- [ ] `production.cdn.MINIO_*` — заполнен
- [ ] `production.push.VAPID_*` — заполнен
- [ ] `production.payments.YOOKASSA_*` — заполнен (или пустой)
- [ ] `production.setup.ADMIN_INSTALL_PASSWORD` — заполнен
- [ ] `production.setup.SETUP_PASSWORD` — заполнен

---

## 📤 Что делать после заполнения

1. Сохрани `apikeys.json`
2. Пришли мне файл целиком в новом тикете:

```
прочитай документ: tickets/production-readiness-migration.md и выполни тикет №2

Вот заполненный apikeys.json:
[содержимое файла]
```

3. Я извлеку ключи и создам `.env.dev` и `.env.production`
4. **Никогда** не отправляй `apikeys.json` в публичные каналы (git, чаты, email)
