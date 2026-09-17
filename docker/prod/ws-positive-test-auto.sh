#!/usr/bin/env bash
# ============================================================
# Батч N (§11 тикета tickets/prod-deploy-handoff-20260912.md):
# автоматический вариант батча M — БЕЗ ввода с клавиатуры.
#
# По решению пользователя (2026-09-17): пароль вводить в промпте
# нельзя (не отображается) — скрипт сам:
#   1) генерирует пароль (openssl rand, только A-Za-z0-9);
#   2) вычисляет bcrypt-хеш (bcryptjs, cost 12 — ровно как в
#      приложении: authService.ts BCRYPT_ROUNDS=12) ВНУТРИ
#      контейнера balloo-server, пароль передаётся по stdin
#      (не в argv, не в историю);
#   3) прописывает хеш тестовому аккаунту в БД (psql UPDATE,
#      колонка "passwordHash", схема сверена с Prisma);
#   4) прогоняет тест батча M: login -> ws-token -> WS 101 ->
#      лог сервера -> restarts -> P3 (upload 5 МБ без 413).
#
# Пароль: НЕ печатается, кладётся в ~/balloo-ws-test-credentials.txt
# (chmod 600) — как ~/balloo-probe-credentials.txt. В чат не переносить.
#
# Аккаунт по умолчанию: o8eryuhtin@yandex.ru (e2e_smtp_test, этап 27;
# подтверждён в БД выводом 2026-09-17). Сменить: WS_TEST_EMAIL=...
#
# Проверки форм (локально, ноутбук): bcryptjs-фрагмент hash/compare
# через stdin — работает ($2a$12$…, 60 симв.); bash -n; JSON-экранирование.
#
# Запуск на сервере: bash docker/prod/ws-positive-test-auto.sh
#   (sudo не обязателен: если docker без прав — скрипт сам добавит sudo)
# ============================================================
set -uo pipefail

BASE="${WS_TEST_BASE:-https://balloo.su}"
EMAIL="${WS_TEST_EMAIL:-o8eryuhtin@yandex.ru}"
PG_USER="${WS_TEST_PG_USER:-balloo}"
PG_DB="${WS_TEST_PG_DB:-balloo}"
PG_CONTAINER="${WS_TEST_PG_CONTAINER:-balloo-postgres}"
SRV_CONTAINER="${WS_TEST_SRV_CONTAINER:-balloo-server}"

# docker с автоматическим sudo (на сервере пользователь ходит через sudo,
# но скрипт должен работать и без него)
if docker info >/dev/null 2>&1; then DK=(docker); else DK=(sudo docker); fi

TMPD=$(mktemp -d /tmp/balloo-wstest.XXXXXX)
CRED="${HOME}/balloo-ws-test-credentials.txt"
P3FILE="/tmp/p3-5mb.txt"
cleanup() {
  shred -u "$TMPD"/login-req.json "$TMPD"/cookies "$TMPD"/login.json \
         "$TMPD"/wstoken.json "$TMPD"/upload.json 2>/dev/null || true
  rm -rf "$TMPD"
  unset PW HASH T 2>/dev/null || true
}
trap cleanup EXIT

PASS=0; FAIL=0
ok()  { printf '  PASS  %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf '  FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }
jesc() { printf %s "$1" | sed 's/["\\]/\\&/g'; }

echo "=== 1. генерация пароля + bcrypt-хеш в контейнере (по stdin) ==="
PW=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)
[ -n "$PW" ] || { echo "ОШИБКА: пароль не сгенерирован"; exit 1; }
HASH=$(printf %s "$PW" | "${DK[@]}" exec -i -w /app/packages/server "$SRV_CONTAINER" \
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const b=require('bcryptjs');process.stdout.write(b.hashSync(d,12))})" 2>/dev/null || true)
case "$HASH" in
  '$2a$'*) printf 'bcrypt_hash_ok len=%s (cost 12, bcryptjs — как в приложении)\n' "${#HASH}" ;;
  *) echo "ОШИБКА: хеш не получен (bcryptjs недоступен в контейнере?). Вывод: ${HASH:0:80}"; exit 1 ;;
esac

echo "=== 2. прописываем пароль аккаунту в БД (psql UPDATE) ==="
NOW=$(date +%s)
"${DK[@]}" exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -c \
  "UPDATE users SET \"passwordHash\"='$HASH', \"status\"='active', \"updatedAt\"=$NOW WHERE email='$EMAIL';"
UPD_RC=$?
if [ "$UPD_RC" != 0 ]; then
  echo "ОШИБКА: UPDATE users не прошёл — дальше не идём (БД не тронута дальше этой строки)."
  exit 1
fi
# 2FA: если у аккаунта есть секрет — выключаем, иначе login вернёт needs2FA
"${DK[@]}" exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -c \
  "UPDATE two_fa_secrets SET \"enabled\"=false WHERE \"userId\"=(SELECT id FROM users WHERE email='$EMAIL') AND \"enabled\"=true;" || true

echo "=== 3. пароль сохранён в $CRED (600; в stdout не печатается) ==="
umask 077
printf 'email=%s\npassword=%s\nсоздан=%s\n' "$EMAIL" "$PW" "$(date '+%Y-%m-%d %H:%M:%S')" > "$CRED"

echo "=== 4. login (POST $BASE/api/auth/login) ==="
# Тело — из файла: пароль не попадает в argv (ps) и в историю
printf '{"email":"%s","password":"%s"}' "$(jesc "$EMAIL")" "$(jesc "$PW")" > "$TMPD/login-req.json"
LOGIN_HTTP=$(curl -sS -c "$TMPD/cookies" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' -d @"$TMPD/login-req.json" \
  -o "$TMPD/login.json" -w '%{http_code}' || echo 000)
printf 'login_http=%s\n' "$LOGIN_HTTP"
if [ "$LOGIN_HTTP" != 200 ]; then
  echo "— тело ответа (секретов в нём нет):"; head -c 300 "$TMPD/login.json"; echo
  echo "Дальше не идём. 401 после успешного UPDATE = пароль не применился, вывод присылать целиком."
  exit 1
fi
if grep -q '"needs2FA":true' "$TMPD/login.json"; then
  echo "ОШИБКА: needs2FA=true — выключение 2FA не применилось. Вывод присылать целиком."
  exit 1
fi
ok "login 200, cookie установлены"

echo "=== 5. ws-token (GET $BASE/api/auth/ws-token) ==="
WST_HTTP=$(curl -sS -b "$TMPD/cookies" "$BASE/api/auth/ws-token" -o "$TMPD/wstoken.json" -w '%{http_code}' || echo 000)
T=$(sed -n 's/.*"token":"\([^"]*\)".*/\1/p' "$TMPD/wstoken.json")
printf 'ws_token_http=%s ws_token_len=%s\n' "$WST_HTTP" "${#T}"
if [ "$WST_HTTP" = 200 ] && [ "${#T}" -gt 100 ]; then ok "ws-token выдан"; else bad "ws-token не выдан"; fi

echo "=== 6. WS handshake с токеном ($BASE/ws/?token=…) ==="
# curl после 101 держит WS-сессию до --max-time и завершается rc=28 — НОРМА
# (проверено локально на стенде с тем же ws@8.21.1): http_code=101 печатается.
WS_HTTP=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 --http1.1 \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  "$BASE/ws/?token=$T" || true)
printf 'ws_with_token=%s (rc=28 после 101 — норма: соединение живо)\n' "$WS_HTTP"
case "$WS_HTTP" in
  101) ok "WS handshake 101 Switching Protocols" ;;
  401) bad "WS 401 — токен отклонён (см. docker logs: Connection rejected)" ;;
  *)   bad "WS неожиданный код $WS_HTTP — вывод присылать целиком" ;;
esac

echo "=== 7. поведенческий признак: лог сервера за 3 минуты ==="
CONN=$("${DK[@]}" logs --since 3m "$SRV_CONTAINER" 2>&1 | grep -c 'Connection from user' || true)
printf 'ws_accepted_log=%s (ожидаем >=1)\n' "${CONN:-0}"
if [ "${CONN:-0}" -ge 1 ]; then ok "сервер принял WS-подключение (в логе)"; else bad "в логе нет принятия подключения"; fi

echo "=== 8. контроль: контейнер жив, рестартов нет ==="
"${DK[@]}" inspect -f 'status={{.State.Status}} restarts={{.RestartCount}} startedAt={{.State.StartedAt}}' "$SRV_CONTAINER"
R=$("${DK[@]}" inspect -f '{{.RestartCount}}' "$SRV_CONTAINER" 2>/dev/null || echo -1)
if [ "$R" = 0 ]; then ok "restarts=0"; else bad "restarts=$R"; fi

echo "=== 9. P3: upload 5 МБ без 413 (POST $BASE/api/upload/file) ==="
[ -f "$P3FILE" ] || head -c 5242880 /dev/zero | tr '\0' 'a' > "$P3FILE"
UP_HTTP=$(curl -sS -b "$TMPD/cookies" -X POST "$BASE/api/upload/file" \
  -F "file=@$P3FILE;type=text/plain" -o "$TMPD/upload.json" -w '%{http_code}' || echo 000)
printf 'upload_http=%s\n' "$UP_HTTP"
echo "— тело ответа:"; head -c 300 "$TMPD/upload.json"; echo
case "$UP_HTTP" in
  413) bad "413 — лимит nginx не действует (P3 открыт)" ;;
  401) bad "401 — cookie не дошли (странно после успешного login)" ;;
  400) if grep -q 'chatId' "$TMPD/upload.json"; then
         ok "400 «chatId обязателен» = тело дошло до приложения, 413 нет (P3: лимит работает)"
       else
         bad "400 с другим сообщением — смотрите тело выше"
       fi ;;
  200) ok "200 — файл принят" ;;
  *)   bad "неожиданный код $UP_HTTP — вывод присылать целиком" ;;
esac

echo "=== ИТОГ: PASS=$PASS FAIL=$FAIL ==="
echo "Пароль тестового аккаунта: $CRED (chmod 600). Судьбу аккаунта решает владелец."
if [ "$FAIL" = 0 ]; then
  echo "WS 101 + P3 подтверждены. Остатки тикета: UptimeRobot (пользователь), P7/P12, финал/ребут."
fi
exit 0
