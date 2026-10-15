# Тикет 1792082800 — TLS поддоменов + исправление IP сервера

**Создан:** 2026-10-15 (unix 1792082800)
**Статус:** готов
**Источник:** решение 1.4.1/1.4.2 из `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`, подтверждение IP 15.10.2026

## Цель

1. Исправить SSL-ошибку на `history.balloo.su` и `download.balloo.su` (чужой сертификат `alpha.balloo.su`).
2. Добавить `cdn.balloo.su` в SAN сертификата.
3. Добавить nginx-блок для SPA-поддоменов (history, download, admin, command, blog, docs).
4. Исправить все упоминания неправильного IP `188.76.243.185` на реальный `188.73.176.34`.

## Подзадачи

- [x] 1. `sudo systemctl stop nginx && sudo certbot certonly --standalone --cert-name balloo.su-0001 --non-interactive -d balloo.su -d app.balloo.su -d api.balloo.su -d admin.balloo.su -d command.balloo.su -d blog.balloo.su -d docs.balloo.su -d download.balloo.su -d history.balloo.su -d cdn.balloo.su` → `Successfully received certificate`
- [x] 2. `sudo systemctl start nginx` → nginx запущен
- [x] 3. Добавить nginx-блок для SPA-поддоменов в `balloo-docker.conf` (heredoc) → `nginx -t` зелёный
- [x] 4. `sudo systemctl reload nginx` → reload успешен
- [x] 5. Проверка: `curl -I https://history.balloo.su` → `HTTP/2 200` ✅; `curl -I https://download.balloo.su` → `HTTP/2 200` ✅
- [x] 6. Проверка: `curl -I https://cdn.balloo.su` → `HTTP/2 502` (MinIO не поднят, SSL прошёл ✅)
- [x] 7. Исправить IP в AGENTS.md — добавить подтверждённый `188.73.176.34`
- [x] 8. Исправить IP в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` — SPF: `188.73.176.34` НАШ, не чужой
- [x] 9. Исправить IP в `docs/15-domains.md` — `188.73.176.34` везде
- [x] 10. Исправить IP в `docs/10-operations-manual.md` — SSH адрес

## Критерии готовности

- `history.balloo.su` и `download.balloo.su` → `HTTP/2 200` без SSL-ошибок ✅
- `cdn.balloo.su` → `HTTP/2 502` (SSL прошёл, 502 = MinIO не проброшен на хост — отдельная задача) ✅
- Все файлы с `188.76.243.185` исправлены ✅ (grep → 0 совпадений вне архива)

## Проблемы и решения

**Проблема 1:** `history`/`download` отдавали чужой сертификат `alpha.balloo.su`
**Причина:** в хостовом nginx `balloo-docker.conf` не было ни одного блока `server_name history.balloo.su download.balloo.su ...` — запросы падали на дефолтный сервер (первый по алфавиту в `sites-enabled`), это `alpha.balloo.su`.
**Решение:** добавлен nginx-блок с `server_name` для всех SPA-поддоменов.

**Проблема 2:** Неправильный IP `188.76.243.185` во всех документах
**Причина:** ошибка при первой прогонке — перепутали с IP Beget (DNS-хостинг).
**Решение:** `curl ifconfig.me` на сервере → `188.73.176.34`. Исправлены все файлы, SPF-инструкция переписана: `188.73.176.34` — НАШ IP, не чужой.

**Проблема 3:** Certbot ругался `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xd0`
**Причина:** locale сервера не поддерживает UTF-8 для Python (в котором написан certbot).
**Решение:** `sudo LC_ALL=C.UTF-8 certbot ...` + `--non-interactive`.

**Проблема 4:** Сертификат получен в `balloo.su-0001`, а не `balloo.su`
**Причина:** первый запуск certbot создал новый сертификат (имя `balloo.su-0001`) вместо обновления старого `balloo.su`.
**Решение:** обновлены пути в `balloo-docker.conf` на `balloo.su-0001` и в CDN-блоке.

## Результат

### TLS поддомены
```
$ curl -I https://history.balloo.su
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)

$ curl -I https://download.balloo.su
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)

$ curl -I https://cdn.balloo.su
HTTP/2 502
server: nginx/1.24.0 (Ubuntu)
# SSL прошёл, 502 = MinIO не проброшен на хост (port 9000 не в compose ports)
```

### IP исправления
```
$ grep -rn "188\.76\.243\.185" --include="*.md" --include="*.ts" --include="*.sh" . 2>/dev/null | grep -v node_modules | grep -v tickets/archive/ | grep -v tickets/Done/
(0 совпадений)
```

### Изменённые файлы (4)
- `AGENTS.md` — добавлена строка с IP сервера и DNS всех поддоменов
- `docs/15-domains.md` — `188.76.243.185` → `188.73.176.34` (2 строки)
- `docs/10-operations-manual.md` — SSH адрес исправлен
- `tickets/active/with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` — SPF-инструкция переписана: `188.73.176.34` — НАШ IP
