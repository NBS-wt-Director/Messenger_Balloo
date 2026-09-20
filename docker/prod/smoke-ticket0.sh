#!/usr/bin/env bash
# ============================================================
# smoke-ticket0.sh — приёмочный smoke тикета №0 мультитикета
# поддоменов (всё API → api.balloo.su). READ-ONLY: ничего не
# меняет, только curl-проверки снаружи. Запускать на сервере
# ИЛИ с ноутбука (домены публичные):
#   bash docker/prod/smoke-ticket0.sh
#
# Строгие признаки (по протоколу prod-тикета):
#   PASS — только при точном совпадении ожидания.
#   Итог: PASS=N FAIL=0; exit 1 при любом FAIL.
# Секреты: probe-пароль берётся из ~/balloo-probe-credentials.txt
# (если файла нет — проверка помечается SKIP, это не FAIL).
# ============================================================
set -u

PASS=0
FAIL=0
SKIP=0

ok()   { PASS=$((PASS+1)); echo "PASS: $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL: $1"; }
skip() { SKIP=$((SKIP+1)); echo "SKIP: $1"; }

code_of() { # url [curl args...] -> HTTP code
  local url="$1"; shift
  curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$@" "$url" 2>/dev/null || echo 000
}

echo "=== 1. Web SPA (balloo.su) ==="
c=$(code_of https://balloo.su/)
[ "$c" = 200 ] && ok "balloo.su → 200" || bad "balloo.su → $c (ожидался 200)"

echo "=== 2. Probe basic-auth на api.balloo.su/health (не сломан тикетом №0) ==="
PROBE_FILE="$HOME/balloo-probe-credentials.txt"
c_noauth=$(code_of https://api.balloo.su/health)
if [ -f "$PROBE_FILE" ]; then
  PROBE_USER="uptimerobot"
  PROBE_PASS="$(grep -oE '[A-Za-z0-9+/=]{8,}' "$PROBE_FILE" | tail -1)"
  c_auth=$(code_of https://api.balloo.su/health -u "$PROBE_USER:$PROBE_PASS")
  if [ "$c_noauth" = 401 ] && [ "$c_auth" = 200 ]; then
    ok "health: без пароля 401, с паролем 200 (basic-auth жив)"
  else
    bad "health: без пароля $c_noauth (ожидание 401), с паролем $c_auth (ожидание 200)"
  fi
  unset PROBE_PASS
elif [ "$c_noauth" = 401 ]; then
  ok "health без пароля → 401 (basic-auth жив; probe-файла нет — пара не проверена)"
  skip "probe-файл $PROBE_FILE не найден — проверка с паролем не выполнялась"
else
  bad "health без пароля → $c_noauth (ожидание 401: probe-эндпоинт должен быть под basic-auth)"
fi

echo "=== 3. CORS: префлайт с поддоменов (список CORS_ORIGIN) ==="
for origin in https://balloo.su https://features.balloo.su https://admin.balloo.su; do
  acao=$(curl -sS -D - -o /dev/null --max-time 10 \
    -X OPTIONS https://api.balloo.su/api/auth/login \
    -H "Origin: $origin" \
    -H 'Access-Control-Request-Method: POST' 2>/dev/null \
    | tr -d '\r' | grep -i '^access-control-allow-origin:' | head -1 | cut -d' ' -f2-)
  case "$acao" in
    "$origin") ok "CORS $origin → разрешён" ;;
    *) bad "CORS $origin → НЕ разрешён ( ACAO: '${acao:-нет заголовка}' )" ;;
  esac
done

echo "=== 4. WS handshake без токена → 401 (не 502/обрыв) ==="
c_ws=$(code_of "https://api.balloo.su/ws/" --http1.1 \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==')
[ "$c_ws" = 401 ] && ok "wss api.balloo.su/ws/ без токена → 401" || bad "wss api.balloo.su/ws/ без токена → $c_ws (ожидание 401)"

echo "=== 5. Compat-прокси на balloo.su (переходный период) ==="
c_compat=$(code_of https://balloo.su/api/auth/ws-token)
[ "$c_compat" = 401 ] && ok "compat balloo.su/api/auth/ws-token → 401 (прокси жив)" || bad "compat balloo.su/api/auth/ws-token → $c_compat (ожидание 401)"

echo "=== 6. OAuth authorize (env провайдера настроен) → 302 на провайдера ==="
loc=$(curl -sS -o /dev/null --max-time 10 \
  -w '%{redirect_url}' https://api.balloo.su/api/auth/oauth/yandex 2>/dev/null)
case "$loc" in
  https://oauth.yandex.ru/*) ok "oauth yandex → 302 $loc" ;;
  *) bad "oauth yandex → редирект: '${loc:-нет}' (ожидание https://oauth.yandex.ru/...; not_configured = провайдер не настроен в env)" ;;
esac

echo
echo "ИТОГ: PASS=$PASS FAIL=$FAIL SKIP=$SKIP"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
