# Тикет 1795678493 — Деплой: продолжение (фикс чата-сироты + приёмка H + CSP)

**Создан:** 26.11.2026
**Источник:** владелец (чат 26.11.2026): «пуш и деплой… в первом батче»; «запиши продолжение деплоя в активные задачи»
**Предыстория:** батчи C→G выполнены 26.11.2026 частично (см. «Что уже сделано»).

## Что уже сделано 26.11.2026 (доказано выводом сервера)

| Шаг | Результат |
|---|---|
| Коммит + пуш `353cca5` | `3846007..353cca5 main -> main` ✓ |
| Бэкап БД | `pg_dump` → `/data/balloo/backups/LATEST.sql` ✓ |
| `git checkout -B main origin/main` | `HEAD=353cca5` ✓ (со 2-й попытки — 1-ю заблокировал пустой `scripts/assign-superadmin.cjs`) |
| Сборка `server` + `web` | шаги `COPY packages/web/` и `vite build` — НЕ CACHED ✓ |
| `up -d --no-deps --force-recreate server web` | `balloo-server Healthy`, `balloo-web Started` ✓ |
| Бандль web | `index-ButcXBhZ.js` (был `index-C7z_n3XL.js`) ✓ |
| Сборка + пересоздание `web-admin` | бандль `index-CPA2O_Mn.js` ✓ |
| Суперадмин (требование «в первом батче») | `o8eryuhtin` → `role=superadmin` ✓; UserChat в чат «Балу — новости и информация» (`cmwq9m7sv000gug9nwz3w57dy`) → `role=admin` ✓ |
| Коды доменов | `balloo.su` → 200, `admin.balloo.su` → 200 ✓ |
| Миграции | «No pending migrations to apply» (22→22) ✓ |

## Остаток (этот тикет)

### R1. Не задеплоен фикс чата-сироты (правки готовы, локально зелёные)

**Диагноз (воспроизведён тестом):** `createChat(type:'direct')` и `callService`
искали существующий direct-чат через `members: { every: { userId: { in: [...] } } }`.
Для чата с 0 участниками (сирота после уборки, `cmwq6ui45000df5fa5tmt4xtr`) условие
истинно vacuously → сервер возвращал id сироты → клиент без membership:
`GET /api/chats/:id` → 404, `POST .../messages` → 403 «Вы не являетесь участником»
(ровно это владелец видел в консоли).

**Исправлено локально (не коммичено):**
- `packages/server/src/services/chatService.ts` — поиск через `AND [some ownerId, some peerId]` + проверка `members.length === 2`;
- `packages/server/src/services/callService.ts` — то же;
- `packages/server/src/__tests__/direct-chat.test.ts` — регресс «не переиспользует direct-чат-сироту»: на старом коде **падает** (проверено: `Expected: not "cmwx7cmdx…"`, 1 failed), на новом — зелёный.

**Префлайт:** jest server **806/54** (было 805 + новый тест), vitest web 404/54, shared 76/4, web-admin 36/4.

**Что сделать:** коммит → пуш → пересборка **только `server`** (web/web-admin не
менялись) → доказательства.

### R2. Приёмка H владельцем (браузер) — блокирует закрытие

**Обязательная подготовка (иначе браузер покажет старый бандль — это уже
трёхкратная причина «не работает»):** DevTools → Application → Service
Workers → **Unregister** → Application → Storage → **Clear site data** →
**Ctrl+Shift+R**.

Чек-лист (расширение свода A1–A22 в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`):

| № | Что | Ожидаем |
|---|---|---|
| N1 | Клик по контакту / «Написать» | создаётся/открывается direct-чат, сообщения отправляются (после R1 — без 404/403) |
| N2 | Админка `admin.balloo.su` | вход под `o8eryuhtin` проходит (сервер отдаёт `isAdmin: true` для superadmin); **выйти и войти заново** |
| N3 | Панель вложений | пункт «📝 Текст» → модалка заметки (замечание владельца: это НЕ то «текстовое вложение», что имелось в виду — см. тик. `1795677071`) |
| N4 | Кнопка 🖼 | открывает панель вложений, multiple фото |
| N5 | Тема «Русская» | градиент виден, фон не чёрный |
| N6 | Счётчики чатов | непрочитанные + последнее сообщение вместо «Нет сообщений» |
| N7 | Онлайн-статус | зелёная точка только у реальных online |
| N8 | Опрос | `/chat/:id/poll` → форма создания, а не «Опрос не найден» |
| N9 | Голосовое при запрещённом микрофоне | понятное сообщение вместо «Permission denied» |

### R3. Консоль прода: CSP (правит владелец на хостовом nginx — C6 расширяется)

Замер 26.11.2026 (консоль браузера владельца):

| Ошибка | Причина | Куда |
|---|---|---|
| `connect-src` блокирует `https://fonts.googleapis.com/css2?family=Inter…` | хостовый CSP не содержит `fonts.googleapis.com`/`fonts.gstatic.com` в `connect-src`/`style-src`/`font-src` | `/etc/nginx/sites-enabled/balloo-docker.conf` + синхронно `docker/prod/nginx/balloo-docker.conf` |
| `connect-src` блокирует `https://avatars.yandex.net/…` | OAuth-аватар с внешнего CDN | там же (`img-src`/`connect-src`) |
| `frame-src 'none'` блокирует `mc.yandex.ru` | уже зафиксировано как C6 (тик. 1795357403) | там же: `frame-src 'self' https://mc.yandex.ru` |
| `GET /api/chats/cmwq6ui45…` → 404 | чат-сирота в БД; код-фикс (R1) предотвращает повторное использование, саму запись удалить: `DELETE FROM chats WHERE id='cmwq6ui45000df5fa5tmt4xtr'` (каскад на user_chats) | сервер, порядок: сначала R1-деплой, потом удаление |

После правки nginx: `sudo nginx -t && sudo systemctl reload nginx`,
проверка `curl -sI https://balloo.su | grep -i content-security` — CSP обязан
быть **не строже** контейнерного (браузер применяет все заголовки, см. тик. 1793187702).

### R4. Мелкое хвостовое (не блокирует)

- На сервере остался артефакт прошлого прогона: `scripts/assign-superadmin.cjs` в рабочем дереве был пустым (пересоздан из HEAD — ок); `docker/prod/.env.production` в `git status` помечен `M` — **не коммитить** (секретный, правка локальная на сервере).
- Откатный тег `deploy-rollback-353cca5` создан на старом HEAD (до fetch) — при следующем деплое создавать заново после `git fetch`.

### R0. Расширение объёма 26.11.2026 (второй заход)

После первого батча (R1) на проде осталось 353cca5. До этого было несколько
следующих коммитов (уведомления, баланс, морзе-тикер, i18n, QR, билеты).
Владелец запросил «пуш+депой того, что есть».

**Всё в рабочей копии (52 записи, 32 модифицированы + 20 новых):**

| Пакет | Что |
|---|---|
| shared | миграция `20261126120000_user_balance_points` (+balancePoints), i18n plural, constants/points |
| server | сервис уведомлений, роут, тесты, фикс чата-сироты |
| web | уведомления (bell, presence), баланс-экран, QR на download, router |
| ui | FooterMorseTicker, balance в RightMenu, css chrome, ecosystem, locale/morse |
| tickets | 5 активных тикетов (attachments, morse-ticker, deploy-continuation, i18n, nodes, balance) |
| docs | 05-frontend-spec, AGENTS.md, server_routes.txt |

**Миграция:** `ALTER TABLE "users" ADD COLUMN "balancePoints" INTEGER DEFAULT 0`
+ `UPDATE users SET balancePoints=555 WHERE balancePoints=0` (аддитивная).
**Бэкап при деплое обязателен** (первая миграция с UPDATE данных).

**Коммит:** `4f85330 feat(web,server,shared,ui): уведомления, баланс баллов, морзе-тикер, i18n без хардкода, QR загрузок`
**Пуш:** `353cca5..4f85330  main -> main` ✓ (26.11.2026)
**Компиляция (не тесты):** `tsc --noEmit` shared/server/web → exit 0 у всех трёх.

**Затронутые образы:** `server` (routes/services), `web`, `web-admin`, `web-features`,
`web-history`, `web-download` — все SPA зависят от `@balloo/ui` (Footer/RightMenu/chrome.css).
Сборка идёт из общего builder-стейджа `docker/Dockerfile.web`, поэтому все 4 SPA
пересобираются одной командой.

## Порядок выполнения (батчи)

1. **E4:** коммит (фикс + тикеты + docs) → `git push origin main` — *по команде владельца «Деплой»*.
2. **F4:** `cd /data/balloo/repo && git fetch origin && git checkout -B main origin/main` → `docker compose -f docker/prod/docker-compose.local.yml --env-file .env.production build server && … up -d --no-deps --force-recreate server` (из корня репо; web не трогать).
3. **G4:** доказательства — `git log -1`, `docker compose ps`, `logs --tail=30 server`, тест прямо на проде (POST /api/chats direct после создания сироты — опционально), коды 200.
4. **H4:** приёмка владельцем по чек-листу N1–N9 (после Unregister SW!).
5. **R3:** владелец правит хостовый CSP (C6 + fonts + avatars) — отдельным батчем.

## Критерии готовности

- [ ] Фикс чата-сироты на проде (коммит виден в `git log` сервера, сервер пересобран).
- [ ] N1–N9 приняты владельцем в браузере.
- [ ] Консоль прода без CSP-ошибок (после R3).
- [ ] Чат-сирота удалён из БД.
- [ ] Тикет перенесён в `Done/<дата>/`, свод владельца обновлён.

## Результат

_(заполняется по ходу)_
