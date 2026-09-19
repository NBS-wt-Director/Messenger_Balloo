# deploy/ — автозапуск прод-стека

Здесь версионируются два файла, которые на сервере живут вне репозитория:

| Файл в git | Место на сервере |
|---|---|
| `deploy/balloo.service` | `/etc/systemd/system/balloo.service` |
| `deploy/balloo-deploy.sh` | `/usr/local/bin/balloo-deploy.sh` |

До появления этой папки оба файла существовали **только** на сервере — то есть потеря диска означала бы потерю автозапуска стека (риск зафиксирован в `tickets/prod-deploy-handoff-20260912.md`, §7).

## Это шаблон, а не снятая с сервера копия

Содержимое сервера здесь не проверялось (доступа к серверу у ассистента нет). Перед любой заменой — сверка, а не накладка вслепую.

## Порядок применения (выполняет владелец, по одной команде за шаг)

```bash
# 1. Посмотреть различия. Ничего не записывает.
diff -u /usr/local/bin/balloo-deploy.sh ~/balloo/deploy/balloo-deploy.sh
diff -u /etc/systemd/system/balloo.service ~/balloo/deploy/balloo.service

# 2. Бэкап живых копий.
sudo cp -a /usr/local/bin/balloo-deploy.sh ~/balloo-deploy.sh.bak.$(date +%Y%m%d-%H%M%S)
sudo cp -a /etc/systemd/system/balloo.service ~/balloo.service.bak.$(date +%Y%m%d-%H%M%S)

# 3. Установка (только если различия из п.1 осознанны).
sudo install -m 755 ~/balloo/deploy/balloo-deploy.sh /usr/local/bin/balloo-deploy.sh
sudo install -m 644 ~/balloo/deploy/balloo.service /etc/systemd/system/balloo.service
sudo systemctl daemon-reload
sudo systemd-analyze verify /etc/systemd/system/balloo.service

# 4. Проверка без пересоздания контейнеров (идемпотентность подтверждена этапом 4 прод-тикета).
sudo systemctl start balloo.service && systemctl is-active balloo.service
```

Откат: вернуть бэкапы из п.2, затем `sudo systemctl daemon-reload && sudo systemctl restart balloo.service`.

## Что делает скрипт

Ждёт готовности docker-демона (по 2 с, до 60 попыток — намеренно дольше `After=docker.service`, который не гарантирует готовности сокета), затем `docker compose -f docker-compose.local.yml --env-file .env.production up -d --remove-orphans` и `ps`. Остановка — `compose stop`: сеть `balloo-net` и тома не удаляются, потому что её шлюз `172.19.0.1` использует postfix-релей почты (`SMTP_HOST`).
