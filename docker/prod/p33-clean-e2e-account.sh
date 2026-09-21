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
#   2. DELETE FROM oauth_accounts WHERE "userId" = <тестовый аккаунт>
#   3. UPDATE users SET email = NULL (email освобождён для новой регистрации)
#
# Без аргументов — read-only: только печатает состояние, ничего не меняет.
#
# ВАЖНО про имена колонок: схема создана Prisma, поэтому в PostgreSQL колонки
# camelCase и чувствительны к регистру — в SQL только "userId" / "providerId" /
# "accessToken" / "refreshToken" / "expiresAt" / "createdAt" / "updatedAt"
# (в кавычках). Проверка 1b сверяет их с information_schema до любых правок.
#
# Запуск (на сервере, из ~/balloo):
#   bash docker/prod/p33-clean-e2e-account.sh            # только посмотреть
#   bash docker/prod/p33-clean-e2e-account.sh --apply    # чистить (с бэкапом)
# ============================================================================
set -euo pipefail

# Цели можно переопределить окружением (для проверки на стенде/локально):
#   TARGET_EMAIL=... PG_CONTAINER=... bash docker/prod/p33-clean-e2e-account.sh
TARGET_EMAIL="${TARGET_EMAIL:-o8eryuhtin@yandex.ru}"
PG_CONTAINER="${PG_CONTAINER:-balloo-postgres}"
# ВАЖНО: колонки Prisma = camelCase в кавычках ("userId", "providerId", …).
PSQL=(docker exec "$PG_CONTAINER" psql -U balloo -d balloo --csv -v ON_ERROR_STOP=1)
# Тот же psql, но БЕЗ --csv: нужен для генерации INSERT'ов (CSV закавычил бы
# всю строку из-за запятых внутри SQL и бэкап стал бы невалидным).
PSQL_RAW=(docker exec -i "$PG_CONTAINER" psql -U balloo -d balloo -q -t -A -v ON_ERROR_STOP=1)

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

# --- Проверка 1b: имена колонок соответствуют Prisma-схеме ------------------
# Проверяем заранее: при дрейфе схемы даём понятную ошибку, а не «column does
# not exist» посреди транзакции.
missing=""
for spec in "users:id" "users:email" "users:username" "users:status" "users:updatedAt" \
            "oauth_accounts:id" "oauth_accounts:userId" "oauth_accounts:provider" \
            "oauth_accounts:providerId" "oauth_accounts:accessToken" \
            "oauth_accounts:refreshToken" "oauth_accounts:expiresAt" \
            "oauth_accounts:createdAt" "oauth_accounts:updatedAt"; do
  t="${spec%%:*}"; c="${spec##*:}"
  n=$("${PSQL[@]}" -t -A -c \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = '$t' AND column_name = '$c';")
  [ "${n:-0}" = "1" ] || missing="$missing $spec"
done
if [ -n "$missing" ]; then
  echo "ОШИБКА: в БД нет ожидаемых колонок:$missing"
  echo "Схема разошлась с Prisma (packages/shared/prisma/schema.prisma) — скрипт"
  echo "не запускаем, разбираемся вручную (колонки Prisma = camelCase в кавычках)."
  exit 1
fi

# --- Проверка 2: пользователь с этим email существует (ровно один) ---------
user_row=$("${PSQL[@]}" -t -A -F '|' -c \
  "SELECT id, username, status, email FROM users WHERE email = '$TARGET_EMAIL';")
user_count=$(printf '%s' "$user_row" | grep -c . || true)

if [ "$user_count" -eq 0 ]; then
  echo "Пользователь с email $TARGET_EMAIL НЕ найден — чистить нечего (уже чисто"
  echo "или чистка выполнена ранее). Проверьте привязки Яндекса вручную:"
  "${PSQL[@]}" -c "SELECT oa.provider, oa.\"providerId\", u.username, u.status FROM oauth_accounts oa JOIN users u ON u.id = oa.\"userId\" WHERE oa.provider = 'yandex' AND u.status <> 'active';" || true
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
  "SELECT provider, \"providerId\" FROM oauth_accounts WHERE \"userId\" = '$user_id';")
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
# INSERT'ы генерируем через format() + %L — он сам экранирует кавычки и NULL'ы
# (ручная склейка строк ломалась на любых спецсимволах в токенах).
backup_sql="SELECT format(
  'INSERT INTO oauth_accounts (id, \"userId\", provider, \"providerId\", \"accessToken\", \"refreshToken\", \"expiresAt\", \"createdAt\", \"updatedAt\") VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L);',
  id, \"userId\", provider, \"providerId\", \"accessToken\", \"refreshToken\", \"expiresAt\", \"createdAt\", \"updatedAt\")
FROM oauth_accounts WHERE \"userId\" = '$user_id';"
{
  echo "-- P33 backup $ts: user $user_id ($user_username), email $TARGET_EMAIL"
  echo "-- восстановление email (при необходимости):"
  echo "UPDATE users SET email = '$TARGET_EMAIL' WHERE id = '$user_id';"
  echo "-- удалённые oauth_accounts (восстановление):"
  printf '%s\n' "$backup_sql" | "${PSQL_RAW[@]}" -f -
} > "$backup"
chmod 600 "$backup"

# --- Проверка 5: бэкап не пуст ----------------------------------------------
if [ ! -s "$backup" ]; then
  echo "ОШИБКА: бэкап пуст ($backup). Ничего не меняем."
  exit 1
fi
# 5b: в файле действительно SQL, а не CSV-кавычки/мусор
if ! grep -q '^UPDATE users SET email' "$backup"; then
  echo "ОШИБКА: бэкап не похож на SQL ($backup). Ничего не меняем."
  cat "$backup"
  exit 1
fi
echo
echo "Бэкап: $backup ($(wc -l < "$backup") строк)"

# --- Транзакция: снять привязки + освободить email (атомарно) ---------------
echo
echo "Выполняю транзакцию: DELETE oauth_accounts + UPDATE users.email = NULL ..."
tx_sql="BEGIN;
DELETE FROM oauth_accounts WHERE \"userId\" = '$user_id';
UPDATE users SET email = NULL, \"updatedAt\" = EXTRACT(EPOCH FROM now())::bigint WHERE id = '$user_id';
COMMIT;"
printf '%s\n' "$tx_sql" | "${PSQL_RAW[@]}" -f -

# --- Проверки 6-7: состояние «после» -----------------------------------------
after_email=$("${PSQL[@]}" -t -A -c "SELECT COALESCE(email, '<NULL>') FROM users WHERE id = '$user_id';")
after_bindings=$("${PSQL[@]}" -t -A -c "SELECT COUNT(*) FROM oauth_accounts WHERE \"userId\" = '$user_id';")

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
echo "Откат (если понадобится):"
echo "  docker exec -i $PG_CONTAINER psql -U balloo -d balloo -v ON_ERROR_STOP=1 < $backup"
