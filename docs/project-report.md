# 📊 Проект Balloo — Сводная статистика

> **Сгенерировано: 30 сентября 2026** (данные сняты командами этого дня,
> перечень команд — в конце отчёта и в `.check/report-stats-1790757617.log`)
> Статус: Фаза 3 — Разработка завершена; прод `balloo.su` работает (P37-1 принят
> выводом сервера 25.09); релизный тег `v1.0.0` **не ставился** (решение владельца
> 29.09 — тег только перед деплоем).

---

## 📦 Общая сводка

| Параметр | Значение | Как снято |
|---|---|---|
| **Файлов в репо** (без node_modules/.git) | **2 542** | `find . -type f … \| wc -l` |
| **Трекается в git** | **1 268** | `git ls-files \| wc -l` |
| **Коммитов** | **143** (HEAD `6565a12`, 2026-09-30) | `git rev-list --count HEAD` |
| **Строк кода packages/** (ts+tsx+css+sql+json+js+sh+yml, без dist/release) | **≈ 91 405** | `wc -l` по расширениям |
| Строк TS/TSX только | **85 685** | см. лог |
| **Версия** | v1.0.0 (тег в git отсутствует) | `git tag -l 'v*'` → пусто |
| **Тесты зелёные** | **539** (shared 76 + server 259 + web 204) | `pnpm test`, 30.09 |

Размер каталогов (`du -sh`, без node_modules): `mockups/` 4,7 МБ · `packages/` 1,2 ГБ
(с артефактами сборки) · `scripts/` 57 МБ · `tickets/` 3,8 МБ · `docs/` 696 КБ ·
`docker/` 240 КБ · `assets/` 608 КБ · `tmp/` 2,0 МБ · `deploy/` 16 КБ.

Типы файлов (топ-10, без node_modules): map 340 · md 337 · html 324 · js 322 ·
ts 321 · png 287 · tsx 242 · pak 116 · json 45 · sh 19.

---

## 📁 Структура проекта

| Каталог | Размер | Содержимое |
|---|---|---|
| **mockups/** | 4,7 МБ | Макеты экранов — единственный источник правды |
| **packages/** | 1,2 ГБ | Код монорепо (web, server, shared, ui, desktop, mobile-android, mobile-ios) |
| **scripts/** | 57 МБ | Скрипты аудита/генерации (со своими node_modules) |
| **tickets/** | 3,8 МБ | Тикеты: active / Done / deferred / archive |
| **docs/** | 696 КБ | Документация проекта |
| **docker/** | 240 КБ | Docker-инфраструктура прод-стека |
| **assets/** | 608 КБ | Логотипы, ресурсы |
| **deploy/** | 16 КБ | deploy-скрипты (balloo-deploy.sh) |

---

## 🎨 Макеты (mockups/) — 12 узлов

Снято `ls mockups/<узел>/*.html | wc -l` и `du -sh`, 30.09.2026:

| Узел | HTML | MD | Размер |
|---|---|---|---|
| **balloo-su** (у_01) | 41 | 41 | 832 КБ |
| **admin-balloo-su** (у_02) | 26 | 26 | 412 КБ |
| **command-balloo-su** (у_03) | 26 | 26 | 468 КБ |
| **mobile** (у_08) | 24 | 24 | 512 КБ |
| **desktop** (у_09) | 23 | 22 | 552 КБ |
| **specifity-balloo-su** (у_10) | 7 | 7 | 200 КБ |
| **features-balloo-su** (у_04) | 5 | 5 | 68 КБ |
| **blog-balloo-su** (у_11) | 6 | 6 | 88 КБ |
| **shared** (у_00) | 9 | 8 | 108 КБ |
| **history-balloo-su** (у_05) | 3 | 3 | 40 КБ |
| **download-balloo-su** (у_06) | 2 | 2 | 28 КБ |
| **docs-balloo-su** (у_07) | 1 | 1 | 24 КБ |
| assets/ + components/ (не экраны) | — | — | 720 КБ |

### Статусы экранов (`mockups/index_ecrans.json`, 30.09.2026)

| Показатель | Значение |
|---|---|
| `total_screens` (верхнее поле) | 174 |
| Сумма записей по узлам | 172 (у_00 8 + у_01 41 + у_02 25 + у_03 26 + у_04 6 + у_05 3 + у_06 2 + у_07 1 + у_08 24 + у_09 23 + у_10 7 + у_11 6) |
| Статусы | **Просмотрен 79 · Принят 92 · Реализован 1** |
| `screens_unviewed` (верхнее поле) | 0 — **противоречит** факту 79 «Просмотрен» |

⚠️ Расхождение счётчиков реестра (174 ≠ 172, `screens_unviewed 0` ≠ 79) —
зафиксировано в `Done/2026-09-28/1790596191.md` п.4 и в тикетах
`1790479162-1..4`; ревизия счётчиков — отдельная задача.

---

## 💻 Исходный код (packages/)

Снято `find packages/*/src -type f | wc -l` и `wc -l` по расширениям (без
dist/coverage/release/.expo/android-обёрток):

| Пакет | Файлов src | Строк кода |
|---|---|---|
| **web** | 225 | 48 057 |
| **server** | 112 | 22 913 |
| **mobile-android** | 31 | 6 389 |
| **shared** | 17 | 3 764 |
| **desktop** | 25 | 2 440 |
| **ui** | 13 | 1 014 |
| **mobile-ios** | 0 | — (заготовка) |

### Строки по языкам (packages/, чистые, без артефактов)

| Язык | Строк |
|---|---|
| TypeScript React (`.tsx`) | 52 919 |
| TypeScript (`.ts`) | 32 766 |
| CSS | 3 045 |
| SQL (миграции) | 1 335 |
| JSON | 644 |
| JavaScript (`.js`) | 383 |
| Shell | 219 |
| YAML | 94 |
| **Итого** | **≈ 91 405** |

### Тесты (прогон `pnpm test` 30.09.2026)

| Пакет | Файлов тестов | Тестов |
|---|---|---|
| shared (vitest) | 4 | **76** |
| server (jest) | 21 | **259** |
| web (vitest) | 20 | **204** |
| **Итого** | **45** | **539 зелёных** |

---

## 🎫 Тикеты (tickets/)

| Раздел | Файлов .md | Примечание |
|---|---|---|
| `active/` | **29** | включая реестр `ВОПРОСЫ_ВЛАДЕЛЬЦУ.md` (118 вопросов, пересобран 30.09) |
| `Done/` | **25** | по датам 2026-07-19…2026-09-30 |
| `deferred/` | **8** | с триггерами (Хабр, Android, i18n и др.) |
| `archive/` | — | архивные мультитикеты и каталоги |

Артефакты: `catalog.md`, `code-audit-report.md`, `services-integration-audit.md`,
`screens-audit.{html,json}`, `screens-questionnaire.md`, `api-keys-checklist.md`,
`api-keys-questionnaire.md`, промо-буклеты v2 (html/pdf), реестры статусов.

---

## 📚 Документация (docs/)

| Файл | Тема |
|---|---|
| `00-master-build-guide.md` | Сборка монорепо |
| `01-architecture-decisions.md` | Архитектурные решения |
| `02-requirements-checklist.md` | Чеклист требований |
| `03-database-schema.md` | Схема БД (Prisma, 81 таблица / 24 группы) |
| `04-api-websocket-spec.md` | Спецификация API/WebSocket (200 маршрутов) |
| `05-frontend-spec.md` | Фронтенд-спецификация |
| `06-devops-infrastructure.md` | DevOps-инфраструктура |
| `07-ai-instructions-kodacode.md`, `07-nodes-guide-human.md`, `07-server-setup-guide.md` | Гайды по узлам, инструкции AI, setup сервера |
| `08-nodes-guide-ai.md`, `08-v2-roadmap.md` | Гайд узлов AI, роадмап v2 |
| `09-clients-guide.md` + `.pdf` | Гайд клиентов |
| `10-operations-manual.md`, `11-release-process.md`, `12-security-audit.md` | **создаются тикетом `1790479920-03`** |
| `security-audit.md` | Аудит безопасности (30.07, переносится под №12) |
| `v2-features-catalog.md` | Каталог фич v2 |
| `api-keys/` | Инструкции по ключам внешних сервисов |
| `issues/` | Известные проблемы |
| `project-report.{md,html,pdf}` | Этот отчёт |

---

## 🐳 Docker (docker/)

`prod/docker-compose.local.yml` + `.env.production` — стек `balloo-web`
(127.0.0.1:8090→80), `balloo-server` (127.0.0.1:3100), `balloo-postgres`,
`balloo-redis`, `balloo-minio`; `Dockerfile.web` / `Dockerfile.server` в `docker/`;
сеть `balloo-net` = SMTP-релей postfix (не пересоздавать).

---

## 🚦 Статус проекта

| Параметр | Значение |
|---|---|
| **Фаза** | 3 — Разработка завершена; прод работает |
| **Прод** | `balloo.su` + `api.balloo.su` — P37-1 подтверждён выводом сервера 25.09; P38 готов, ждёт команды «Деплой» |
| **Коммитов** | 143 (первый — 14.08.2026) |
| **Тикетов** | active 29 · Done 25 · deferred 8 |
| **Узлов** | 12 + shared |
| **Экранов в реестре** | 172 записи (поле `total_screens` = 174, см. расхождение выше) |
| **Строк кода** | ≈ 91 405 (packages/, без артефактов) |
| **Тестов** | 539 зелёных |
| **Тем** | 3 (dark, light, russian) |
| **Языков** | 20 (3 группы: русские, дружественные, остальные) |
| **Тег релиза** | отсутствует (решение 29.09: ставить только перед деплоем) |

---

## 📈 Команды, которыми сняты цифры (воспроизводимость)

```
find . -type f -not -path '*/node_modules/*' -not -path './.git/*' | wc -l   # 2542
git rev-list --count HEAD; git log -1 --format='%h %ad'; git ls-files | wc -l
du -sh */ ; find … | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20
python3 (mockups/index_ecrans.json → total_screens, статусы по узлам)
for p in packages/*/  → find src -type f | wc -l ; wc -l по расширениям
pnpm test  → shared 76 / server 259 / web 204
```

Полный лог: `.check/report-stats-1790757617.log` (65 строк) и
`.check/test-counts-1790757617.log`. Повторный прогон тех же команд должен
воспроизвести числа в пределах суток.

---

*Отчёт пересобран 2026-09-30 по тикету `1790479490-11`; предыдущая версия — от 31.07.2026.*