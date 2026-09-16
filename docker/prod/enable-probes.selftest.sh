#!/usr/bin/env bash
# Самопроверка docker/prod/enable-probes.sh без сервера и без root.
#
# Песочница строится рядом со скриптом (каталог .selftest-tmp: удаляется при успехе,
# остаётся при провале). Заглушки nginx/systemctl/curl/docker кладутся в PATH, а
# основной скрипт запускается с SUDO= и своими LIVE/HTP/PROBE_CRED/PROBE_OWNER.
#
# Проверяет ровно то, что глазами в этом скрипте уже трижды не заметили:
#   1) bash -n и запрет shell-редиректов на $HTP (класс бага этапа 17: «cmd < $HTP»
#      открывается непривилегированной оболочкой -> Permission denied на 640 root,
#      причём запись пароля до этой строки уже успела примениться);
#   2) применение: живой конфиг == канон по sha256, htpasswd = 1 строка $6$…, файл
#      паролей 600, и ни пароль, ни хеш не попали в stdout;
#   3) gate идёт ДО записей: чужой vhost -> выход с ошибкой, htpasswd не тронут;
#   4) автооткат: упавший nginx -t возвращает живой конфиг к прежнему sha256,
#      reload не выполнялся;
#   5) PROBE_DRY=1: ни одной записи;
#   6) идемпотентность: повторный прогон ничего не применяет и не делает reload.
#
# Запуск: bash docker/prod/enable-probes.selftest.sh
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
MAIN=$HERE/enable-probes.sh
CANON=$HERE/nginx/balloo-docker.conf
[ -f "$MAIN" ]  || { echo "нет $MAIN"; exit 1; }
[ -f "$CANON" ] || { echo "нет $CANON"; exit 1; }

PASSN=0; FAILEDN=0
t() { # t <название> <rc=0 значит PASS>
  if [ "$2" = 0 ]; then printf '  PASS  %s\n' "$1"; PASSN=$((PASSN + 1)); else printf '  FAIL  %s\n' "$1"; FAILEDN=$((FAILEDN + 1)); fi; }
not() { # not <название> <rc=0 значит FAIL>
  if [ "$2" = 0 ]; then printf '  FAIL  %s\n' "$1"; FAILEDN=$((FAILEDN + 1)); else printf '  PASS  %s\n' "$1"; PASSN=$((PASSN + 1)); fi; }

SB=$HERE/.selftest-tmp
rm -rf "$SB"; mkdir -p "$SB/bin" "$SB/etc"
LIVE=$SB/etc/balloo-docker.conf
HTP=$SB/etc/htpasswd-balloo
CRED=$SB/probe-credentials.txt
SHA_CANON=$(sha256sum "$CANON" | awk '{print $1}')
mk_pre() { grep -v auth_basic "$CANON" > "$LIVE"; }          # состояние «до наложения канона»
sha_live() { sha256sum "$LIVE" | awk '{print $1}'; }
sha_htp()  { sha256sum "$HTP" 2>/dev/null | awk '{print $1}'; }

cat > "$SB/bin/nginx" <<'STUB'
#!/usr/bin/env bash
case "${1:-}" in
  -v) echo "nginx version: nginx/1.24.0 (selftest)" ;;
  -t) if [ "${SELFTEST_NGINX_T_FAIL:-0}" = 1 ]; then echo "nginx: configuration file test failed"; exit 1; fi
      echo "nginx: the configuration file syntax is ok"; echo "nginx: configuration file test is successful" ;;
  -T) cat "${SELFTEST_LIVE:?}" ;;
  *) echo "selftest nginx: $*" ;;
esac
STUB
cat > "$SB/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
sub=${1:-}; shift || true
case "$sub" in
  show)       for a in "$@"; do [ "$a" = NRestarts ] && echo 0; done; exit 0 ;;
  is-enabled) echo "${SELFTEST_IS_ENABLED:-enabled}"; exit 0 ;;
  is-active)  echo inactive; exit 0 ;;
  enable)     if [ "${SELFTEST_NO_UNIT:-0}" = 1 ]; then echo "Failed to enable unit: Unit balloo.service does not exist" >&2; exit 1; fi
              echo "selftest systemctl: enable $*"; exit 0 ;;
  reload)     echo "selftest systemctl: reload $*"; exit 0 ;;
  *) exit 0 ;;
esac
STUB
cat > "$SB/bin/curl" <<'STUB'
#!/usr/bin/env bash
# Код зависит от «состояния живого конфига»: если в нём есть auth_basic_user_file,
# то /health* без пароля -> 401, с паролем (--config) -> 200; иначе -> 200.
url=${@: -1}; withauth=0
for a in "$@"; do [ "$a" = --config ] && withauth=1; done
case "$url" in
  *health*) if grep -q auth_basic_user_file "${SELFTEST_LIVE:?}"; then
              if [ "$withauth" = 1 ]; then echo 200; else echo 401; fi
            else echo 200; fi ;;
  *) echo 200 ;;
esac
STUB
cat > "$SB/bin/docker" <<'STUB'
#!/usr/bin/env bash
if [ "${1:-}" = ps ]; then shift; fmt=""; while [ $# -gt 0 ]; do [ "$1" = --format ] && fmt=$2; shift; done
  [ -n "$fmt" ] && printf '%s\n' "$fmt" | sed -e 's/{{\.Names}}/balloo-server/' -e 's/{{\.Status}}/Up 27 hours (healthy)/'
fi
exit 0
STUB
chmod +x "$SB"/bin/*

run() { # run <файл-вывода> [ДОП=значение …]
  local out=$1; shift
  env PATH="$SB/bin:$PATH" SELFTEST_LIVE="$LIVE" SUDO= LIVE="$LIVE" HTP="$HTP" \
      PROBE_USER=probeuser PROBE_CRED="$CRED" PROBE_YES=1 \
      PROBE_OWNER="$(id -un):$(id -gn)" PROBE_MODE=640 "$@" \
      bash "$MAIN" >"$out" 2>&1
}

echo "=== 1. синтаксис и статутные запреты ==="
bash -n "$MAIN"; t "bash -n enable-probes.sh" $?
grep -nE '[<>]{1,2}[[:space:]]*"?\$HTP' "$MAIN" | grep -vE '^[0-9]+:[[:space:]]*#' >"$SB/redir.txt"
not "нет shell-редиректов оболочки на \$HTP (бага строки 66 этапа 17)" $?
[ -s "$SB/redir.txt" ] && cat "$SB/redir.txt"

echo "=== 2. применение канона (первый прогон) ==="
mk_pre; SHA_PRE=$(sha_live); rm -f "$HTP" "$CRED"
run "$SB/out2"; t "rc=0 (полный вывод: $SB/out2)" $?
grep -q 'reload выполнен'                "$SB/out2"; t "выполнен ровно один reload" $?
grep -q 'ИТОГ: проверок провалено = 0'   "$SB/out2"; t "ни одного проваленного признака" $?
grep -q 'FAIL'                           "$SB/out2"; not "в выводе нет слова FAIL" $?
[ "$(sha_live)" = "$SHA_CANON" ];          t "живой конфиг стал побайтово равен канону" $?
[ "$(grep -c auth_basic_user_file "$LIVE")" = 2 ]; t "в живом конфиге 2 блока basic-auth" $?
[ -f "$HTP" ] && [ "$(wc -l < "$HTP" | tr -d ' ')" = 1 ]; t "htpasswd: ровно одна строка" $?
head -c 24 "$HTP" | grep -q '^probeuser:\$6\$';  t "htpasswd: пользователь probeuser, хеш формата \$6\$" $?
[ -f "$CRED" ] && [ "$(stat -c '%a' "$CRED")" = 600 ]; t "файл паролей создан с chmod 600" $?
grep -q 'пользователь: probeuser' "$CRED" 2>/dev/null; t "в файле паролей указан пользователь" $?
PW=$(sed -n 's/^пароль    : //p' "$CRED" 2>/dev/null)
[ "${#PW}" -ge 20 ];                       t "выпущен пароль длиной >=20 символов" $?
grep -qF -- "$PW" "$SB/out2";              not "пароль НЕ напечатан в stdout" $?
grep -qE '\$6\$[A-Za-z0-9./]{16,}' "$SB/out2"; not "хеш НЕ напечатан в stdout" $?

echo "=== 3. gate: чужой vhost должен остановить ДО всяких записей ==="
cp "$HTP" "$SB/htpasswd.before"; SHA_HTP=$(sha_htp); SHA_LIVE_BEFORE=$(sha_live)
printf 'server {\n    listen 443 ssl;\n    server_name chuzhoy.example;\n}\n' > "$LIVE"
run "$SB/out3"; not "чужой конфиг: скрипт завершился ошибкой" $?
grep -q 'не похож на наш vhost' "$SB/out3"; t "чужой конфиг: причина названа прямо" $?
[ "$(sha_htp)" = "$SHA_HTP" ];              t "чужой конфиг: htpasswd не перезаписан (gate до записей)" $?
grep -q 'chuzhoy.example' "$LIVE";          t "чужой конфиг: живой файл не перезаписан каноном" $?
grep -q 'reload выполнен' "$SB/out3";       not "чужой конфиг: reload не выполнялся" $?

echo "=== 4. автооткат, если nginx -t не прошёл ==="
mk_pre; SHA_PRE=$(sha_live)
run "$SB/out4" SELFTEST_NGINX_T_FAIL=1; not "nginx -t упал: скрипт завершился ошибкой" $?
grep -q 'откачен из' "$SB/out4";            t "nginx -t упал: конфиг откачен из бэкапа" $?
grep -q 'reload выполнен' "$SB/out4";       not "nginx -t упал: reload не выполнялся" $?
[ "$(sha_live)" = "$SHA_PRE" ];             t "nginx -t упал: живой конфиг == прежнему sha256" $?

echo "=== 5. DRY RUN: только замеры, ни одной записи ==="
mk_pre; SHA_PRE=$(sha_live); SHA_HTP=$(sha_htp)
run "$SB/out5" PROBE_DRY=1; t "DRY RUN: rc=0" $?
grep -q 'DRY RUN' "$SB/out5";               t "DRY RUN: режим объявлен в выводе" $?
grep -q 'reload выполнен' "$SB/out5";       not "DRY RUN: reload не выполнялся" $?
[ "$(sha_live)" = "$SHA_PRE" ];             t "DRY RUN: живой конфиг не изменён" $?
[ "$(sha_htp)" = "$SHA_HTP" ];              t "DRY RUN: htpasswd не изменён" $?

echo "=== 6. идемпотентность: повторный прогон ничего не применяет ==="
mk_pre
run "$SB/out6a"; t "прогон 1 из состояния «до»: rc=0" $?
run "$SB/out6" PROBE_KEEP=1; t "прогон 2 (PROBE_KEEP=1): rc=0" $?
grep -q 'побайтово равен канону' "$SB/out6"; t "прогон 2: распознал, что применять нечего" $?
grep -q 'reload выполнен' "$SB/out6";        not "прогон 2: reload не делался" $?
grep -q 'ИТОГ: проверок провалено = 0' "$SB/out6"; t "прогон 2: пробы по-прежнему 401 без пароля" $?
[ "$(sha_live)" = "$SHA_CANON" ];            t "прогон 2: живой конфиг всё ещё равен канону" $?

echo "=== 7. подтверждение оператора: не-терминал не должен зависать и ничего менять ==="
mk_pre; SHA_PRE=$(sha_live); SHA_HTP=$(sha_htp)
env PATH="$SB/bin:$PATH" SELFTEST_LIVE="$LIVE" SUDO= LIVE="$LIVE" HTP="$HTP" \
    PROBE_USER=probeuser PROBE_CRED="$CRED" PROBE_OWNER="$(id -un):$(id -gn)" PROBE_MODE=640 \
    bash "$MAIN" >"$SB/out7" 2>&1 </dev/null; rc=$?
not "не-терминал: rc!=0 (а не зависание и не «молча применил»)" $rc
grep -q 'подтверждение требует терминала' "$SB/out7"; t "не-терминал: причина названа прямо" $?
grep -q 'reload выполнен' "$SB/out7";        not "не-терминал: reload не выполнялся" $?
[ "$(sha_live)" = "$SHA_PRE" ];              t "не-терминал: живой конфиг не изменён" $?
[ "$(sha_htp)" = "$SHA_HTP" ];               t "не-терминал: htpasswd не изменён" $?

printf '\nИТОГ САМОПРОВЕРКИ: PASS=%d FAIL=%d\n' "$PASSN" "$FAILEDN"
if [ "$FAILEDN" = 0 ]; then rm -rf "$SB"; echo "песочница $SB удалена"; else echo "песочница осталась для разбора: $SB"; fi
[ "$FAILEDN" = 0 ]
