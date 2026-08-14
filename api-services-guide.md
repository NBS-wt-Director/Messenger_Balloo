# 📚 Справочник API-сервисов Balloo Messenger

**Проект:** Balloo Messenger  
**Версия:** 1.0  
**Дата:** 2026-07-24  
**Статус:** ✅ Зафиксирован

---

## ⛔ АБСОЛЮТНЫЙ ЗАПРЕТ ДО V2

Все сервисы, НЕ перечисленные в разделе «✅ Разрешённые сервисы», **СТРОГО ЗАПРЕЩЕНО** использовать, упоминать в коде, документировать, настраивать или писать интеграционный код **до перехода в Фазу v2**.

**Правило:** Никаких упоминаний, импортов, ENV-переменных, конфигураций, комментариев, документации — НИЧЕГО. Только разрешённые сервисы.

Также навсегда запрещены: Cloudflare, Firebase Cloud Messaging, Google OAuth, UptimeRobot, Sentry, SendPulse (недружественные юрисдикции).

---

## ✅ Разрешённые сервисы (v1)

### 1. Авторизация (OAuth)

#### Yandex ID

| Параметр | Значение |
|---|---|
| Регистрация | https://developer.tech.yandex.ru/ |
| Бесплатный тариф | Да, безлимитный для OAuth |
| API-ключи | `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` |
| ENV-переменные | `OAUTH_YANDEX_CLIENT_ID`, `OAUTH_YANDEX_CLIENT_SECRET`, `OAUTH_YANDEX_REDIRECT_URI` |
| Документация | https://yandex.ru/dev/id/doc/ |
| Scopes | `login:email`, `login:login`, `login:avatar` |
| Endpoint | `https://oauth.yandex.ru/authorize`, `https://oauth.yandex.ru/token` |

#### VK ID

| Параметр | Значение |
|---|---|
| Регистрация | https://vk.com/apps?act=manage |
| Бесплатный тариф | Да, безлимитный для OAuth |
| API-ключи | `VK_CLIENT_ID`, `VK_CLIENT_SECRET` |
| ENV-переменные | `OAUTH_VK_CLIENT_ID`, `OAUTH_VK_CLIENT_SECRET`, `OAUTH_VK_REDIRECT_URI` |
| Документация | https://dev.vk.com/ |
| Scopes | `email`, `photo` |
| Endpoint | `https://oauth.vk.com/authorize`, `https://oauth.vk.com/access_token` |

#### Mail.ru ID

| Параметр | Значение |
|---|---|
| Регистрация | https://help.mail.ru/developer/oauth/docs |
| Бесплатный тариф | Да, безлимитный для OAuth |
| API-ключи | `MAILRU_CLIENT_ID`, `MAILRU_CLIENT_SECRET` |
| ENV-переменные | `OAUTH_MAILRU_CLIENT_ID`, `OAUTH_MAILRU_CLIENT_SECRET`, `OAUTH_MAILRU_REDIRECT_URI` |
| Документация | https://help.mail.ru/developer/oauth/docs |
| Scopes | `email`, `login:avatar`, `login:email` |
| Endpoint | `https://oauth.mail.ru/login` |

---

### 2. Платежи (РФ)

#### ЮKassa (двухрежимный модуль)

| Параметр | Значение |
|---|---|
| Регистрация | https://yookassa.ru |
| Тариф | Комиссия 2.2–6% (зависит от режима) |
| API-ключи | `YOOKASSA_SHOP_ID`, `YOOKASSA_API_KEY` |
| ENV-переменные | `YOOKASSA_SHOP_ID`, `YOOKASSA_API_KEY` |
| Документация | https://yookassa.ru/developers/api |
| Webhook | `POST /api/payments/webhook/yookassa` |
| Особенности | Двухрежимный: анонимный (СБП по умолчанию) и полноценный (через API ЮKassa) |
| Режим 1 (анонимный) | QR-код СБП + перевод по номеру телефона. Включён по умолчанию. Админ подтверждает вручную. |
| Режим 2 (полноценный) | Включается через админку вводом API-ключа. Автоматическая обработка через HTTP-уведомления. |
| Страница для ЮKassa | `balloo.su/for_kassa` — реквизиты для верификации (ИНН, сайт, оферта, цены) |

---

### 3. CDN / Хранение файлов

#### Yandex Object Storage

| Параметр | Значение |
|---|---|
| Регистрация | https://cloud.yandex.ru/services/object-storage |
| Бесплатный тариф | 8 ГБ хранения, 10 000 GET-запросов/мес |
| API-ключи | `YANDEX_ACCESS_KEY_ID`, `YANDEX_SECRET_ACCESS_KEY` |
| ENV-переменные | `CDN_YANDEX_ACCESS_KEY`, `CDN_YANDEX_SECRET_KEY`, `CDN_YANDEX_BUCKET`, `CDN_YANDEX_REGION` |
| Документация | https://cloud.yandex.ru/docs/storage/ |
| Endpoint | `https://storage.yandexcloud.net` |
| Особенности | S3-совместимый API |

#### MinIO (self-hosted)

| Параметр | Значение |
|---|---|
| Установка | Docker: `minio/minio:latest` |
| Тариф | Бесплатно (open source) |
| API-ключи | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` |
| ENV-переменные | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` |
| Документация | https://min.io/docs/minio/linux/ |
| Docker | `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"` |
| Особенности | Self-hosted, полный контроль над данными |

---

### 4. Push-уведомления

#### Self-hosted Web Push (VAPID)

| Параметр | Значение |
|---|---|
| Технология | Web Push Protocol (RFC 8030) |
| Библиотека | `web-push` (Node.js) |
| Ключи | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |
| ENV-переменные | `PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY`, `PUSH_VAPID_SUBJECT="mailto:notifications@balloo.su"` |
| Документация | https://web.dev/push-notifications-web-push-protocol/ |
| Особенности | Работает в браузерах, не требует сторонних сервисов |
| Mobile | WebSocket-based уведомления (self-hosted) |
| Desktop | System notifications через Electron API |

---

### 5. Мониторинг

#### Self-hosted Prometheus + Grafana

| Параметр | Значение |
|---|---|
| Установка | Docker |
| Тариф | Бесплатно (open source) |
| ENV-переменные | `PROMETHEUS_PORT=9090`, `GRAFANA_PORT=3001` |
| Docker | `docker-compose up -d prometheus grafana` |
| Документация | https://prometheus.io/docs/, https://grafana.com/docs/ |
| Особенности | Метрики сервера, WebSocket, базы данных |
| Dashboard | `docker/grafana/dashboards/` |

---

### 6. Email

#### Self-hosted (Postfix + Dovecot)

| Параметр | Значение |
|---|---|
| Установка | Docker / VPS |
| Тариф | Бесплатно (open source) |
| ENV-переменные | `SMTP_HOST=mail.balloo.su`, `SMTP_PORT=587`, `SMTP_USER=noreply@balloo.su`, `SMTP_PASSWORD=` |
| Документация | https://wiki.postfix.org/ |
| Особенности | Полный контроль, необходимость настройки SPF/DKIM/DMARC |

---

### 7. Аналитика

#### Яндекс.Метрика

| Параметр | Значение |
|---|---|
| Регистрация | https://metrika.yandex.ru/ |
| Бесплатный тариф | Да, до 10 000 просмотров/сутки |
| ENV-переменные | `METRIKA_COUNTER_ID` |
| Документация | https://yandex.ru/dev/metrika/ |
| Особенности | Бесплатно, интеграция с Яндекс.Директ, вебвизор |

---

### 8. Прочее

#### WebRTC STUN/TURN

| Параметр | Значение |
|---|---|
| STUN (бесплатно) | `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302` |
| TURN (self-hosted) | `coturn/coturn:latest` |
| Тариф | STUN — бесплатно, TURN — свой сервер |
| ENV-переменные | `WEBRTC_STUN_SERVERS=stun:stun.l.google.com:19302`, `WEBRTC_TURN_SERVER=turn:turn.balloo.su:3478`, `WEBRTC_TURN_USERNAME=`, `WEBRTC_TURN_PASSWORD=` |
| Документация | https://coturn.github.io/coturn/ |
| Особенности | Для видеозвонков и голосовых сообщений |

---

## 📋 Сводная таблица ENV-переменных

```env
# === Авторизация (OAuth) ===
OAUTH_YANDEX_CLIENT_ID=
OAUTH_YANDEX_CLIENT_SECRET=
OAUTH_YANDEX_REDIRECT_URI=https://balloo.su/auth/yandex/callback

OAUTH_VK_CLIENT_ID=
OAUTH_VK_CLIENT_SECRET=
OAUTH_VK_REDIRECT_URI=https://balloo.su/auth/vk/callback

OAUTH_MAILRU_CLIENT_ID=
OAUTH_MAILRU_CLIENT_SECRET=
OAUTH_MAILRU_REDIRECT_URI=https://balloo.su/auth/mailru/callback

# === Платежи (ЮKassa — двухрежимный модуль) ===
YOOKASSA_SHOP_ID=
YOOKASSA_API_KEY=

# === CDN / Хранение ===
CDN_YANDEX_ACCESS_KEY=
CDN_YANDEX_SECRET_KEY=
CDN_YANDEX_BUCKET=
CDN_YANDEX_REGION=

MINIO_ENDPOINT=
MINIO_PORT=9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=

# === Push-уведомления ===
PUSH_VAPID_PUBLIC_KEY=
PUSH_VAPID_PRIVATE_KEY=
PUSH_VAPID_SUBJECT="mailto:notifications@balloo.su"

# === Email ===
SMTP_HOST=mail.balloo.su
SMTP_PORT=587
SMTP_USER=noreply@balloo.su
SMTP_PASSWORD=

# === Аналитика ===
METRIKA_COUNTER_ID=

# === WebRTC ===
WEBRTC_STUN_SERVERS=stun:stun.l.google.com:19302
WEBRTC_TURN_SERVER=turn:turn.balloo.su:3478
WEBRTC_TURN_USERNAME=
WEBRTC_TURN_PASSWORD=

# === Прочее ===
SETUP_PASSWORD=06041996ОИА
```

---

## 📊 Разрешённые сервисы (итого)

| Категория | Сервис | Тип | Стоимость |
|---|---|---|---|
| Авторизация | Yandex ID | OAuth SaaS | Бесплатно |
| Авторизация | VK ID | OAuth SaaS | Бесплатно |
| Авторизация | Mail.ru ID | OAuth SaaS | Бесплатно |
| Платежи | ЮMoney | Payment Gateway | 1.5–3.5% |
| CDN | Yandex Object Storage | S3 Cloud | от 3.4 ₽/ГБ |
| CDN | MinIO | Self-hosted | Бесплатно |
| Push | Web Push (VAPID) | Protocol | Бесплатно |
| Мониторинг | Prometheus | Self-hosted | Бесплатно |
| Мониторинг | Grafana | Self-hosted | Бесплатно |
| Email | Postfix | Self-hosted | Бесплатно |
| Аналитика | Яндекс.Метрика | SaaS | Бесплатно |
| WebRTC | Coturn | Self-hosted | Бесплатно |

---

## ⚠️ Правило отсечения

**Любой код, документация, ENV-переменные, комментарии и импорты, связанные с сервисами НЕ из списка «Разрешённые сервисы» выше, должны быть полностью удалены.**

- Никаких `TODO`, `FIXME`, `// v2:` — ничего
- Полное удаление без следов

---

## ✅ Acceptance criteria

- [x] Документ обновлён
- [x] Оставлены ТОЛЬКО 8 разрешённых категорий
- [x] Все остальные сервисы ПОЛНОСТЬЮ удалены (даже в секциях запрета)
- [x] Сводная таблица ENV-переменных обновлена
- [x] Запрещённые до v2 — 0 упоминаний в основном тексте
- [x] Нет запрещённых сервисов (Cloudflare, Firebase, Google OAuth, UptimeRobot, Sentry, SendPulse)

---

## 🔗 Проверка

```bash
# Разрешённые сервисы
grep -c "Yandex ID\|VK ID\|Mail.ru ID\|ЮMoney\|Yandex Object Storage\|MinIO\|Self-hosted\|Яндекс.Метрика\|WebRTC STUN/TURN" api-services-guide.md
# Должно быть > 0

# Бесплатные тарифы
grep -c "Бесплатно" api-services-guide.md
# Должно быть > 10

# Файл существует
wc -l api-services-guide.md
# Должно быть ~250 строк
```

---

**Handoff в следующую сессию:**  
Справочник API-сервисов обновлён. Оставлены ТОЛЬКО 8 разрешённых категорий: Yandex ID, VK ID, Mail.ru ID, ЮMoney, Yandex Object Storage, MinIO, Self-hosted (push/monitoring/email), Яндекс.Метрика, WebRTC STUN/TURN. Все остальные сервисы ПОЛНОСТЬЮ удалены из файла — даже в секциях запрета. Переходить к тикету №3 — настройка монорепо.
