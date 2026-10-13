# 1791924413 — MVP1: подготовить with_lord, скоммитить и запушить на GitHub

**Создан:** 13.10.2026 (unix 1791924413)
**Статус:** в работе
**Кто:** Ksyusha

## Цель
1. Переименовать `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` → `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`
2. Упорядочить содержимое по 4 блокам: до-деплой → деплой → тест → прочее
3. Добавить команды запуска DB seed в секцию деплоя
4. Закоммитить все изменения и запушить на GitHub
5. Таблица доменов из документации

## Подзадачи

- [x] 1. Прочитать текущий `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` и `1791865100-restore-logos-qr.md`
- [x] 2. Переписать файл по 4 блокам, переименовать в `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` — `git mv`, содержимое: Блок 1 блокираторы → Блок 2 деплой → Блок 3 приёмка → Блок 4 остальное
- [x] 3. Добавить секцию 2.4 DB Seed с командами запуска на сервере (entrypoint `RUN_SEED=1`, `docker compose logs`, SQL-счётчики)
- [x] 4. Обновить ссылки: AGENTS.md, README.md, PROJECT_DOCUMENTATION.md, `scripts/rebuild-with-lord-screens-section.py`, `tickets/active/*` (grep «СДЕЛАТ_ВЛАДЕЛЬЦУ» вне Done/archive → 0)
- [x] 5. `git push origin main` → `7a44809..7f050ad  main -> main` (github.com:NBS-wt-Director/Messenger_Balloo.git)
- [x] 6. Таблица доменов — ниже
- [x] 7. Закрыт переносом в `Done/2026-10-14/`

## Результат

Коммит `7f050ad` запушен на GitHub (75 файлов, +2441/−1149).

### Таблица доменов (документация + конфиги, снимок 14.10.2026)

| Домен | Назначение | Узел | Статус в коде | Статус DNS/TLS |
|---|---|---|---|---|
| `balloo.su` | Основной мессенджер (SPA) | у_01 | `packages/web` | боевой, TLS ок |
| `api.balloo.su` | Единый API + WS (REST `/api/...`, `wss://.../ws/`) | — | `packages/server` | боевой, TLS ок |
| `app.balloo.su` | Алиас фронта (compat) | у_01 | тот же SPA, `server_name` в nginx | в certbot-списке |
| `admin.balloo.su` | Админ-панель | у_02 | раздел в `packages/web` (вынос в пакет — deferred) | в certbot-списке |
| `command.balloo.su` | Портал сотрудников | у_03 | раздел в `packages/web` (deferred) | в certbot-списке |
| `features.balloo.su` | Фич-реквесты | у_04 | `packages/web-features` (отдельное SPA) | **DNS и TLS не настроены** (with_lord 2.2) |
| `history.balloo.su` | История версий | у_05 | `HistoryScreen` в `packages/web` | **TLS не покрывает** (with_lord 1.4) |
| `download.balloo.su` | Загрузки | у_06 | `DownloadScreen` в `packages/web` | **TLS не покрывает** (with_lord 1.4) |
| `docs.balloo.su` | API-документация | у_07 | `DocsScreen` в `packages/web` | в certbot-списке |
| `blog.balloo.su` | Корпоративный блог | у_11 | `blog-landing` в `packages/web` | в certbot-списке |
| `cdn.balloo.su` | Раздача медиа (MinIO `balloo-media`) | — | `CDN_BASE_URL` в `.env.production` | **блок nginx и DNS отсутствуют** (with_lord 2.3) |
| `specifity.balloo.su` | Спецификация | у_10 | макеты (узел принят), код не требуется | не планировался к развёртыванию |
| `staging.balloo.su` | staging (упоминается в nginx-production.conf) | — | `server_name` в конфиге | не используется |
| `alpha.balloo.su` | Фронтовая альфа (ADR, `docs/06` §) | — | CN текущего сертификата | сертификат выпущен |

Cookie-зона: `COOKIE_DOMAIN=.balloo.su` (refresh-кука видна всем поддоменам,
`docs/14` §). Все клиенты ходят в `https://api.balloo.su/api/...`
(`VITE_API_URL` запечён в бандль).
