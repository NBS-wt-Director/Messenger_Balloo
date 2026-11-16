# Тикет 1792061164 — Задел варианта А для новых поддоменов

**Создан:** 15.10.2026 (unix 1792061164)
**Статус:** активен (возвращён из `deferred/` 16.11.2026 решением владельца, п.6
отчёта 16.11: «все по ошибке отложенные вернуть в активные»)
**Отложен:** 17.10.2026 (unix 1792260001) — отсрочка снята 16.11.2026
**Причина (снимается решением 16.11):** вне MVP1
**Границы после решения п.5 от 16.11:** задел для `history` (у_05) и `download`
(у_06) — в работе, они в составе MVP1; задел для `features`/`docs`/`specifity`/
`blog` — **не выполнять**, эти узлы отложены решением владельца 16.11.2026
**Источник:** перенос из удалённого реестра, решение В-109

## Цель

Задел варианта А (отдельный контейнер + порт на каждый поддомен) для новых поддоменов: features, history, download, docs, specifity, blog.

## Подзадачи (не выполнены)

- [x] 1. Шаблон env-файла на сервис.
      **Сделано 16.11:** `WEB_HISTORY_HOST_PORT=8093`, `WEB_DOWNLOAD_HOST_PORT=8094` в `.env.production`.
- [x] 2. Шаблон compose-сервиса (SPA-контейнер + порт + health-check).
      **Сделано:** `web-history` и `web-download` в `docker-compose.local.yml`
      (target: web_history/web_download из Dockerfile.web, порты 8093/8094,
      depends_on: server healthy).
- [x] 3. Шаблон vhost nginx.
      **Сделано:** `upstream history_backend` + vhost `history.balloo.su`;
      `upstream download_backend` + vhost `download.balloo.su` (с /downloads/ proxy).
- [x] 4. Проверить, что переход app/admin/command на вариант А не требует переписывания.
      **Подтверждено:** admin уже работает по варианту А (порт 8092, upstream, vhost);
      app/command отдают тот же SPA (web:8090) — переход не ломает их.

## Почему отложено

MVP1 = `balloo.su` + `api.balloo.su` + `history.balloo.su` + `download.balloo.su` + desktop + Android.
Features, docs, blog, specifity — вне MVP1.

## Триггер для возвращения в active

Решение владельца о приоритете варианта А после деплоя MVP1.
