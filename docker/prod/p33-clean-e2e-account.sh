#!/usr/bin/env bash
# ============================================================================
# P33 (2026-09-21): чистка тестового аккаунта e2e_smtp_test — вариант (б)-1.
#
# Контекст (tickets/Мультитикет_поддомены_C.md §7, P33): владелец вошёл через
# Яндекс, а попал под мягко УДАЛЁННЫЙ e2e-тестовый аккаунт (его Яндекс-ящик
# o8eryuhtin@yandex.ru совпал с email теста). P33-фикс уже отклоняет вход на
# неактивный аккаунт — но чтобы Яндекс-вход владельца создавал НОВЫЙ аккаунт
# с его данными, нужно освободить email и снять OAuth-привязку.
#
# Что делает --apply (одна SQL-транзакция, атомарно):
#   1. бэкап затрагиваемых строк в ~/balloo-p33-backup-<ts>.sql
#   2. DELETE FROM oauth_accounts WHERE user_id = <тестовый аккаунт>
#   3. UPDATE users SET email = NULL (email освобождён для новой регистрации)
#
# Без аргументов — read-only: только печатает состояние, ничего не меняет.
#
# Запуск (на сервере, из ~/balloo):
#   bash docker/prod/p33-clean-e2e-account.sh            # только посмотреть
#   bash docker/prod/p33-clean-e2e-account.sh --apply    # чистить (с бэкапом)
# ============================================================================
set -euo pipefail

TARGET_EMAIL="o8eryuhtin@yandex.ru"
PG_CONTAINER="balloo-postgres"
PSQL=(docker exec "$PG_CONTAINER" psql -U balloo -d balloo --csv -v ON_ERROR_STOP=1)

mode="read-only"
[ "${1:-}" = "--apply" ] && mode="apply"

echo "=== P33: чистка тестового аккаунта (режим: $mode) ==="
echo "email: $TARGET_EMAIL"
echo

# --- Проверка 1: контейнер postgres жив -------------------------------------
if ! docker inspect "$PG_CONTAINER" >/dev/null 2>&1; then
  echo "ОШИБКА: контейнер $PG_CONTAINER не найден. Запускать на сервере из ~/balloo."
  exit 1
fi

# --- Проверка 2: пользователь с этим email существует (ровно один) ---------
user_row=$("${PSQL[@]}" -t -A -F '|' -c \
  "SELECT id, username, status, email FROM users WHERE email = '$TARGET_EMAIL';")
user_count=$(printf '%s' "$user_row" | grep -c . || true)

if [ "$user_count" -eq 0 ]; then
  echo "Пользователь с email $TARGET_EMAIL НЕ найден — чистить нечего (уже чисто"
  echo "или чистка выполнена ранее). Проверьте привязки Яндекса вручную:"
  "${PSQL[@]}" -c "SELECT oa.provider, oa.provider_id, u.username, u.status FROM oauth_accounts oa JOIN users u ON u.id = oa.user_id WHERE oa.provider = 'yandex' AND u.status <> 'active';" || true
  exit 0
fi

if [ "$user_count" -gt 1 ]; then
  echo "ОШИБКА: найдено $user_count пользователей с этим email (ожидался 1)."
  echo "$user_row"
  echo "Ничего не трогаем — разберите вручную."
  exit 1
fi

user_id=$(printf '%s' "$user_row" | cut -d'|' -f1)
user_username=$(printf '%s' "$user_row" | cut -d'|' -f2)
user_status=$(printf '%s' "$user_row" | cut -d'|' -f3)

# --- Проверка 3: статус (ожидаем deleted — это e2e-тест) --------------------
echo "Найден пользователь:"
echo "  id=$user_id username=$user_username status=$user_status"
if [ "$user_status" != "deleted" ]; then
  echo
  echo "ВНИМАНИЕ: статус '$user_status', а не 'deleted'."
  echo "Если это НЕ тестовый аккаунт — прервитесь и разберите вручную."
  [ "$mode" = "apply" ] && { echo "Отказ: --apply при неожиданном статусе запрещён (сначала разберитесь)."; exit 1; }
fi

# --- Привязки OAuth этого пользователя --------------------------------------
bindings=$("${PSQL[@]}" -t -A -F '|' -c \
  "SELECT provider, provider_id FROM oauth_accounts WHERE user_id = '$user_id';")
bindings_count=$(printf '%s' "$bindings" | grep -c . || true)
echo "OAuth-привязок: $bindings_count"
[ "$bindings_count" -gt 0 ] && echo "$bindings"

if [ "$mode" = "read-only" ]; then
  echo
  echo "Read-only: ничего не изменено. Для чистки запустите с --apply."
  exit 0
fi

# --- Проверка 4: бэкап затрагиваемых строк ----------------------------------
ts=$(date +%Y%m%d-%H%M%S)
backup="$HOME/balloo-p33-backup-$ts.sql"
{
  echo "-- P33 backup $ts: user $user_id ($user_username), email $TARGET_EMAIL"
  echo "-- восстановление email (при необходимости):"
  echo "UPDATE users SET email = '$TARGET_EMAIL' WHERE id = '$user_id';"
  echo "-- удалённые oauth_accounts (восстановление):"
  "${PSQL[@]}" -t -A -c \
    "SELECT 'INSERT INTO oauth_accounts (id, user_id, provider, provider_id, access_token, refresh_token, expires_at, created_at, updated_at) VALUES (''' || id || ''', ''' || user_id || ''', ''' || provider || ''', ''' || provider_id || ''', ' || COALESCE('''' || access_token || '''', 'NULL') || ', ' || COALESCE('''' || refresh_token || '''', 'NULL') || ', ' || COALESCE(expires_at::text, 'NULL') || ', ' || created_at::text || ', ' || updated_at::text || ');' FROM oauth_accounts WHERE user_id = '$user_id';"
} > "$backup"
chmod 600 "$backup"

# --- Проверка 5: бэкап не пуст ----------------------------------------------
if [ ! -s "$backup" ]; then
  echo "ОШИБКА: бэкап пуст ($backup). Ничего не меняем."
  exit 1
fi
echo
echo "Бэкап: $backup ($(wc -l < "$backup") строк)"

# --- Транзакция: снять привязки + освободить email (атомарно) ---------------
echo
echo "Выполняю транзакцию: DELETE oauth_accounts + UPDATE users.email = NULL ..."
"${PSQL[@]}" -c "BEGIN; DELETE FROM oauth_accounts WHERE user_id = '$user_id'; UPDATE users SET email = NULL, updated_at = EXTRACT(EPOCH FROM now())::bigint WHERE id = '$user_id'; COMMIT;"

# --- Проверки 6-7: состояние «после» -----------------------------------------
after_email=$("${PSQL[@]}" -t -A -c "SELECT COALESCE(email, '<NULL>') FROM users WHERE id = '$user_id';")
after_bindings=$("${PSQL[@]}" -t -A -c "SELECT COUNT(*) FROM oauth_accounts WHERE user_id = '$user_id';")

echo
echo "=== Результат ==="
echo "email пользователя после: $after_email (ожидание: <NULL>)"
echo "oauth_accounts после:     $after_bindings (ожидание: 0)"

if [ "$after_email" != "<NULL>" ] || [ "$after_bindings" != "0" ]; then
  echo
  echo "ОШИБКА: состояние после не совпадает с ожиданием! Откат вручную из $backup."
  exit 1
fi

# --- Проверка 8: email свободен для новой регистрации ------------------------
taken=$("${PSQL[@]}" -t -A -c "SELECT COUNT(*) FROM users WHERE email = '$TARGET_EMAIL';")
echo "email $TARGET_EMAIL занят: $taken (ожидание: 0)"

echo
echo "ГОТОВО. Теперь вход владельца через Яндекс создаст НОВЫЙ аккаунт"
echo "с его именем/фамилией от Яндекса (P33-фикс больше не встретит deleted-email)."
echo "Откат (если понадобится): psql < $backup"
