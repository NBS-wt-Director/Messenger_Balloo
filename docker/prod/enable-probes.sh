#!/usr/bin/env bash
# PROBES + AUTOSTART: закрывает /health и /health/ready basic-auth'ом и включает autostart.
#
# Запуск на сервере (из клонированного репозитория):
#     bash docker/prod/enable-probes.sh
#
# Делает ровно один reload nginx. Пароль запрашивается два раза через read -s
# (в историю не попадает, в командную строку не подставляется).
# При неудачном nginx -t конфигурация автоматически откатывается.
set -euo pipefail

LIVE=/etc/nginx/sites-enabled/balloo-docker.conf
HTP=/etc/nginx/.htpasswd-balloo
USER_NAME=uptimerobot

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi
if [ -n "$SUDO" ]; then sudo -v; fi

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SRC="$REPO/docker/prod/nginx/balloo-docker.conf"

echo "репозиторий : $REPO"
if git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1; then
  echo "HEAD        : $(git -C "$REPO" rev-parse --short HEAD)"
  if git -C "$REPO" rev-parse --verify -q origin/main >/dev/null; then
    echo "origin/main : $(git -C "$REPO" rev-parse --short origin/main)"
    if ! git -C "$REPO" diff --quiet HEAD origin/main -- docker/prod/nginx/; then
      echo "FAIL: nginx-конфиг в репо отличается от origin/main. Сначала: git pull --ff-only origin main"
      exit 1
    fi
  fi
else
  echo "HEAD        : (это не git-репозиторий — сверьте канон вручную)"
fi

[ -t 0 ] || { echo "FAIL: скрипт спрашивает пароль — запускайте из интерактивной сессии, не через pipe"; exit 1; }

[ -f "$SRC" ] || { echo "FAIL: нет $SRC"; exit 1; }
N=$(grep -c auth_basic_user_file "$SRC" || true)
[ "$N" -eq 2 ] || { echo "FAIL: блоков auth_basic_user_file в каноне: $N (ожидалось 2)"; exit 1; }
echo "канон       : блоков basic-auth = $N"

# ─── пароль ──────────────────────────────────────────────────────────────
while :; do
  read -rs -p 'Пароль для пользователя '"$USER_NAME"' (мин. 12 символов): ' PW; echo
  read -rs -p 'Повторите того же промпта:                              ' PW2; echo
  [ "$PW" = "$PW2" ] || { echo "не совпало — повторяем"; continue; }
  [ "${#PW}" -ge 12 ] || { echo "короче 12 символов — повторяем"; continue; }
  case "$PW" in
    *\"*) echo "без двойных кавычек — повторяем"; continue ;;
    *[[:space:]]*) echo "без пробелов — повторяем"; continue ;;
  esac
  unset PW2
  break
done
trap 'PW=""' EXIT

# ─── htpasswd: sha512-crypt, одна строка, root:www-data 640 ──────────────
HASH=$(printf '%s' "$PW" | openssl passwd -6 -stdin)
[ -n "$HASH" ] || { echo "FAIL: openssl не вернул хеш"; exit 1; }
case "$HASH" in '$6'*) ;; *) echo "FAIL: неожиданный формат хеша: ${HASH:0:6}"; exit 1 ;; esac
$SUDO tee "$HTP" >/dev/null <<<"$USER_NAME:$HASH"
$SUDO chown root:www-data "$HTP"
$SUDO chmod 640 "$HTP"
unset HASH
LINES=$($SUDO wc -l < "$HTP" | tr -d '[:space:]')
OWNER=$($SUDO stat -c '%U:%G %a' "$HTP" 2>/dev/null || echo '?')
echo "htpasswd    : $HTP ($LINES строк, $OWNER)"
[ "$LINES" -eq 1 ] || { echo "FAIL: в htpasswd не одна строка"; exit 1; }

# ─── наложение канона с gate + автооткат ─────────────────────────────────
BAK="$HOME/balloo-docker.conf.bak.$(date +%F-%H%M%S)"
$SUDO cp -a "$LIVE" "$BAK"
echo "бэкап       : $BAK"
$SUDO cp "$SRC" "$LIVE"
if ! $SUDO nginx -t; then
  $SUDO cp -a "$BAK" "$LIVE"
  echo "nginx -t не прошёл — конфигурация откачена, reload НЕ выполнялся"
  exit 1
fi
$SUDO systemctl reload nginx
echo "nginx       : reload выполнен (1 раз)"

# ─── autostart приложения ────────────────────────────────────────────────
$SUDO systemctl enable balloo.service >/dev/null 2>&1 || true
echo "autostart   : balloo.service = $(systemctl is-enabled balloo.service 2>&1)"

# ─── проверки ────────────────────────────────────────────────────────────
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$@"; }
auth() { printf 'user = "%s:%s"\n' "$USER_NAME" "$PW" |
           curl -s -o /dev/null -w '%{http_code}' --max-time 8 --config - "$@"; }

check() { # url ожидаем как_авторизуемся
  local url=$1 want_no=$2 want_yes=$3 got_no got_yes
  got_no=$(code "$url"); got_yes=$(auth "$url")
  if [ "$got_no" = "$want_no" ] && [ "$got_yes" = "$want_yes" ]; then
    printf '  PASS  %-38s без пароля=%s  с паролем=%s\n' "$url" "$got_no" "$got_yes"
  else
    printf '  FAIL  %-38s без пароля=%s (хотели %s)  с паролем=%s (хотели %s)\n' \
      "$url" "$got_no" "$want_no" "$got_yes" "$want_yes"
  fi
}

echo "проверки:"
check https://api.balloo.su/health       401 200
check https://api.balloo.su/health/ready 401 200
check https://balloo.su/health           401 200
echo "  --- открытые маршруты (должны быть 200 в обоих случаях) ---"
printf '  %-44s без пароля=%s\n' https://balloo.su/ "$(code https://balloo.su/)"
printf '  %-44s без пароля=%s\n' https://api.balloo.su/ "$(code https://api.balloo.su/)"
printf '  %-44s restarts=%s\n'  balloo.service "$(systemctl show -p NRestarts --value balloo.service)"

cat <<EOF

Откат (одна команда, reload не нужен — только если решите отменить):
  sudo cp -a $BAK $LIVE && sudo nginx -t && sudo systemctl reload nginx

UptimeRobot: тип «HTTP(s)», URL https://api.balloo.su/health, метод GET,
период 60 c, Basic Auth: пользователь $USER_NAME, пароль из промпта выше.
EOF
