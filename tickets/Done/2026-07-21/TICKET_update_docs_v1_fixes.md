# 🎫 Тикет: Обновление документации по ответам на вопросник

> **ID:** BALL-2026-001  
> **Дата:** 21.07.2026  
> **Фаза:** 1 (Проектирование макетов) → 2 (Фиксация документации)  
> **Приоритет:** Высокий  
> **Статус:** Открыт

---

## 1. 📋 Что изменилось (основание)

Ответы пользователя в `/home/ivan/Рабочий стол/voprosy_po_dokumentacii_i_reaklizacii.md`:

1. **2FA:** TOTP (Google Authenticator) — **НЕТ**, backup-коды — **НЕТ**, но 2FA в целом **нужна** → реализовать через **email-код**
2. **Desktop (Tauri):** ДА, в v1, не откладывать
3. **Mobile (Expo):** ДА, в v1, не откладывать
4. **WebSocket:** Native Node.js (не Hono + uWebSockets.js)
5. **PostgREST:** НЕТ, только Next.js API Routes
6. **Supabase:** НЕТ, собственный PostgreSQL 16
7. **Kubernetes:** НЕТ в v1, Docker Compose на одном сервере
8. **Flyway:** НЕТ, Prisma Migrate
9. **ELK:** НЕТ, только Prometheus + Grafana + Winston
10. **Хранение файлов:** Yandex Disk / Mail.ru Cloud (по выбору, рандомно) + MinIO как кэш (3-3.5 ТБ, TTL, LRU)
11. **Лимиты:** Без диска — 15 МБ, с диском — 1 ГБ, аватарки — 5 МБ
12. **Роли групп:** Создатель/Админ/Модератор/Участник/Читатель
13. **RBAC:** JSON-поле в БД
14. **Безопасность:** argon2, своя капча, rate limit (5/мин, капча после 3), Helmet.js, CSP, Zod, CSRF, DOMPurify, LUKS, шифрование чувствительных полей
15. **Яндекс Карты:** нужен ключ
16. **Логи:** 30 дней + ротация, не логировать содержимое сообщений
17. **AI-перевод:** 14 языков народов РФ генерировать автоматически при деплое
18. **Мультиаккаунт:** аккаунты независимые, схема account_device_links правильная

---

## 2. 🖥️ Экраны (mockups)

### 2.1. Изменить существующие

| ID экрана | Узел | Что изменить | Причина |
|---|---|---|---|
| `1_01_30` | balloo.su | 2FA-настройки: **TOTP-код → email-код**. Убрать QR-код аутентификатора, убрать backup-коды. Добавить поле ввода email-кода + кнопку "Отправить код" | 2FA через email-код (не TOTP) |
| `1_08_11` | mobile | 2FA-настройки: адаптировать под mobile — email-код вместо TOTP | 2FA через email-код |
| `1_09_09` | desktop | 2FA-настройки: адаптировать под desktop — email-код вместо TOTP | 2FA через email-код |
| `1_02_03` | admin | Health checks: если экран есть — обновить под новый стек (Prometheus+Grafana, не ELK) | Изменение стека мониторинга |

### 2.2. Добавить (уже есть в mockups, проверить актуальность)

| ID экрана | Узел | Описание |
|---|---|---|
| `1_09_01`–`1_09_05` | desktop | 5 экранов Desktop-обёртки — **актуальны**, реализуются в v1 |
| `1_08_01`–`1_08_07` | mobile | 7 экранов Mobile — **актуальны**, реализуются в v1 |

### 2.3. Ничего не удалять

Все экраны остаются. 2FA-экраны (`1_01_30`, `1_08_11`, `1_09_09`) — изменяются, не удаляются.

---

## 3. 🗄️ Сущности данных (data_schema.json + 03-database-schema.md)

### 3.1. Изменить существующие

| Таблица | Поле | Было | Стало | Причина |
|---|---|---|---|---|
| `User` | `role` | `"super_admin" \| "mod" \| "developer" \| "support" \| "user"` | `"super_admin" \| "admin" \| "mod" \| "developer" \| "support" \| "user"` | Добавлена роль `admin` (отдельно от `super_admin`) |
| `User` | `yandexDiskToken` | Только Yandex Disk | Переименовать в `cloudToken`, добавить `cloudProvider` ("yandex" \| "mailru" \| null) | Поддержка двух облачных провайдеров |
| `User` | `yandexDiskLinked` | Boolean | Заменить на `cloudProvider` (String?) | Выбор провайдера |
| `GroupRole` | `role` | `"super_admin" \| "mod" \| "author" \| "user"` | `"creator" \| "admin" \| "moderator" \| "member" \| "reader"` | Новые роли групп |
| `GroupRole` | — | нет поля | Добавить `canDeleteMessages`, `canPinMessages`, `canInviteUsers`, `canEditGroupInfo` (Boolean) | Детальные права |
| `Attachment` | `fileSize` | Int | Лимит: без диска — 15 МБ (было 10), с диском — 1 ГБ | Изменение лимитов |
| `Attachment` | — | нет поля | Добавить `cloudProvider` ("yandex" \| "mailru" \| null), `isFromCloud` | Поддержка двух облаков |
| `Device` | `deviceType` | `"web" \| "desktop" \| "ios" \| "android"` | Без изменений (все 4 платформы в v1) | — |
| `Log` (если есть) | `retention` | 7/10 дней | 30 дней (с ротацией) | Изменение политики |
| `Donation` | `source` | — | Добавить `"blog"` | Поддержка блога |

### 3.2. Добавить

| Таблица | Описание | Поля |
|---|---|---|
| `User2FASecret` | 2FA через email-код (НЕ TOTP) | `id`, `userId` (unique), `emailCode` (String — хэш кода), `codeExpires` (BigInt), `enabledAt` (BigInt), `updatedAt` (BigInt) |
| `Admin2FASecret` | 2FA для админов через email-код | `id`, `adminId` (unique), `emailCode` (String — хэш кода), `codeExpires` (BigInt), `enabledAt` (BigInt) |

### 3.3. Удалить

| Таблица | Причина |
|---|---|
| — | Удаления нет. `User2FASecret` и `Admin2FASecret` **пересоздаются** с новой структурой (email-код вместо TOTP) |

### 3.4. Seed-данные (pre_filled_data.json)

| Таблица | Действие |
|---|---|
| `onboarding_steps` | Проверить актуальность переводов (6 языков) |
| `donate_tiers` | Без изменений |
| `application_stages` | Без изменений |
| `feature_categories` | Без изменений |
| `blog_categories` | Без изменений |
| `knowledge_categories` | Без изменений |

---

## 4. 🔌 API-эндпоинты (04-api-websocket-spec.md)

### 4.1. Добавить

| Метод | Путь | Описание | Комментарий |
|---|---|---|---|
| POST | `/auth/2fa/send-code` | Отправить email-код 2FA на почту пользователя | Вместо TOTP setup |
| DELETE | `/auth/2fa` | Отключить 2FA (требует email-код) | Вместо отключения TOTP |
| GET | `/geo/map-key` | Получить ключ Яндекс Карт | Для геолокации |

### 4.2. Изменить

| Метод | Путь | Было | Стало |
|---|---|---|---|
| POST | `/auth/2fa/verify` | Подтвердить TOTP-кодом | Подтвердить email-кодом |
| POST | `/auth/register` | — | Добавить: собственная капча (серверная генерация) |
| POST | `/auth/login` | — | Добавить: rate limiting (5 попыток/мин), капча после 3 неудач |
| POST | `/attachments/upload` | Лимит 10 МБ | Лимит 15 МБ без облака, 1 ГБ с облаком |
| POST | `/attachments/yandex-disk` | Только Yandex Disk | Переименовать в `/attachments/cloud` — поддержка Yandex Disk + Mail.ru Cloud |
| GET/POST/PUT/DELETE | Все admin-эндпоинты | Требование "2FA" | Требование "2FA email-код" (не TOTP) |

### 4.3. Удалить

| Метод | Путь | Причина |
|---|---|---|
| POST | `/auth/2fa/setup` | Заменён на `send-code` (email-код, не TOTP) |
| POST | `/auth/2fa/backup-codes/regenerate` | Backup-коды не нужны |
| Весь раздел | PostgREST (`/rest/v1/*`) | PostgREST не используется |
| Весь раздел | WebSocket Server (Hono + uWebSockets.js) | Native Node.js WebSocket |

### 4.4. WebSocket-события

| Событие | Действие | Комментарий |
|---|---|---|
| `2fa.required` | **Изменить** payload | `{userId, methods: ["email"]}` (вместо `["totp"]`) |
| `status.update` | **Оставить** | Актуально |

---

## 5. 🏗️ Архитектура (01-architecture-decisions.md)

### 5.1. Изменить ADR

| ADR | Что изменить |
|---|---|
| ADR 1 (БД и ORM) | Supabase → собственный PostgreSQL; Flyway → Prisma Migrate |
| ADR 3 (Realtime) | Hono + uWebSockets.js → Native Node.js WebSocket; добавить in-memory Map (без Redis) |
| ADR 5 (Backend) | Убрать PostgREST; добавить версионирование `/api/v1/...` |
| ADR 6 (Хранение файлов) | Добавить Mail.ru Cloud; MinIO как кэш (3-3.5 ТБ, TTL, LRU) |
| ADR 10 (Деплой) | K8s → Docker Compose (v1) |
| ADR 12 (Мониторинг) | ELK → Prometheus + Grafana; 30 дней retention |
| ADR 14 (Безопасность) | Полный список: argon2, своя капча, rate limit, Helmet, CSP, Zod, CSRF, DOMPurify, LUKS |
| ADR 20 (Desktop) | Electron → Tauri; реализуется в v1 |
| ADR 22 (Роли) | Super Admin/Admin/Mod/Developer/Support/User; группы: Creator/Admin/Moderator/Member/Reader |
| ADR 26 (Offline) | SQLite для всех платформ (Web, Desktop, Mobile) — все в v1 |
| ADR 28 (Миграции) | Flyway → Prisma Migrate |
| ADR 29 (Сервисы) | K8s → Docker Compose; убрать PostgREST, WS Server, ELK, Redis |
| ADR 72 (Безопасность) | 2FA: TOTP → email-код; backup-коды не нужны |
| ADR 76 (Desktop обновление) | Автообновление — в v1 (не отложено) |
| ADR 82 (SMTP) | Nodemailer + SMTP + Maildev |
| ADR 83 (MinIO) | Структура бакетов + кэш с TTL/LRU |
| ADR 84 (Логи) | 30 дней + ротация; не логировать содержимое сообщений |
| ADR 92 (Лимиты) | 15 МБ без диска, 1 ГБ с диском, 5 МБ аватарки |
| ADR 97 (Облако) | Yandex Disk + Mail.ru Cloud |

### 5.2. Добавить ADR

| ADR | Описание |
|---|---|
| ADR-2FA (email-код) | 2FA через email-код, не TOTP |
| ADR-Maps | Яндекс Карты для геолокации, своя капча |

### 5.3. Удалить ADR

| ADR | Причина |
|---|---|
| ADR-2FA (TOTP) | Заменён на ADR-2FA (email-код) |

---

## 6. ⚙️ DevOps (06-devops-infrastructure.md)

### 6.1. Docker Compose

| Сервис | Действие |
|---|---|
| PostgreSQL 16 | **Оставить** |
| MinIO | **Оставить**, добавить TTL/LRU политику |
| SMTP (Maildev) | **Оставить** |
| Prometheus + Grafana | **Оставить** |
| Elasticsearch | **Удалить** (ELK не нужен) |
| Kibana | **Удалить** (ELK не нужен) |
| Redis | **Удалить** (не нужен в v1) |

### 6.2. CI/CD

| Этап | Действие |
|---|---|
| OWASP ZAP (безопасность) | **Добавить** |
| k6 (нагрузка) | **Добавить** |
| Деплой в K8s | **Заменить** на деплой через SSH + Docker Compose |

### 6.3. Инфраструктура

| Компонент | Действие |
|---|---|
| Kubernetes манифесты | **Удалить** (не нужны в v1) |
| Ingress (K8s) | **Заменить** на nginx reverse proxy |
| cert-manager | **Заменить** на Let's Encrypt (certbot) |

---

## 7. 🎨 Frontend (05-frontend-spec.md)

### 7.1. Компоненты

| Компонент | Действие | Причина |
|---|---|---|
| `TwoFactorSetup` | **Изменить** | TOTP → email-код, убрать QR и backup-коды |
| Все компоненты | **Обновить сторисы** | Zustand stores: добавить 2FA email-код |

### 7.2. Страницы

| Страница | Действие |
|---|---|
| 2FA-настройки (все платформы) | **Изменить** под email-код |

---

## 8. 📄 Документация (docs/)

### 8.1. Файлы для обновления

| Файл | Статус | Что сделано |
|---|---|---|
| `00-master-build-guide.md` | ✅ Обновлён | Стек, шаги, структура монорепо |
| `01-architecture-decisions.md` | ✅ Обновлён | Все ADR поправлены |
| `02-requirements-checklist.md` | ✅ Обновлён | Вопрос 116 (2FA), упоминания Desktop/Mobile |
| `03-database-schema.md` | ✅ Обновлён | Prisma Migrate, собственный PG, 2FA email-код |
| `04-api-websocket-spec.md` | ✅ Обновлён | 2FA email-код, native WS, убран PostgREST |
| `05-frontend-spec.md` | ✅ Обновлён | 2FA email-код, TwoFactorSetup |
| `06-devops-infrastructure.md` | ✅ Обновлён | Docker Compose, nginx, CI/CD |
| `07-ai-instructions-kodacode.md` | ✅ Обновлён | Контекст, заполнен раздел 9 |
| `08-v2-roadmap.md` | ✅ Создан | Все отложенные функции |

### 8.2. Файлы для создания

| Файл | Статус | Описание |
|---|---|---|
| `README.md` | ⏳ Создать при фиксации | Главный README проекта |

---

## 9. 📦 Макеты (mockups/)

### 9.1. HTML-файлы для обновления

| Файл | Узел | Что изменить |
|---|---|---|
| `mockups/balloo-su/1_01_30.html` | balloo.su | 2FA: TOTP → email-код. Убрать QR-код, секцию backup-кодов. Добавить поле ввода email и кнопку "Отправить код" |
| `mockups/mobile/1_08_11.html` | mobile | 2FA: адаптировать под mobile — email-код вместо TOTP |
| `mockups/desktop/1_09_09.html` | desktop | 2FA: адаптировать под desktop — email-код вместо TOTP |

### 9.2. MD-файлы для обновления

| Файл | Действие |
|---|---|
| `mockups/balloo-su/1_01_30.md` | Обновить задание: 2FA email-код, эндпоинты `send-code`/`verify`, без TOTP/backup-кодов |
| `mockups/mobile/1_08_11.md` | Обновить задание: 2FA email-код |
| `mockups/desktop/1_09_09.md` | Обновить задание: 2FA email-код |

### 9.3. Индексы для обновления

| Файл | Действие |
|---|---|
| `mockups/index.html` | Обновить статистику, проверить ссылки, обновить баннер готовности |
| `mockups/index_ecrans.md` | Обновить таблицы, компоненты, функции |
| `mockups/index_ecrans.json` | Обновить метаданные, статусы, счётчики |

---

## 10. 📊 Порядок выполнения

```
1. Экран 1_01_30 (2FA email-код) → MD документация → index.html/ecrans.md/ecrans.json
2. Экран 1_08_11 (mobile 2FA) → MD → индексы
3. Экран 1_09_09 (desktop 2FA) → MD → индексы
4. data_schema.json → обновить User2FASecret, Admin2FASecret, GroupRole, User, Attachment
5. pre_filled_data.json → проверить seed-данные
6. docs/01-architecture-decisions.md → ✅ (уже обновлено)
7. docs/02-requirements-checklist.md → ✅ (уже обновлено)
8. docs/03-database-schema.md → ✅ (уже обновлено)
9. docs/04-api-websocket-spec.md → ✅ (уже обновлено)
10. docs/05-frontend-spec.md → ✅ (уже обновлено)
11. docs/06-devops-infrastructure.md → ✅ (уже обновлено)
12. docs/07-ai-instructions-kodacode.md → ✅ (уже обновлено)
13. docs/08-v2-roadmap.md → ✅ (уже создан и обновлён)
14. README.md → создать при фиксации
```

---

## 11. ⚡ Быстрая справка

### Что НЕ МЕНЯЕТСЯ
- Все WebSocket события (кроме `2fa.required` payload)
- Модели: Chat, Message, Group, Poll, Call, Story, Invite, Blog и т.д.
- Структура монорепо (pnpm + Turborepo)
- Дизайн-система (октагоны, угловые срезы, 3 темы)
- 20 языков (3 группы)
- RBAC через JSON
- MinIO бакеты (avatars, chats, public)

### Что МЕНЯЕТСЯ
- **2FA:** TOTP → email-код (USER_2FA_SECRET, ADMIN_2FA_SECRET)
- **Хранение:** +Mail.ru Cloud (рядом с Yandex Disk)
- **Роли групп:** creator/admin/moderator/member/reader
- **Роль приложения:** +admin
- **Лимиты:** 15 МБ/1 ГБ/5 МБ
- **Стек:** native WS, собственный PG, Prisma Migrate, Docker Compose

---

*Тикет создан: 21.07.2026*  
*Актуален для Фазы 1→2 (переход от проектирования к фиксации)*