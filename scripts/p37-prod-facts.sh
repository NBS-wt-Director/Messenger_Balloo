#!/usr/bin/env bash
# p37-prod-facts.sh — снятие фактов с прод-сервера перед деплоем 97d7077.
#
# ТОЛЬКО ЧТЕНИЕ: не собирает, не перезапускает, не пишет в рабочее дерево,
# не печатает значения секретов (из .env — только имена переменных).
#
# Запуск на сервере (пользователем):
#   bash /tmp/balloo-facts.sh 2>&1 | tee /tmp/balloo-facts-$(date +%Y%m%d-%H%M%S).log
#
# Причина появления скрипта: предыдущий батч содержал строку
#   tee -a "$LOG"
# без входного файла. tee читает stdin, проглотил весь вставленный после него
# текст и ни одна команда не выполнилась. Здесь tee только в пайплайне запуска.

set +e

t() { timeout 30 "$@"; }   # зависший вызов отсекается за 30 секунд

echo "=== 0.1 пользователь и где прод-репозиторий ==="
echo "whoami=$(whoami)  HOME=$HOME  PWD=$(pwd)"
for d in "$HOME/balloo" /home/aedgar192/balloo /opt/balloo /srv/balloo /root/balloo; do
  [ -d "$d/.git" ] && echo "РЕПО: $d"
done

PROD_DIR="${PROD_DIR:-$HOME/balloo}"
if [ ! -d "$PROD_DIR/.git" ]; then
  echo "НЕТ репозитория в $PROD_DIR — запусти так:  PROD_DIR=/реальный/путь bash /tmp/balloo-facts.sh"
  exit 1
fi
cd "$PROD_DIR" || exit 1
echo "PROD_DIR=$(pwd -P)"

echo
echo "=== 0.2 git: remote / ветка / HEAD / рабочее дерево ==="
git remote -v
echo "branch=$(git branch --show-current)"
echo "HEAD=$(git rev-parse HEAD)"
git log --oneline -3 | cat
echo "--- status -sb (строки M/D/A = есть правки; '??' — untracked, их не трогаем) ---"
git status -sb
echo "--- diff tracked (рабочее дерево vs HEAD) ---"
git diff --stat
git diff --cached --stat

echo
echo "=== 0.3 что реально приедет (fetch качает объекты, дерево не трогает) ==="
GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -oBatchMode=yes" t git fetch origin \
  && echo "fetch OK" || echo "fetch НЕ УДАЛСЯ — покажи вывод выше (возможно, нет ключа для origin)"
echo "LOCAL =$(git rev-parse HEAD)"
echo "ORIGIN=$(t git rev-parse origin/main 2>/dev/null || echo 'origin/main НЕ НАЙДЕН')"
echo "left..right (свои..чужие) = $(git rev-list --left-right --count HEAD...origin/main 2>/dev/null)"
echo "--- коммиты, которых нет локально ---"
git log --oneline HEAD..origin/main | cat
echo "--- файлы, которые изменит pull ---"
git diff --stat HEAD origin/main | cat

echo
echo "=== 0.4 compose-файлы и env (каноном репо = docker/prod/docker-compose.local.yml) ==="
ls -1 "$PROD_DIR"/docker-compose.yml "$PROD_DIR"/docker/*.yml 2>/dev/null
ls -1 "$PROD_DIR"/docker/prod/docker-compose*.yml 2>/dev/null
for f in "$PROD_DIR"/docker/prod/.env*; do
  [ -f "$f" ] && echo "ЕСТЬ: $f ($(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "$f") переменных, значения не печатаю)"
done
echo "--- имена переменных в docker/prod/.env.production (только ключи) ---"
grep -oE '^[A-Za-z_][A-Za-z0-9_]*' "$PROD_DIR/docker/prod/.env.production" 2>/dev/null | sort | tr '\n' ' '; echo

echo
echo "=== 0.5 чем РЕАЛЬНО поднят контейнер balloo-web (проект/файл/каталог) ==="
t docker inspect balloo-web \
  --format 'project={{ index .Config.Labels "com.docker.compose.project" }}
service={{ index .Config.Labels "com.docker.compose.service" }}
config_files={{ index .Config.Labels "com.docker.compose.project.config_files" }}
working_dir={{ index .Config.Labels "com.docker.compose.project.working_dir" }}
image={{ .Config.Image }}
image_id={{ .Image }}
restart_policy={{ .HostConfig.RestartPolicy.Name }}
restart_count={{ .RestartCount }}
started={{ .State.StartedAt }}
status={{ .State.Status }}' \
  || echo "НЕТ контейнера balloo-web"
echo "--- публикация портов ---"
t docker port balloo-web 2>/dev/null || echo "(порт не опубликован или контейнера нет)"

echo
echo "=== 0.6 маркер НОВОГО кода в текущем образе (ожидаем 0 = деплоя ещё не было) ==="
t docker exec balloo-web sh -c \
  "grep -rlo 'page-with-footer' /usr/share/nginx/html/assets 2>/dev/null | wc -l" \
  || echo "(нет доступа к контейнеру — сравни с 0.5)"

echo
echo "=== 0.7 весь стек (эталон имён: balloo-postgres/redis/minio/server/web) ==="
t docker ps -a --filter name=balloo- \
  --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
echo "--- какие ещё контейнеры есть на машине (не balloo) ---"
t docker ps --format '{{.Names}} | {{.Status}}' | grep -v '^balloo-' | head -20

echo
echo "=== 0.8 автозапуск стека через systemd (в репо: deploy/balloo.service) ==="
t systemctl cat balloo.service 2>/dev/null | grep -E 'ExecStart|WorkingDirectory|^User=' \
  || echo "(юнита balloo.service нет / нет доступа — тогда стек поднят вручную)"
ls -l /usr/local/bin/balloo-deploy.sh 2>/dev/null || echo "(balloo-deploy.sh нет)"

echo
echo "=== 0.9 хостовый nginx: кто обслуживает домены и куда проксирует ==="
command -v nginx >/dev/null && nginx -v 2>&1 || echo "nginx не установлен (или не в PATH для этого пользователя)"
t systemctl is-active nginx 2>/dev/null
t ss -ltnp 2>/dev/null | grep -E ':80 |:443 ' || echo "(порты 80/443 не слушаются или нет прав на -p)"
echo "--- server_name и proxy_pass из живого конфига ---"
t sudo -n nginx -T 2>/dev/null | grep -nE 'server_name|proxy_pass|listen' | head -60 \
  || echo "НУЖЕН ПАРОЛЬ sudo — выполни отдельно:  sudo nginx -T | grep -nE 'server_name|proxy_pass|listen'"

echo
echo "=== 0.10 место под сборку образа web ==="
t docker --version
t docker compose version 2>/dev/null | head -1
df -h /var/lib/docker 2>/dev/null | tail -1 || df -h / | tail -1
t docker system df 2>/dev/null | head -4

echo
echo "=== ИТОГО: заполни эти 4 значения из вывода выше ==="
echo "PROD_DIR    = (см. 0.1/0.2)"
echo "COMPOSE_DIR = (см. 0.5: working_dir)"
echo "COMPOSE+ENV = (см. 0.5: config_files)"
echo "WEB_PORT    = (см. 0.5: docker port; в каноне 127.0.0.1:8080)"
echo "SPA_HOST    = (см. 0.9: server_name, который проксирует на web_backend)"
echo "Вставь вывод целиком в чат — по нему зафиксирую команды деплоя."
