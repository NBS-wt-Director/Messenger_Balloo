#!/usr/bin/env bash
# ============================================================
# Батч M (§11 тикета tickets/prod-deploy-handoff-20260912.md):
#   1) позитивный WS-тест с настоящим токеном — критерий §10:
#      wss://balloo.su/ws/?token=… отвечает 101;
#   2) P3 — upload 5 МБ без 413 (лимит nginx 120m);
#   3) контрольные замеры: [WS] Connection from user в логе,
#      restarts контейнера (хвост этапа 30).
#
# Ничего в системе не правит: только curl к https://balloo.su,
# docker logs/inspect (чтение) и временные файлы (shred -u по EXIT).
# Пароли: read -rs внутри скрипта — не в истории, не в чате
# (правила 8, 14, 16 §0 тикета). В JSON пароль экранируется
# (\\ и ") — форма проверена локально на bash 5.2.
#
# Ожидание по итогам (строгие признаки):
#   login=200, ws_token=200, ws_with_token=101, ws_accepted_log>=1,
#   restarts=0, upload != 413 (400 «chatId обязателен» = тело дошло
#   до приложения — это успех для P3, эндпоинт требует chatId).
#
# Запуск на сервере: bash docker/prod/ws-positive-test.sh
# Локальный стенд (для отладки): WS_TEST_BASE=http://127.0.0.1:3199
# ============================================================
set -uo pipefail

BASE="${WS_TEST_BASE:-https://balloo.su}"

TMPD=$(mktemp -d /tmp/balloo-wstest.XXXXXX)
JAR="$TMPD/cookies"; LG="$TMPD/login.json"; WST="$TMPD/wstoken.json"; UP="$TMPD/upload.json"
P3FILE="/tmp/p3-5mb.txt"   # создан ранее вручную; скрипт пересоздаст при отсутствии
cleanup() {
  shred -u "$JAR" "$LG" "$WST" "$UP" 2>/dev/null || true
  rm -rf "$TMPD"
  unset E P T 2>/dev/null || true
}
trap cleanup EXIT

PASS=0; FAIL=0
ok()  { printf '  PASS  %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf '  FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

# JSON-escape: экранируем \ и " в значении (проверено локально:
# пароли с кавычками/слэшами/$ проходят без порчи JSON)
jesc() { printf %s "$1" | sed 's/["\\]/\\&/g'; }

echo "=== 0. ввод учётных данных (не отображается, в историю не попадает) ==="
read -rs -p 'email: ' E; echo
read -rs -p 'password: ' P; echo
if [ -z "$E" ] || [ -z "$P" ]; then
  echo "ОШИБКА: email/пароль пусты — ввод не прошёл (склеивание строк?). Ничего не отправлено."
  exit 1
fi

echo "=== 1. login (POST $BASE/api/auth/login) ==="
BODY=$(printf '{"email":"%s","password":"%s"}' "$(jesc "$E")" "$(jesc "$P")")
LOGIN_HTTP=$(curl -sS -c "$JAR" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' -d "$BODY" -o "$LG" -w '%{http_code}' || echo 000)
printf 'login_http=%s\n' "$LOGIN_HTTP"
if [ "$LOGIN_HTTP" != 200 ]; then
  echo "— тело ответа (секретов в нём нет):"; head -c 300 "$LG"; echo
  echo "Дальше не идём: без login нет cookie. Расшифровка:"
  echo "  400 «Email и пароль обязательны» = тело не дошло/пустое (дефект ввода, не прода);"
  echo "  401 «Неверный email или пароль» = неверные учётные данные."
  exit 1
fi
if grep -q '"needs2FA":true' "$LG"; then
  echo "ОШИБКА: у аккаунта включена 2FA — скрипт её не проходит. Нужен аккаунт без 2FA."
  exit 1
fi
ok "login 200, cookie установлены"

echo "=== 2. ws-token (GET $BASE/api/auth/ws-token) ==="
WST_HTTP=$(curl -sS -b "$JAR" "$BASE/api/auth/ws-token" -o "$WST" -w '%{http_code}' || echo 000)
T=$(sed -n 's/.*"token":"\([^"]*\)".*/\1/p' "$WST")
printf 'ws_token_http=%s ws_token_len=%s\n' "$WST_HTTP" "${#T}"
if [ "$WST_HTTP" = 200 ] && [ "${#T}" -gt 100 ]; then
  ok "ws-token выдан"
else
  bad "ws-token не выдан"
fi

echo "=== 3. WS handshake с токеном ($BASE/ws/?token=…) ==="
# curl после 101 держит соединение открытым до --max-time и завершается
# с rc=28 — это НОРМА (проверено локально на стенде с тем же пакетом ws):
# http_code=101 печатается и при таймауте. Код ответа — единственный критерий.
WS_HTTP=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 --http1.1 \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  "$BASE/ws/?token=$T" || true)
printf 'ws_with_token=%s (rc=28 после 101 — норма: соединение живо)\n' "$WS_HTTP"
case "$WS_HTTP" in
  101) ok "WS handshake 101 Switching Protocols" ;;
  401) bad "WS 401 — токен отклонён (см. docker logs: Connection rejected)" ;;
  *)   bad "WS неожиданный код $WS_HTTP (502/000 = путь через nginx или процесс; вывод присылать целиком)" ;;
esac

echo "=== 4. поведенческий признак: лог сервера за 3 минуты ==="
CONN=$(docker logs --since 3m balloo-server 2>&1 | grep -c 'Connection from user' || true)
REJ=$(docker logs --since 3m balloo-server 2>&1 | grep -c 'Connection rejected' || true)
printf 'ws_accepted_log=%s ws_rejected_log=%s (ожидаем accepted>=1)\n' "${CONN:-0}" "${REJ:-0}"
if [ "${CONN:-0}" -ge 1 ]; then
  ok "сервер принял WS-подключение (в логе)"
else
  bad "в логе нет принятия подключения"
fi

echo "=== 5. контроль: контейнер жив, рестартов нет ==="
docker inspect -f 'status={{.State.Status}} restarts={{.RestartCount}} startedAt={{.State.StartedAt}}' balloo-server
R=$(docker inspect -f '{{.RestartCount}}' balloo-server 2>/dev/null || echo -1)
if [ "$R" = 0 ]; then ok "restarts=0"; else bad "restarts=$R"; fi

echo "=== 6. P3: upload 5 МБ без 413 (POST $BASE/api/upload/file) ==="
[ -f "$P3FILE" ] || head -c 5242880 /dev/zero | tr '\0' 'a' > "$P3FILE"
UP_HTTP=$(curl -sS -b "$JAR" -X POST "$BASE/api/upload/file" \
  -F "file=@$P3FILE;type=text/plain" -o "$UP" -w '%{http_code}' || echo 000)
printf 'upload_http=%s\n' "$UP_HTTP"
echo "— тело ответа:"; head -c 300 "$UP"; echo
case "$UP_HTTP" in
  413) bad "413 — лимит nginx не действует (P3 открыт)" ;;
  401) bad "401 — cookie не дошли (странно после успешного login)" ;;
  400) if grep -q 'chatId' "$UP"; then
         ok "400 «chatId обязателен» = тело дошло до приложения, 413 нет (P3: лимит работает)"
       else
         bad "400 с другим сообщением — смотрите тело выше"
       fi ;;
  200) ok "200 — файл принят" ;;
  *)   bad "неожиданный код $UP_HTTP — вывод присылать целиком" ;;
esac

echo "=== ИТОГ: PASS=$PASS FAIL=$FAIL ==="
if [ "$FAIL" = 0 ]; then
  echo "WS 101 + P3 подтверждены. Остатки тикета: UptimeRobot (пользователь), P7/P12, финал/ребут."
fi
exit 0
