#!/usr/bin/env bash
# PROBES + AUTOSTART: закрывает /health и /health/ready basic-auth'ом, включает autostart.
#
# Запуск на сервере, ОДНОЙ строкой из клонированного репозитория:
#     bash docker/prod/enable-probes.sh
#
# Пароль НЕ запрашивается и НЕ печатается в терминал: генерируется через openssl rand
# и кладётся в $PROBE_CRED (chmod 600). Причина: значения, показанные/введённые в
# переписку, утекали дважды (P13 MAILRU_CLIENT_SECRET, P17 пароль пробы).
#     PROBE_KEEP=1  — не менять пароль (тогда проверка «с паролем» пропускается)
#     PROBE_DRY=1   — только замеры и diff, ни одной записи
#     PROBE_YES=1   — не спрашивать подтверждение перед наложением канона
#
# Порядок: замеры «до» → gate (чем живой конфиг отличается от канона + подтверждение
# оператора) → файл паролей → бэкап → cp канона → nginx -t (автооткат при неудаче)
# → ровно один reload → замеры «после» → systemctl enable → curl-проверки.
# Локальная самопроверка логики без сервера: docker/prod/enable-probes.selftest.sh
#
# Правила, зашитые в код (выводы из §1.0.1 тикета prod-deploy-handoff-20260912):
#   1) ни одного shell-редиректа на root-файл: «cmd < "$HTP"» открывает файл
#      НЕПРИВИЛЕГИРОВАННОЙ оболочкой → «script.sh: line N: …: Permission denied»
#      на файле 640 root:www-data. Так упал этап 17 на строке 66, причём запись
#      пароля (sudo tee) до этой строки уже успела примениться;
#   2) прав 0640 недостаточно — надо проверить, что файл читает пользователь воркеров
#      nginx, иначе reload пройдёт, а монитор получит вечный 401;
#   3) «успех» читается только по строгим признакам: без пароля 401, с паролем 200.
#
# Для selftest переопределяются: LIVE, HTP, PROBE_USER, PROBE_CRED, PROBE_YES,
# PROBE_KEEP, PROBE_DRY, SUDO (пустой SUDO = работать без sudo).
set -euo pipefail

LIVE=${LIVE:-/etc/nginx/sites-enabled/balloo-docker.conf}
HTP=${HTP:-/etc/nginx/.htpasswd-balloo}
USER_NAME=${PROBE_USER:-uptimerobot}
CRED=${PROBE_CRED:-$HOME/balloo-probe-credentials.txt}
HTP_OWNER=${PROBE_OWNER:-root:www-data}
HTP_MODE=${PROBE_MODE:-640}
DRY=${PROBE_DRY:-0}
YES=${PROBE_YES:-0}
KEEP=${PROBE_KEEP:-0}

if [ -n "${SUDO+set}" ]; then SUDO=$SUDO; elif [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO=sudo; fi
if [ -n "$SUDO" ]; then sudo -v; fi
# PRIV=1 — есть чем получить root (sudo или мы root). PRIV=0 — прогон без
# привилегий (только selftest): проверки, которые физически выполнимы лишь с root,
# помечаются ПРОПУСК, а не FAIL, чтобы не выдумывать несуществующую поломку.
if [ -n "$SUDO" ] || [ "$(id -u)" = 0 ]; then PRIV=1; else PRIV=0; fi

FAILS=0
ok()  { printf '        : OK      %s\n' "$*"; }
bad() { FAILS=$((FAILS + 1)); printf '        : FAIL    %s\n' "$*"; }
skip() { printf '        : ПРОПУСК %s\n' "$*"; }

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SRC="$REPO/docker/prod/nginx/balloo-docker.conf"

echo "режим       : $(if [ "$DRY" = 1 ]; then echo 'DRY RUN — только чтение, записи не будет'; else echo 'применение'; fi)"
echo "запуск      : $(id -un) (uid=$(id -u)), sudo=${SUDO:-не нужен}, bash $BASH_VERSION"
echo "репозиторий : $REPO"

if git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1; then
  echo "HEAD        : $(git -C "$REPO" rev-parse --short HEAD)"
  if git -C "$REPO" rev-parse --verify -q origin/main >/dev/null; then
    echo "origin/main : $(git -C "$REPO" rev-parse --short origin/main)"
    if ! git -C "$REPO" diff --quiet HEAD origin/main -- docker/prod/nginx/; then
      echo "FAIL: nginx-конфиг в HEAD отличается от origin/main. Сначала: git pull --ff-only origin main"
      exit 1
    fi
  else
    skip "нет ссылки origin/main — нечем сверить, что канон свежий"
  fi
else
  skip "не git-репозиторий — канон сверяйте вручную"
fi

[ -f "$SRC" ] || { echo "FAIL: нет канона $SRC"; exit 1; }
N=$(grep -c auth_basic_user_file "$SRC" || true)
[ "$N" -eq 2 ] || { echo "FAIL: блоков auth_basic_user_file в каноне $N, ожидалось 2"; exit 1; }
SHA_SRC=$(sha256sum "$SRC" | awk '{print $1}')
# Путь, который канон реально приказывает nginx читать, — сверяем с $HTP, чтобы не
# записать пароль в файл, на который nginx не смотрит (тогда вечный 401).
CANON_HTP=$(grep -m1 -oE 'auth_basic_user_file[[:space:]]+[^;[:space:]]+' "$SRC" | awk '{print $2}')
echo "канон       : $SRC (блоков basic-auth = $N, sha256 ${SHA_SRC:0:12})"
echo "            : nginx по канону читает htpasswd = ${CANON_HTP:-НЕ НАЙДЕН}, пароль пишем в $HTP"
if [ "${CANON_HTP:-}" != "$HTP" ] && [ "$PRIV" = 1 ]; then
  echo "FAIL: канон указывает на ${CANON_HTP:-?}, а скрипт пишет пароль в $HTP — монитор получит 401 навсегда"
  exit 1
fi

# ─── состояние «до»: все замеры, которые раньше приходилось выпрашивать пачками ───
echo "--- состояние до ---"
LIVE_REAL=$(readlink -f "$LIVE" 2>/dev/null || echo "$LIVE")
[ -f "$LIVE_REAL" ] || { echo "FAIL: нет живого конфига $LIVE_REAL (is-enabled symlink: $LIVE)"; exit 1; }
SHA_LIVE=$($SUDO sha256sum "$LIVE_REAL" | awk '{print $1}')
echo "live-конфиг : $LIVE"
echo "            : -> $LIVE_REAL, $($SUDO stat -c '%U:%G %a, %s байт' "$LIVE_REAL")"
echo "            : sha256 живого = ${SHA_LIVE:0:12}, блоков auth_basic_user_file = $($SUDO grep -c auth_basic_user_file "$LIVE_REAL" || true)"

describe_htp() { # владелец, права, число строк, префикс и длина хеша — БЕЗ значения хеша
  if [ -f "$HTP" ]; then
    echo "htpasswd    : $HTP, $($SUDO stat -c '%U:%G %a, %s байт' "$HTP")"
    $SUDO awk -F: '{printf "            : строка %d: пользователь=%s хеш=%s… длина=%d\n", NR, $1, substr($2,1,3), length($2)}' "$HTP"
  else
    echo "htpasswd    : файла нет ($HTP)"
  fi
}
describe_htp

# Пользователь воркеров nginx: из юнита, иначе из директивы user в nginx.conf.
NGW=$(systemctl show -p User --value nginx.service 2>/dev/null || true)
if [ -z "$NGW" ] || [ "$NGW" = "N/A" ]; then
  NGW=$($SUDO grep -m1 -oP '^[[:space:]]*user[[:space:]]+\K[^;[:space:]]+' /etc/nginx/nginx.conf 2>/dev/null || true)
fi
NGW=${NGW:-www-data}
echo "nginx       : $($SUDO nginx -v 2>&1 || echo 'nginx -v недоступен'), воркеры от пользователя $NGW"
echo "контейнеры  :"
docker ps --filter name=balloo --format '            : {{.Names}} {{.Status}}' 2>/dev/null \
  || echo "            : docker недоступен пользователю $(id -un) (в группе docker?)"
echo "autostart   : balloo.service is-enabled=$(systemctl is-enabled balloo.service 2>&1) is-active=$(systemctl is-active balloo.service 2>&1) NRestarts=$(systemctl show -p NRestarts --value balloo.service 2>/dev/null)"

code() { curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$@" 2>/dev/null || echo 000; }
auth() { printf 'user = "%s:%s"\n' "$USER_NAME" "$PW" |
           curl -s -o /dev/null -w '%{http_code}' --max-time 8 --config - "$@" 2>/dev/null || echo 000; }
PROBES=(https://api.balloo.su/health https://api.balloo.su/health/ready https://balloo.su/health)
echo -n "пробы без пароля (до):"
for u in "${PROBES[@]}"; do printf ' %s=%s' "$u" "$(code "$u")"; done
echo

# ─── gate: живой конфиг vs канон (только чтение, подтверждение оператора) ─────────
# Идёт ДО любой записи: если живой файл не наш или оператор не подтвердил, ни
# пароль, ни конфиг не трогаются.
echo "--- gate: чем живой конфиг отличается от канона ---"
APPLY=1
if [ "$SHA_LIVE" = "$SHA_SRC" ]; then
  echo "живой конфиг побайтово равен канону — применять нечего, reload не нужен"
  APPLY=0
else
  for m in 'server_name api.balloo.su' 'server_name balloo.su' '127.0.0.1:3100'; do
    if $SUDO grep -q "$m" "$LIVE_REAL"; then ok "в живом конфиге есть «$m»"; else bad "в живом конфиге нет «$m»"; fi
  done
  if [ "$FAILS" -gt 0 ]; then
    echo "ОТМЕНА: живой файл $LIVE_REAL не похож на наш vhost — ни один файл не изменён, reload не выполнялся"
    exit 1
  fi
  echo "что изменится («-» живое, «+» канон из репо; показаны первые 40 строк diff):"
  diff -u <($SUDO cat "$LIVE_REAL") "$SRC" 2>&1 | head -40 || true
  echo "полный diff: sudo diff -u $LIVE_REAL $SRC"
  if [ "$DRY" = 1 ]; then
    echo "DRY RUN: подтверждение не спрашиваю, cp/nginx -t/reload не выполняются"
  elif [ "$YES" != 1 ]; then
    if [ ! -t 0 ]; then echo "FAIL: подтверждение требует терминала (stdin не tty — отвечать не на что). Запусти интерактивно либо PROBE_YES=1"; exit 1; fi
    printf 'применить канон (бэкап -> cp -> nginx -t -> один reload)? [y/N] '
    read -r ANSWER || ANSWER=""      # Ctrl-D = «нет», а не падение скрипта
    if [ "$ANSWER" != "y" ]; then echo "отменено оператором (ответ: '${ANSWER}'): ни один файл не изменён, reload не выполнялся"; exit 0; fi
  fi
fi

# ─── пароль: генерируется здесь, в stdout не попадает ────────────────────────────
PW=""
if [ "$KEEP" = 1 ]; then
  if $SUDO test -s "$HTP"; then
    echo "пароль      : оставлен существующий ($KEEP-режим), проверка «с паролем» пропускается"
  else
    echo "FAIL: PROBE_KEEP=1, но $HTP пуст или отсутствует — пароль взять неоткуда"; exit 1
  fi
elif [ "$DRY" = 1 ]; then
  echo "пароль      : DRY RUN — не генерирую и не записываю"
else
  PW=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9+/=')
  [ "${#PW}" -ge 20 ] || { echo "FAIL: openssl rand вернул ${#PW} символов, ожидалось >=20"; exit 1; }
fi
trap 'PW=""' EXIT

# ─── htpasswd: sha512-crypt, одна строка, root:www-data 640 ──────────────────────
if [ -n "$PW" ]; then
  HASH=$(printf '%s' "$PW" | openssl passwd -6 -stdin)
  [ -n "$HASH" ] || { echo "FAIL: openssl passwd не вернул хеш"; exit 1; }
  case "$HASH" in '$6'*) ;; *) echo "FAIL: неожиданный формат хеша: ${HASH:0:3}"; exit 1 ;; esac
  # Редирект только в /dev/null: он не касается root-файла. Чтение/запись $HTP —
  # целиком внутри $SUDO-команд (см. правило 1 в шапке).
  $SUDO tee "$HTP" >/dev/null <<<"$USER_NAME:$HASH"
  if ! $SUDO chown "$HTP_OWNER" "$HTP" 2>/dev/null || ! $SUDO chmod "$HTP_MODE" "$HTP" 2>/dev/null; then
    if [ "$PRIV" = 0 ]; then
      echo "        : ПРОПУСК chown $HTP_OWNER / chmod $HTP_MODE (нет привилегий — это не prod-прогон)"
    else
      echo "FAIL: не удалось задать $HTP_OWNER/$HTP_MODE для $HTP — nginx не сможет его читать, отменяю"
      exit 1
    fi
  fi
  unset HASH
  umask 077
  { printf '# Balloo probe basic-auth, выпущен %s, хост %s\n' "$(date -Is)" "$(hostname)"
    printf 'пользователь: %s\n' "$USER_NAME"
    printf 'пароль    : %s\n' "$PW"; } > "$CRED"
  chmod 600 "$CRED"
  echo "пароль      : новый для пользователя $USER_NAME, сохранён в $CRED (chmod 600)"
  echo "            : посмотреть: cat $CRED   (в переписку не переносить)"
fi
if [ "$DRY" != 1 ]; then
  describe_htp
  LINES=$($SUDO awk 'END{print NR+0}' "$HTP")
  if [ "$LINES" = 1 ]; then ok "в $HTP ровно 1 строка"; else bad "в $HTP строк $LINES, ожидалась 1"; fi
  OWNER=$($SUDO stat -c '%U:%G %a' "$HTP" 2>/dev/null || echo 'нет файла')
  if [ "$PRIV" = 0 ]; then
    skip "прав $HTP_OWNER/$HTP_MODE (нет привилегий — файл не мог их получить): сейчас $OWNER"
  elif [ "$OWNER" = "$HTP_OWNER $HTP_MODE" ]; then
    ok "права $OWNER"
  else
    bad "права $OWNER, ожидалось $HTP_OWNER $HTP_MODE"
  fi
  # Чтение именно тем пользователем, который будет читать auth_basic_user_file.
  if [ -n "$SUDO" ]; then can_read=$($SUDO -u "$NGW" test -r "$HTP" 2>/dev/null && echo yes || echo no)
  elif [ "$(id -u)" = 0 ]; then can_read=$(su -s /bin/sh "$NGW" -c "test -r '$HTP'" 2>/dev/null && echo yes || echo no)
  else can_read=skip; fi
  case "$can_read" in
    yes) ok "воркер nginx ($NGW) читает $HTP" ;;
    no)  bad "воркер nginx ($NGW) НЕ читает $HTP — basic-auth даст вечный 401 и легитимному монитору тоже" ;;
    *)   skip "проверка чтения пользователем $NGW (нужны root/sudo)" ;;
  esac
fi

# ─── наложение канона: бэкап → cp → nginx -t → ровно один reload → автооткат ──────
BAK=""
if [ "$APPLY" = 1 ] && [ "$DRY" != 1 ]; then
  BAK="$HOME/balloo-docker.conf.bak.$(date +%F-%H%M%S)"
  $SUDO cp -a "$LIVE_REAL" "$BAK"
  echo "бэкап       : $BAK"
  $SUDO cp "$SRC" "$LIVE_REAL"
  if ! $SUDO nginx -t; then
    $SUDO cp -a "$BAK" "$LIVE_REAL"
    echo "FAIL: nginx -t не пройден. Конфиг откачен из $BAK, reload НЕ выполнялся"
    exit 1
  fi
  $SUDO systemctl reload nginx
  echo "nginx       : reload выполнен (один раз)"
fi

# ─── autostart ────────────────────────────────────────────────────────────────────
if [ "$DRY" = 1 ]; then
  echo "autostart   : DRY RUN — systemctl enable не выполнялся"
elif $SUDO systemctl enable balloo.service 2>/dev/null; then
  echo "autostart   : balloo.service is-enabled=$(systemctl is-enabled balloo.service 2>&1)"
else
  echo "autostart   : ВНИМАНИЕ, systemctl enable balloo.service не сработал (юнит отсутствует?) — смотреть: systemctl cat balloo.service"
fi

# ─── проверки ─────────────────────────────────────────────────────────────────────
# Блоки, которые nginx реально загрузил, — по пути из канона, а не по $HTP:
# именно канон решает, какой файл читает nginx.
RUN_BLOCKS=$($SUDO nginx -T 2>/dev/null | grep -F -- "${CANON_HTP:-/нет-в-каноне}" | grep -c auth_basic_user_file || true)

check() { # url ожидаем_без_пароля [ожидаем_с_паролем]
  local url=$1 want_no=$2 want_yes=${3-} got_no got_yes
  got_no=$(code "$url")
  if [ -z "$want_yes" ]; then
    if [ "$got_no" = "$want_no" ]; then
      printf '  PASS  %-38s без пароля=%s (с паролем не проверял: пароль не выпускался)\n' "$url" "$got_no"
    else
      bad "$(printf '%-38s без пароля=%s, ожидалось %s' "$url" "$got_no" "$want_no")"
    fi
    return
  fi
  got_yes=$(auth "$url")
  if [ "$got_no" = "$want_no" ] && [ "$got_yes" = "$want_yes" ]; then
    printf '  PASS  %-38s без пароля=%s  с паролем=%s\n' "$url" "$got_no" "$got_yes"
  else
    bad "$(printf '%-38s без пароля=%s (хотели %s)  с паролем=%s (хотели %s)' "$url" "$got_no" "$want_no" "$got_yes" "$want_yes")"
  fi
}

if [ "$DRY" = 1 ]; then
  echo "--- проверки: DRY RUN, ничего не применялось, поэтому ниже текущее состояние, а не результат ---"
  printf '  %-44s блоков basic-auth в загруженной конфигурации=%s\n' "$(basename "$LIVE_REAL")" "$RUN_BLOCKS"
  for u in "${PROBES[@]}"; do printf '  %-44s без пароля=%s\n' "$u" "$(code "$u")"; done
  echo "  (признак «применено» — 401 без пароля; сейчас ожидается то, что было до запуска)"
else
  echo "--- проверки после ---"
  if [ "$RUN_BLOCKS" = 2 ]; then ok "в загруженной конфигурации nginx 2 блока с нашим htpasswd-файлом"
  else bad "в загруженной конфигурации блоков с ${CANON_HTP:-?} = $RUN_BLOCKS, ожидалось 2 — значит $LIVE_REAL nginx не подхватил"; fi
  if [ -n "$PW" ]; then
    check https://api.balloo.su/health       401 200
    check https://api.balloo.su/health/ready 401 200
    check https://balloo.su/health           401 200
  else
    check https://api.balloo.su/health       401
    check https://api.balloo.su/health/ready 401
    check https://balloo.su/health           401
  fi
  echo "  --- открытые маршруты (справка, должны быть 200 без пароля) ---"
  printf '  %-44s без пароля=%s\n' https://balloo.su/     "$(code https://balloo.su/)"
  printf '  %-44s без пароля=%s\n' https://api.balloo.su/ "$(code https://api.balloo.su/)"
  printf '  %-44s restarts=%s\n'   balloo.service "$(systemctl show -p NRestarts --value balloo.service 2>/dev/null)"
fi

if [ "$FAILS" -gt 0 ]; then
  echo "--- последние строки error.log (для диагностики, без перезапуска чего-либо) ---"
  $SUDO tail -n 15 /var/log/nginx/error.log 2>/dev/null || echo "error.log недоступен"
fi

if [ -n "$BAK" ]; then
  ROLLBACK_TEXT="  sudo cp -a $BAK $LIVE_REAL && sudo nginx -t && sudo systemctl reload nginx"
elif [ "$DRY" = 1 ]; then
  ROLLBACK_TEXT="  не требуется: DRY RUN, ни один файл не изменялся"
else
  ROLLBACK_TEXT="  не требуется: живой конфиг уже был равен канону, правок не было"
fi
cat <<EOF

ИТОГ: проверок провалено = $FAILS
Откат конфигурации одной командой:
$ROLLBACK_TEXT

UptimeRobot: тип «HTTP(s)», URL https://api.balloo.su/health, метод GET, период 60 с,
Basic Auth: пользователь $USER_NAME, пароль — $(if [ -n "$PW" ]; then echo "из файла $CRED (cat $CRED)"; else echo "не выпускался в этом прогоне"; fi).
EOF

if [ "$FAILS" -gt 0 ]; then exit 1; fi
