# Мультитикет: Разделение на поддомены (Вариант C) — Balloo

> Создан: 2026-09-12. Статус: **активен, ни одна задача не начата.**
> Цель документа: новая сессия начинает работу БЕЗ пересказа контекста.
> Все факты ниже проверены чтением кода/продом 2026-09-12. Не перепроверяй
> «с нуля» — только точечно, если собираешься менять.

## 0. Договорённости (источники истины)

- `AGENTS.md` (корень) — правила разработки, сетка 11 узлов, темы фиксированы.
- `mockups/` — дизайн и контент ИСТИНА (вёрстка, тексты, `assets/common.css` —
  истина для тем: `[data-theme="dark"|"light"|"russian"]`, ровно 3 темы).
- `docs/01-проект-balloo-контекст-и-решения.md` — контекст (там же устаревший
  Next.js — поправить в тикете №1).
- `tickets/prod-deploy-handoff-20260912.md` — прод-состояние (этап 44: P20–P26
  задеплоены, 5/5 Up; приёмка владельцем P27 — ждёт).
- **НЕЛЬЗЯ:** SSH/доступы к серверу с стороны ассистента (проверено: коннект
  к серверу из прошлой сессии был ошибкой — больше не повторять). Серверные
  изменения — только батчи-скрипты, которые запускает пользователь.

## 1. Решение пользователя (Вариант C — гибрид)

Изначально (docs/01) каждый узел сетки = отдельный поддомен. Сейчас это
свёрнуто в 1 SPA + 2 поддомена. Пользователь решил: **Вариант C**:

| Поддомен | Узел | Тип | Код |
|---|---|---|---|
| `balloo.su` | 01 мессенджер + 10 авторизация + 11 лендинг | SPA с auth | `packages/web` (существует) |
| `admin.balloo.su` | 08 админ-панель | SPA, роль `admin` | новый пакет (выделить из web) |
| `command.balloo.su` | 09 персонал | SPA, роль `command` | новый пакет (выделить из web) |
| `features.balloo.su` | 04 предложения | SPA, вход возможен | новый пакет (выделить из web) |
| `download.balloo.su` | 03 загрузка | статический сайт | новый пакет |
| `history.balloo.su` | 02 история | статический сайт | новый пакет |
| `docs.balloo.su` | 05 документация | статический сайт (OpenAPI/Swagger) | новый пакет |
| `blog.balloo.su` | 07 блог | статический сайт | новый пакет |
| `api.balloo.su` | API + WS | Express (не Fastify) | `packages/server` — **единая точка API для всех сайтов** (решение пользователя 2026-09-18: всё API выносится на api.balloo.su, не `/api/` на balloo.su) |

Требования пользователя (дословный смысл, обязательны):
1. **Единая шапка и единый подвал на ВСЕХ сайтах** (Topbar с TopbarMenu по
   разделам + футер с правовыми ссылками).
2. **Единый стилевой и языковой контракт** (3 темы; i18n 20 языков, куки
   выбора языка, контракт `data_schema.json` → `conventions.languages`).
3. **Один API и одна база** на все сайты — никакого второго бэкенда/дублирования.
   **Всё API (REST + WS + OAuth-колбэки) обслуживается только с `api.balloo.su`**
   (решение пользователя 2026-09-18). Сайты ходят на `https://api.balloo.su/...`,
   не на `/api/` в своём origin.
4. **Тема «наша» (russian) не везде соответствует требованию — выглядит как
   вторая тёмная тема. Исправить по макету** (`common.css` — истина; в web
   блок russian правится под него; проверить все сайты).
5. **features.balloo.su: можно войти** — голосовать, смотреть историю и статус
   СВОИХ предложений; **неанонимные предложения**: в админке НЕ отличать никак,
   в голосовалке отображать неанонимные привлекательнее (автор оформлен).
6. Сначала этот документ (готов) → затем выполнение тикетов №0–№6 → деплой →
   приёмка владельцем.

## 2. Текущее состояние (проверено 2026-09-12, не перепроверять целиком)

- Один пакет `packages/web` (React+Vite), один роутер со всеми маршрутами:
  `/`, `/login`, `/f/:username`, `/features*`, `/admin` (18 экранов),
  `/command` (13), `/features` (6), `/history` (5), `/download` (4),
  `/docs` (2), `/blog` (4), `/auth`+landing (8).
- Прод: `balloo.su` (web+api проксирование) и `api.balloo.su` (health).
  Vhost'и — в `/etc/nginx` на сервере (вне репозитория); контейнерный
  `docker/nginx.conf` имеет `server_name localhost` и `location /api/` →
  `server:3000`. Реальный API для клиента — `https://balloo.su/api/...`
  (`VITE_API_URL` = `https://balloo.su`, код сам дописывает `/api/...`).
- Бэкенд `/api/features` УЖЕ есть (`routes/features.ts`): GET списков/деталей
  публичные; POST/голоса/комментарии под `authRequired` (JWT httpOnly cookie).
- `FeatureRequest` (`packages/shared/prisma/schema.prisma:850`): author =
  `userId` (обязателен), **поля анонимности НЕТ** → для «неанонимных
  привлекательнее» нужна миграция (например `isAnonymous Boolean @default(true)`).
  Голоса `FeatureVote`, комментарии `FeatureComment` есть.
- Темы: `packages/web/src/styles/themes.css` + `ThemeProvider` + `uiStore`
  (data-theme: dark/light/russian). В `design-system.css` селекторов тем нет.
- i18n: `packages/shared/src/i18n/translations.ts`, I18nProvider в web;
  переводы пока только экранов авторизации (P22) — полный охват UI = v2,
  но шапка/подвал/общие тексты ОБЯЗАНЫ быть переведены сразу (контракт).
- Сборки ОПТИМИЗИРОВАНЫ (Dockerfile.server/.web: pnpm pin 10.6.0, corepack
  offline, `--mount=type=cache`, prune; локально пересборка web 21s).
  **Коммит+push ещё не сделаны** (ждут подтверждения пользователя).
- Прод-контейнеры: 5/5 Up (server/web/postgres/redis/minio). Команда
  деплоя: `cd /home/aedgar192/balloo && git pull && docker compose up -d --build`
  (сервер: aedgar@192.168.1.85, внешний 188.73.176.34; доступы — у владельца).

## 3. Контракты (обязательны для всех новых сайтов)

### 3.1 Общий UI-пакет
Новый пакет `packages/ui` (`@balloo/ui`): Topbar (TopbarMenu, разделы →
**абсолютные URL поддоменов**), Footer, ThemeProvider (3 темы, css из макета),
I18nProvider + i18n из `@balloo/shared`, дизайн-токены. Все сайты (web,
web-admin, web-command, web-features, info-сайты) используют ЕГО — иначе
шапка/подвал разъедутся.

### 3.2 Сессия между поддоменами (факты проверены чтением кода 2026-09-18)
- Куки ставит `packages/server/src/middleware/auth.ts` (`setAuthCookies`,
  строки ~177–200): `balloo-access-token` — httpOnly, Secure в production,
  **SameSite=Strict**, 15 мин; `balloo-refresh-token` — httpOnly, Secure,
  **SameSite=Lax** (для OAuth-редиректов), 30 дней. **`Domain` НЕ задан** →
  host-only кука.
- После переноса API на `api.balloo.su` host-only кука приклеится к
  `api.balloo.su` — и ЭТОГО ДОСТАТОЧНО для всех сайтов: запрос на API всегда
  идёт на `api.balloo.su`, а любоеballoo-поддомен ↔ `api.balloo.su` —
  same-site (eTLD+1 = `balloo.su`), поэтому Strict/Lax не блокируют, и
  `credentials:'include'` прикладывает куку независимо от того, с какой
  страницы начат fetch. **`Domain=.balloo.su` выставлять НЕ нужно** (было бы
  хуже — кука утекала бы и на сервисные поддомены, которым она не нужна).
- Обязательная проверка в тикете №2: живой вход с `features.balloo.su`
  (login с balloo.su → fetch getMe с features → 200) — это доказательство,
  а не рассуждение.
- Вход с под-сайтов: кнопка «Войти» → `https://balloo.su/#/login?next=<URL>`;
  **`next` — только из белого списка поддоменов balloo.su** (серверная
  проверка — защита от open redirect). После входа — редирект обратно.

### 3.3 API и CORS (Вариант C + решение 2026-09-18: API = только api.balloo.su)
- **Единый API: `https://api.balloo.su`**. Маршруты сервера уже смонтированы
  с префиксом `/api/...` (`routes/index.ts`), поэтому клиентский код меняется
  только в origin: `VITE_API_URL=https://api.balloo.su` (клиент сам дописывает
  `/api/...`, проверено: `api.ts`, `LoginScreen.tsx:71`, `ChatViewScreen.tsx:85`).
  Итоговые URL: `https://api.balloo.su/api/auth/...` — некрасиво, но зато
  ноль правок роутов; «голые» пути (`/auth/...`) — только вместе с ретайпом
  nginx/префикса, **осознанно оставляем `/api/` и в v2 при желании чистим**.
- WS: клиент строит URL как `API_BASE.replace('http','ws') + '/ws/?token='` →
  после смены VITE_API_URL получится `wss://api.balloo.su/ws/` автоматически;
  канон vhost `api.balloo.su` уже проксирует `/` c Upgrade-заголовками и
  `client_max_body_size 120m` (проверено чтением `docker/prod/nginx/balloo-docker.conf`).
- OAuth-колбэки: redirect_uri в `docker/prod/.env.production` (строки ~78–93)
  сейчас `https://balloo.su/api/auth/oauth/...` → **перевести на
  `https://api.balloo.su/api/auth/oauth/...` и заново прописать их в панелях
  провайдеров (Яндекс/VK/Mail.ru) — действие пользователя**, не серверное.
- `CORS_ORIGIN` (env api; `middleware/cors.ts` читает список через split(','),
  `credentials:true` — проверено): полный список origin'ов:
  `https://balloo.su,https://admin.balloo.su,https://command.balloo.su,`
  `https://features.balloo.su,https://blog.balloo.su,https://history.balloo.su,`
  `https://download.balloo.su,https://docs.balloo.su`. Никаких `*` с credentials.
- Совместимость: прокси `/api/` и `/ws/` в `docker/nginx.conf` (web-контейнер)
  и vhost balloo.su **оставить на переходный период** (старые кэшированные
  бандли, desktop/mobile до перевода env) — удалить отдельным батчем после
  приёмки. Монитор UptimeRobot (`api.balloo.su/health`) и probe basic-auth —
  не трогаем, они уже на api.balloo.su.
- **desktop/mobile**: env с адресом API (`packages/desktop`,
  `packages/mobile-*`) перевести на `api.balloo.su` в тикете №5; не забыть,
  иначе после удаления compat-прокси они потеряют API.

### 3.4 Темы и языки
- Темы ровно 3: `dark`, `light`, `russian`; значения — из `common.css`.
  russian ≠ «вторая тёмная»: сверить каждый селектор-блок с макетом.
- Языки: контракт `data_schema.json` → `conventions.languages` (20, ru по
  умолчанию); кука выбора языка; все сайты через `@balloo/ui` I18nProvider.

### 3.5 Nginx/сервер
- Каждый новый поддомен = vhost + certbot-сертификат, добавляется
  **батчем-скриптом по образцу `scripts/enable-probes.sh`**: гейт «изменить
  может только пользователь», бэкап `nginx.conf.pre-<tag>-<ts>`, `nginx -t`,
  ровно один reload, откат по не-0. Не менее 10 проверок в скрипте.
- Старые маршруты SPA (`/admin`, `/command`, `/features*`) на balloo.su —
  редирект-компоненты на поддомены (hash-роутер, 301 невозможен).

## 4. Задачи (выполнять по одной, протокол AGENTS.md)

### Тикет №0 — API целиком на `api.balloo.su` (фундамент, делать первым)
- `VITE_API_URL=https://api.balloo.su` для web (prod-сборка; compose build
  arg); dev остаётся localhost:3100. Клиент дописывает `/api/...` сам (§3.3).
- `docker/prod/.env.production`: все `*_REDIRECT_URI` → `https://api.balloo.su/api/auth/oauth/...`;
  `CORS_ORIGIN` — полный список (§3.3).
- **Действие пользователя (не серверное): переставить redirect_uri в панелях
  Яндекс/VK/Mail.ru** на новые URL. Без этого OAuth падёт на стороне
  провайдера — проверять живым кликом после деплоя.
- Совместимость: `/api/` и `/ws/` прокси на balloo.su НЕ удалять (compat для
  старых бандлей и desktop/mobile), удаление — отдельным батчем после приёмки.
- desktop/mobile env — завести в список на перевод (тик. №5), не блокирует №0.
- Деплой: pull → build web (VITE_API_URL меняется в образе) → up -d web server
  → smoke: login, getMe, ws 101, oauth клик, upload (client_max_body_size на
  api-вхосте есть).
- Критерии: в devtools все запросы с balloo.su идут на `api.balloo.su`;
  вход/WS/загрузка зелёные; probe basic-auth и UptimeRobot не сломаны;
  куки `balloo-access-token` привязаны к `api.balloo.su` и работают.

### Тикет №1 — `@balloo/ui` + починка темы russian + доки
- Создать пакет `packages/ui`: вынести Topbar/Footer/ThemeProvider/i18n/токены
  из `packages/web` (web начинает им пользоваться — визуальных изменений в
  мессенджере быть не должно).
- Починить тему `russian` в web по `mockups/assets/common.css` (сейчас в web
  она как вторая тёмная — пользователь).
- `docs/01`: заменить устаревший Next.js на React+Vite (заметка об
  историчности), добавить раздел «Поддомены (Вариант C)» с таблицей из §1.
- Критерии: `docker build -f Dockerfile.web .` OK; мессенджер собирается и
  выглядит как раньше; russian-блок совпадает с макетом (скриншот-сравнение);
  тема переключается на всех подключённых сайтах.

### Тикет №2 — `features.balloo.su`
- Новый пакет `packages/web-features` (собирается из корневой
  `Dockerfile.features` по образцу Dockerfile.web): список, карточка,
  создание, голосование, «мои предложения» (история + статус), вход через
  balloo.su (§3.2, белый список next). API — только `api.balloo.su`
  (`VITE_API_URL`, §3.3, тикет №0 уже выполнит перенос).
- Бэкенд: миграция `isAnonymous` на `FeatureRequest` (default true);
  при создании — выбор автора; **в админке отличия не показывать никак**;
  в голосовалке неанонимные — привлекательный вид (аватар+имя, бейдж).
  Голоса уже есть (`FeatureVote`) — не ломать.
- Критерии: анонимный вход/голос; вход с features → свои предложения со
  статусами; неанонимное предложение отображено привлекательно; в админке
  оба выглядят одинаково; тесты бэкенда зелёные.

### Тикет №3 — `admin.balloo.su` + `command.balloo.su`
- Выделить экраны `/admin` (18) и `/command` (13) в отдельные пакеты
  `packages/web-admin`, `packages/web-command` (Dockerfile.admin/.command).
- Гварды ролей — **серверная проверка роли на API-эндпоинтах** (уже есть
  частично — аудировать, что маршруты /api/admin* требуют роль), не только
  скрытие кнопок.
- На balloo.su маршруты → редирект на поддомены.
- Критерии: вход не-админа в admin.balloo.su показывает вход и не даёт
  данных; админ работает как сейчас на balloo.su/#/admin; то же для command.

### Тикет №4 — инфо-поддомены (download, history, docs, blog)
- Статические сайты на `@balloo/ui` (шапка/подвал/темы/i18n общие):
  `packages/web-download`, `packages/web-history`, `packages/web-docs`
  (Swagger UI по OpenAPI бэкенда), `packages/web-blog` (данные блога —
  через существующий API, без своей БД).
- Контент — из макетов (истина). i18n минимум для шапки/подвала/заголовков.
- Критерии: 4 сайта открываются, темы/языки работают, контент = макет.

### Тикет №5 — инфраструктура продa
- Батч-скрипты vhost'ов для 6 новых поддоменов + certbot (по образцу
  enable-probes.sh, по одному батчу на поддомен или один на тему vhost'ов —
  решает пользователь в начале тикета).
- compose: новые сервисы web-admin/web-command/web-features/web-info за
  портами web (или общий nginx с несколькими server_name — выбрать в начале
  тикета и записать в docs/01); `CORS_ORIGIN`-список (§3.3, если ещё не
  проставлен в №0); env API для desktop/mobile → `api.balloo.su`; коммит
  оптимизаций Dockerfile (уже готовы, ждут коммита).
- **После приёмки**: удалить compat-прокси `/api/` и `/ws/` с balloo.su
  (отдельный nginx-батч), когда убедимся, что desktop/mobile обновлены.
- Критерии: `docker compose ps` — все Up; каждый поддомен отдаёт HTTPS с
  валидным сертификатом; откат батча проверен dry-run'ом.

### Тикет №6 — приёмка владельцем на проде
- Владелец проверяет: 8 поддоменов + api.balloo.su (все запросы с любого
  сайта идут на api.balloo.su — видно в devtools Network), вход переносится,
  голосование + неанонимные, admin/command под ролями, шапка/подвал
  идентичны, 3 темы, 20 языков (хотя бы контрактные тексты), старые ссылки
  balloo.su/#/admin редиректят. Тесты зелёные. Замечания → правки в этом же
  тикете.

## 5. Известные факты о сервере (не переоткрывать)

- 16 ТБ диск виден как ~98 ГБ (RAID не размечен целиком), RAM 132 ГБ —
  **отдельная инфраструктурная задача, помечена в prod-тикете (этап 44)**.
- Сборки на проде долгие были из-за некешируемой pnpm-установки — починено
  (Dockerfile), ожидает коммита.
- P20–P26 задеплоены, приёмка P27 ждёт владельца.

## 6. Протокол выполнения

- Один тикет за раз: «Начинаю тикет №X» → чек-лист → «Тикет №X завершён».
- Смена планов — только по команде пользователя.
- Сервер: никаких SSH/команд от ассистента; только скрипты-батчи для
  пользователя, запуск и вывод — пользователем.
- После каждого тикета — фиксация в этот файл (статус + что сделано).

**Статусы:** №0 ✅ ЗАВЕРШЁН (2026-09-20: код `00cfa37`→`9eeaf4b` в origin, **задеплоен на проде, smoke `PASS=8 FAIL=0 SKIP=0`**, шлюз `172.19.0.1` цел; остаток — панели OAuth + живой вход, действие владельца) · №1 pending · №2 pending · №3 pending · №4 pending · №5 pending · №6 pending

**Итог тикета №0 (2026-09-20, ✅ в репо+origin `00cfa37`, не задеплоен).** Введена отдельная переменная `APP_URL` (origin фронтенда, один URL) — OAuth-возврат (`authController.oauthFrontendUrl`), ссылки писем (`emailService`), возврат платежей (`paymentService`) переведены с `CORS_ORIGIN` на `APP_URL`; CSP `connectSrc` в `security.ts` разбирает `CORS_ORIGIN`-список в массив + ws/wss (+ юнит-тест `csp-connect-src.test.ts`, 6/6). `docker/prod/.env.production`: `VITE_API_URL=https://api.balloo.su`, `CORS_ORIGIN` = список 8 origin'ов, добавлен `APP_URL=https://balloo.su`, все `*_REDIRECT_URI` → `https://api.balloo.su/api/auth/oauth/...`. `docker-compose.local.yml`: `APP_URL`/`CORS_ORIGIN` вынесены из общего якоря `x-common-variables` в env сервиса `server` (иначе их смена пересоздаёт контейнер PostgreSQL), дефолт build-арга `VITE_API_URL` → `api.balloo.su`; `Dockerfile.web` ARG → `api.balloo.su`. Синхронизированы `.env.production.example`, мастер self-install (`installService.ts`, +`APP_URL`, путь `mail`→`mailru`), `docs/04`, `docs/06`, `docs/07`, README, docs-примеры WS → `wss://api.balloo.su/ws/` (путь сервера `/ws/` со слэшем — старые примеры без слэша получали бы 400). Проверки: `tsc` web+server чисто; server jest 237/237 `--runInBand`; web vitest 155/155; локальная `vite build` с `VITE_API_URL=https://api.balloo.su` — в бандле ровно `https://api.balloo.su` (1 вхождение), старых `balloo.su/api` нет. Compat-прокси `/api/`+`/ws/` на balloo.su НЕ удалён. **Действие пользователя после деплоя: переставить Callback URL в панелях Яндекс/VK/Mail.ru на `https://api.balloo.su/api/auth/oauth/...`.**

**Решение 2026-09-18 (пользователь):** всё API — на отдельный поддомен
`api.balloo.su` (не `/api/` на balloo.su). Зафиксировано тикетом №0 и §3.3;
причина перехода из Вариант C-черновика: единая точка API освобождает каждый
новый сайт от своего `/api/`-прокси и делает куки/WS/OAuth-колбэки общими по
одному origin.
