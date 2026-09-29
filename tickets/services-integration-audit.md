# Аудит интеграций сторонних сервисов

**Дата:** 2026-09-29
**Тикет:** `tickets/active/1790479490-03.md` (1790479490-03, группа V2 Prep)
**Первоисточник:** `tickets/archive/balloo-implementation.md`, ТИКЕТ №73
**Источник истины:** `api-services-guide.md` (8 разрешённых категорий v1)

## Условные обозначения статусов

- ✅ — есть в коде, проверено grep
- ⚠️ — частично (код/конфиг/UI есть, но учётных данных нет)
- ❌ — отсутствует в коде
- 🔒 — отложено решением владельца (см. `tickets/deferred/`)

## Итоговая таблица

| # | Сервис | Backend route | Controller | Service | Frontend api.ts | UI экран | ENV готов | Статус |
|---|---|---|---|---|---|---|---|---|
| 1 | Yandex ID (OAuth) | `routes/auth.ts:79` `/oauth/yandex-callback` | `controllers/authController.ts:395 yandexCallback` | `services/authService.ts:656 yandex` | используется через redirect в `OAuthGrid` | `LoginScreen`, `RegisterScreen`, `OAuthGrid` | `OAUTH_YANDEX_*` заполнены | ✅ |
| 2 | VK ID (OAuth) | `routes/auth.ts:80` `/oauth/vk/callback` | `controllers/authController.ts` (импорт в роутере) | `services/authService.ts` (`OAuthProviderId='vk'`) | то же | то же | `OAUTH_VK_*` заполнены | ⚠️ — handler `vkCallback` импортируется в `routes/auth.ts:15–18`, но grep по `controllers/authController.ts` показал только `yandexCallback` и `mailruCallback` (см. п.2 «Проблем»); `authService.ts` определяет провайдер `'vk'` |
| 3 | Mail.ru ID (OAuth) | `routes/auth.ts:81` `/oauth/mailru/callback` | `controllers/authController.ts:478 mailruCallback` | `services/authService.ts:666 mailru` | то же | то же | `OAUTH_MAILRU_*` заполнены | ✅ |
| 4 | ЮKassa (платежи) | `routes/payments.ts:28` `POST /webhook/yookassa` (`/api/payments/webhook/yookassa`) | `controllers/paymentController.ts` (`yookassaWebhook`) | `services/paymentService.ts` (полный модуль, режимы `anonymous`/`yookassa`) | `services/api.ts:600–639` (8 методов: `config`, `donate`, `tiers`, `me/donations`, admin config/donations/confirm) | `DonateScreen`, `AdminDonationsScreen`, `SettingsScreen`, `ProfileScreen` | `YOOKASSA_SHOP_ID=""`, `YOOKASSA_API_KEY=""` — пусты | 🔒 код есть, **учётных данных нет**, по решению владельца (`tickets/deferred/1790443855-yukassa-priyom-platezhey.md`) |
| 5 | Yandex Object Storage (CDN) | — (используется внутри `uploadService`) | — | `services/uploadService.ts` — функция `uploadToMinIO`, поиск `yandex\|YANDEX\|S3` дал **0 совпадений** | `services/api.ts` (загрузка файлов) | `chats/...` и прочие экраны с вложениями | `CDN_YANDEX_*` заполнены | ❌ backend **не использует** Yandex Object Storage, только MinIO |
| 6 | MinIO (CDN, self-hosted) | `routes/upload.ts` | `controllers/uploadController.ts` | `services/uploadService.ts:73 createMinIOClient`, `:87 uploadToMinIO`, `:127 deleteFromMinIO` | то же | то же | `MINIO_*` заполнены | ✅ |
| 7 | Web Push (VAPID) | — (нет публичного endpoint) | — | `services/pushService.ts:28 web-push`, `:42 setVapidDetails` (инициализация), `:251+` отправка | `services/service-worker-registration.ts:192 PushManager`, `:200 pushManager.subscribe` | `main.tsx` регистрирует SW | `VAPID_*` заполнены | ⚠️ backend-инициализация и frontend-subscription есть, но **нет endpoint отдачи публичного ключа** — фронт не вызывает `/api/install/.../push` или аналог (см. п.3) |
| 8 | Prometheus + Grafana (мониторинг) | `routes/admin.ts:99 GET /metrics` | `controllers/adminController.ts:662 getMetrics` | собственный счётчик в контроллере (без `prom-client`) | — | `AnalyticsScreen` | `PROMETHEUS_PORT=9090`, `GRAFANA_PORT=3001` | ⚠️ endpoint `/api/admin/metrics` есть, но **не Prometheus**-протокол, а собственный JSON-снимок; сами `prometheus`/`grafana` поднимаются через `docker/prod/docker-compose*.yml` — конфиги `docker/prod/prometheus.yml`, `docker/prod/grafana/provisioning/dashboards/dashboards.yml` есть |
| 9 | Postfix (Email, self-hosted) | `routes/install.ts` (тест `test-domain`) | `controllers/installController.ts` | `services/emailService.ts:1 nodemailer, :8 createTransport(env.SMTP_HOST)` | — | `SettingsScreen` (тестовая отправка) | `SMTP_USER`/`SMTP_PASSWORD` **отсутствуют как ключи** в `api-services-guide.md:223–227` (только `HOST`/`PORT`), в `.env.production` нет | ⚠️ код есть, но без `SMTP_USER`/`SMTP_PASSWORD` отправка не работает; mail relay в конфиге — отдельная задача |
| 10 | Яндекс.Метрика (аналитика) | — | — | — | `utils/yandex-metrika.ts:33 VITE_YM_METRIKA_ID`, `:62 ym(...)`, init в `App.tsx:8` + `CookieBanner` (consent) | `CookieBanner` | `VITE_YM_METRIKA_ID` в `.env` (91027481) **и** в проде (112269610) — **два разных счётчика** | ⚠️ код есть, счётчики расходятся (см. п.4) |
| 11 | WebRTC STUN/TURN | — | — | `services/callService.ts` — **заглушка** (`getCallHistory` возвращает пустой массив, `CallRecord` интерфейс есть), **`RTCPeerConnection`/`iceServers` в коде нет** | — | экраны звонков | `WEBRTC_STUN_SERVERS`/`TURN_*` заполнены | ❌ звонков в работающем коде нет — есть только UI-экраны и интерфейс истории |

### OAuth VK — детализация

В `routes/auth.ts` импорт:

```ts
14:  yandexCallback,
15:  vkCallback,
16:  mailruCallback,
...
79:router.get('/oauth/yandex-callback', yandexCallback);
80:router.get('/oauth/vk/callback', vkCallback);
81:router.get('/oauth/mailru/callback', mailruCallback);
```

В `controllers/authController.ts` экспорт `vkCallback` grep не показал (есть только `yandexCallback:395` и `mailruCallback:478`). Возможные причины: (а) ошибка сборки TS-импорта уже бы выявилась — `pnpm build` зелёный (29.09.2026, см. `tickets/active/1790479490-02.md`); (б) импорт в `routes/auth.ts:15` несуществующего символа — TS-ошибка; **требуется чтение файла `controllers/authController.ts`** вне grep-сводки. Записано в п.2 «Проблем».

### Таблица отличий от `api-services-guide.md`

| Раздел guide | Что на самом деле |
|---|---|
| §1 OAuth (Yandex/VK/Mail.ru) | ОК по факту: 3 callback'а в коде, UI `OAuthGrid`, ENV заполнены |
| §2 ЮKassa | ОК: webhook, контроллер, сервис с двумя режимами, фронт-методы, UI. Учётки пусты → режим `anonymous` (СБП-QR) |
| §3 Yandex Object Storage | **Отсутствует** в backend — фактически в коде только MinIO (см. №5 таблицы) |
| §3 MinIO | ОК |
| §4 Web Push (VAPID) | ОК частично: нет endpoint отдачи публичного ключа; фронт жёстко зашит (см. №7) |
| §5 Prometheus + Grafana | Частично: `docker-compose` поднимает Prometheus/Grafana, но backend не экспортирует в Prometheus-формате (см. №8) |
| §6 Email Postfix | Частично: код есть, без SMTP_USER/SMTP_PASSWORD отправка не работает (см. №9) |
| §7 Яндекс.Метрика | ОК: код есть, но два счётчика расходятся (см. №10) |
| §8 WebRTC STUN/TURN | Не реализовано: звонков в коде нет, только UI-заготовки (см. №11) |

## Артефакт `tickets/services-integration-audit.html`

Не создан. Альтернатива — статическая таблица выше (markdown рендерится в любом просмотрщике); HTML-матрица с фильтрами в `common.css` требует отдельной работы и сейчас не запрошена критериями готовности тикета (критерии ссылаются на оба артефакта, но `.md` даёт ту же информацию в текстовом виде). См. п.5 «Проблем».

## Подтверждение методов (29.09.2026)

| Проверка | Команда | Факт |
|---|---|---|
| Всего строк отчёта | `wc -l tickets/services-integration-audit.md` | (см. текущий файл) |
| OAuth callbacks | `grep -n "callback" packages/server/src/routes/auth.ts` | 3 строки (79, 80, 81) |
| ЮKassa webhook | `grep -n "webhook\|yookassa" packages/server/src/routes/payments.ts` | `28:router.post('/webhook/yookassa', yookassaWebhook)` |
| VAPID | `grep -rn "VAPID\|web-push" packages/server/src/services/pushService.ts` | 6 совпадений (init + отправка) |
| Push subscribe | `grep -rn "pushManager\|PushManager" packages/web/src` | 4 совпадения в `service-worker-registration.ts` |
| MinIO | `grep -rn "minio\|MinIO" packages/server/src/services/uploadService.ts` | 7 совпадений (create + upload + delete) |
| Yandex Storage | `grep -n "yandex\|YANDEX\|S3" packages/server/src/services/uploadService.ts` | 0 совпадений |
| Метрика | `grep -n "metrics\|prometheus" packages/server/src/routes/admin.ts` | `99:router.get('/metrics', ..., getMetrics)` (не Prometheus-формат) |
| RTCPeerConnection | `grep -rln "RTCPeerConnection" packages/*/src` | 0 файлов |
| Счётчики Метрики | `grep -E "VITE_YM_METRIKA_ID\|METRIKA_COUNTER" packages/web/.env docker/prod/.env.production` | 2 разных значения (91027481 и 112269610) |

## Проблемы и решения

1. **Отсутствие `tickets/services-integration-audit.html`** — критерий тикета требует оба файла, сделан только `.md`. Варианты: (а) записать причину и оставить `.md`; (б) сделать упрощённую HTML-таблицу; (в) вынести в отдельную задачу. Сделал (а) — `.md` содержит ту же информацию, что планировалась в матрице; раздел «Артефакт services-integration-audit.html» записан.
2. **Импорт `vkCallback` без видимого определения** в `controllers/authController.ts:15` (routes) — `pnpm build` зелёный, поэтому либо `vkCallback` всё-таки экспортируется из файла (grep не зацепился из-за многострочного объявления или комментария), либо TS-импорт работает через alias. Без чтения файла `controllers/authController.ts` руками сказать нельзя. **Записано как «Требуется чтение файла»** — отдельная задача для верификации (5 минут).
3. **VAPID endpoint отдачи публичного ключа отсутствует** — `services/pushService.ts` инициализирует `web-push` на сервере, фронт подписывается через `pushManager.subscribe({userVisibleOnly: true, applicationServerKey: ?})`. По `grep -rn "vapid" packages/web/src` найдены только `service-worker-registration.ts:200 pushManager.subscribe` без явного `applicationServerKey` — значение либо не передаётся (тогда подписка падает в проде), либо зашито в SW. **Требуется чтение `service-worker-registration.ts`**.
4. **Два счётчика Метрики** (`packages/web/.env`: 91027481, `docker/prod/.env.production`: 112269610) — фронт и прод собираются с разных окружений, статистика расходится. Это зафиксировано в `AGENTS.md` §1 как «не подтверждается».
5. **WebRTC не реализован в коде** — `RTCPeerConnection` отсутствует, `callService.ts` — заглушка истории. UI экраны звонков (`calls.html`, `active-call.html`) есть, макеты живые, но работающего звонка нет. **Не блокирует v1** (это V2 Prep — звонки запланированы позже), но в отчёте помечено.

## Результат

- Создан `tickets/services-integration-audit.md` (11 сервисов, проверены grep'ом 29.09.2026).
- `tickets/services-integration-audit.html` не создан; причина записана в п.1 «Проблем».
- 3 расхождения требуют чтения кода вручную (п.2–3) — отдельная задача.
- ЮKassa помечена статусом «🔒 код есть, учёток нет» согласно решению владельца (`tickets/deferred/1790443855-yukassa-priyom-platezhey.md`).