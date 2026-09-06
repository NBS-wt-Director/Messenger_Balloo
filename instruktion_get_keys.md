# 🔑 Получение всех ключей и данных для Balloo Messenger

> **Цель:** Получить ВСЕ ключи, вписать их в таблицу ниже, передать AI  
> **Время:** ~2-3 часа (если все аккаунты уже есть)  
> **Безопасность:** Никогда не коммить `.env` в git (уже в `.gitignore`)

---

## 📊 Сводная таблица ключей

Скопируй эту таблицу, заполни поля и отправь обратно AI.  
Поля со значением `*(сгенерировать)*` или `*(оставить)*` — AI сделает сам.

| # | Категория | ENV-переменная | Значение | Где взять | Сложность |
|---|-----------|---------------|----------|-----------|-----------|
| **🟢 БАЗА** | | | | | |
| 1 | PostgreSQL | `POSTGRES_PASSWORD` | `balloo` | Уже установлено | 🟢 Готово |
| 2 | PostgreSQL | `POSTGRES_USER` | `balloo` | Уже установлено | 🟢 Готово |
| 3 | PostgreSQL | `POSTGRES_DB` | `balloo` | Уже установлено | 🟢 Готово |
| 4 | PostgreSQL | `POSTGRES_HOST` | `localhost` | Docker/сервер | 🟢 Готово |
| 5 | PostgreSQL | `POSTGRES_PORT` | `5432` | Docker/сервер | 🟢 Готово |
| 6 | Redis | `REDIS_HOST` | `localhost` | Docker/сервер | 🟢 Готово |
| 7 | Redis | `REDIS_PORT` | `6379` | Docker/сервер | 🟢 Готово |
| 8 | Redis | `REDIS_PASSWORD` | `ef7f5327f2312bd2a5a88d5815467f14853bebfb22aeb9fd6a5e57d43c66e83a` | Сгенерирован | 🟢 Готово ✅ |
| 9 | MinIO | `MINIO_ENDPOINT` | `localhost` | Docker/сервер | 🟢 Готово |
| 10 | MinIO | `MINIO_PORT` | `9000` | Docker/сервер | 🟢 Готово |
| 11 | MinIO | `MINIO_ACCESS_KEY` | `minioadmin` | По умолчанию | 🟢 Готово |
| 12 | MinIO | `MINIO_SECRET_KEY` | `d283226061a57f9254d86186297a0b562b6e78918445e84a11942b8935e238ed` | Кастомный | 🟢 Готово ✅ |
| 13 | MinIO | `MINIO_BUCKET` | `balloo-media` | По умолчанию | 🟢 Готово |
| 14 | JWT | `JWT_SECRET` | `d7514f34bc858be576aa20507943394fbb825f0c9f7672de93fbd8e431c19bac...` | Сгенерирован | 🟢 Готово ✅ |
| 15 | JWT | `JWT_REFRESH_SECRET` | `518af7a683cdb4ca16d467d2db2f457d3ae0623caf7555314160d1c0fe6fc5e66d...` | Сгенерирован | 🟢 Готово ✅ |
| 16 | VAPID (Push) | `VAPID_PUBLIC_KEY` | `BI9QmrSEq90qGCDpylu-BmfKKyoI-HyWuCMvdVuXbnigV5VmJ84xTDYidkOIZR-jtfbUTyi-IsOQVWbwKRU9o8Q` | Сгенерирован | 🟢 Готово ✅ |
| 17 | VAPID (Push) | `VAPID_PRIVATE_KEY` | `Jnh4N3EU-2F0i9j_4tt_8fLVq-ZWoXG2cHNP6QuPVpQ` | Сгенерирован | 🟢 Готово ✅ |
| 18 | Setup | `SETUP_PASSWORD` | `06041996ОИА` | Уже установлено | 🟢 Готово |
| **🟡 OAUTH** | | | | | |
| 19 | **Яндекс OAuth** | `YANDEX_CLIENT_ID` | `ccee3f45f25f4e5d8193ce26124822dc` | developer.tech.yandex.ru | 🟢 Готово ✅ |
| 20 | **Яндекс OAuth** | `YANDEX_CLIENT_SECRET` | `387bed4d64574869b422c431cf8491d4` | developer.tech.yandex.ru | 🟢 Готово ✅ |
| 21 | **VK OAuth** | `VK_CLIENT_ID` | `54752550` | vk.com/apps | 🟢 Готово ✅ |
| 22 | **VK OAuth** | `VK_CLIENT_SECRET` | `iwjsvqAhRMUeNjRMdMO1` | vk.com/apps | 🟢 Готово ✅ |
| 23 | **Mail.ru OAuth** | `MAIL_CLIENT_ID` | `01a067110db474148019fe5602471858` | oauth.mail.ru | 🟢 Готово ✅ |
| 24 | **Mail.ru OAuth** | `MAIL_CLIENT_SECRET` | `01a067110db4741fae9f5ccda45ba826` | oauth.mail.ru | 🟢 Готово ✅ |
| **🟡 EMAIL** | | | | | |
| 25 | **SMTP** | `SMTP_HOST` | `localhost` | ✅ Настроен | ✅ Готово |
| 26 | **SMTP** | `SMTP_PORT` | `587` | ✅ Настроен | ✅ Готово |
| 27 | **SMTP** | `SMTP_USER` | `noreply@balloo.su` | ✅ Настроен | ✅ Готово |
| 28 | **SMTP** | `SMTP_PASSWORD` | `08B09a09l26lu` | ✅ Записан | ✅ Готово |
| 29 | **SMTP** | `SMTP_FROM` | `noreply@balloo.su` | По умолчанию | ✅ Готово |
| **🟡 АНАЛИТИКА** | | | | | |
| 30 | **Яндекс.Метрика** | `VITE_YM_METRIKA_ID` | `112269610` | metrika.yandex.ru | 🟢 Готово ✅ |
| **🟠 ПЛАТЕЖИ (опц.)** | | | | | |
| 31 | **ЮKassa** | `YOOKASSA_SHOP_ID` | _________________ | yookassa.ru (опционально) | 🟠 Позже |
| 32 | **ЮKassa** | `YOOKASSA_API_KEY` | _________________ | yookassa.ru (опционально) | 🟠 Позже |
| **🟠 CDN (опц.)** | | | | | |
| 33 | **Yandex Disk** | `YANDEX_DISK_API_KEY` | _________________ | disk.yandex.ru (опционально) | 🟠 Позже |
| **🔵 CI/CD (GitHub)** | | | | | |
| 34 | **SSH: хост** | `VPS_HOST` (GitHub Secret) | `188.73.176.34` | ✅ Получен | ✅ Готово |
| 35 | **SSH: пользователь** | `VPS_USER` (GitHub Secret) | `cfr_balloo` | ✅ Получен | ✅ Готово |
| 36 | **SSH: приватный ключ** | `VPS_SSH_KEY` (GitHub Secret) | ✅ Получен | `/home/cfr_balloo/.ssh/id_ed25519` | ✅ Готово |

---

## 📝 Как заполнять

### Что заполняешь ты:
- **OAuth** (все 3 — Яндекс, VK, Mail.ru) — клиент ID + секрет ✅
- **ЮKassa** — shop ID + API ключ (если нужны платежи)
- **Yandex Disk** — API ключ (если нужен диск)

### Что уже сгенерировано:
- `REDIS_PASSWORD` ✅
- `JWT_SECRET` + `JWT_REFRESH_SECRET` ✅
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` ✅

### Что уже готово:
- SSH-ключи для CI/CD ✅
- PostgreSQL, Redis, MinIO — стандартные настройки ✅
- `SETUP_PASSWORD` ✅
- **SMTP** — Postfix + Dovecot установлены, noreply@balloo.su и inbox@balloo.su созданы, пересылка inbox→o8eryuhtin@yandex.ru настроена ✅
  - Пароли: noreply=`08B09a09l26lu`, inbox=`Ko89Iv93Ki93`

---

## ✅ Итоговый чек-лист

- [x] **SMTP** — Postfix + Dovecot установлены, пароли записаны, пересылка inbox→o8eryuhtin@yandex.ru настроена
- [x] **SSH** — IP: 188.73.176.34, пользователь: cfr_balloo, приватный ключ получен
- [x] **OAuth: VK** — ID + Secret ✅
- [x] **OAuth: Яндекс** — ID + Secret ✅
- [x] **OAuth: Mail.ru** — ID + Secret ✅
- [x] **Яндекс.Метрика** — ID счётчика ✅
- [x] **VAPID (Push)** — ключи сгенерированы ✅
- [x] **JWT** — секреты сгенерированы ✅
- [x] **Redis** — пароль сгенерирован ✅
- [x] **MinIO** — кастомный SECRET_KEY ✅
- [ ] **ЮKassa** — shop ID + API key (или «позже»)
- [ ] **Yandex Disk** — API key (или «позже»)
- [ ] **SSH-ключ** добавлен в GitHub Secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] **PTR-запись** — настроить у хостера (188.73.176.34 → mail.balloo.su)
- [ ] **DMARC** — TXT-запись: `_dmarc v=DMARC1; p=quarantine; rua=mailto:noreply@balloo.su`
- [x] **Сервер-репорт** — Node.js скрипт настроен, cron (8:00, 14:00, 20:00) активен

---

## 🚀 Что будет дальше

1. **Все OAuth готовы** — Яндекс, VK, Mail.ru ✅
2. **Внести `.env.production` на сервер** — все ключи уже собраны
3. **Перезапустить сервер** на сервере
4. **Запушить SSH-ключ в GitHub Secrets** для CI/CD
5. **Настроить DNS** (PTR, DMARC) для почты