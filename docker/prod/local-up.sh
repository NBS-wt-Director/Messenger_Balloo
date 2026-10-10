#!/usr/bin/env bash
# ============================================================
# Balloo — локальный прод-визард (Docker)
# ============================================================
# Поднимает прод-стек на dev-машине и прогоняет полный цикл:
# образы -> контейнеры -> миграции Prisma -> seed -> smoke.
#
# Конфигурация: этот же каталог, файл .env.production
# (пароль БД берётся из DATABASE_URL, порт web — из VITE_WEB_HOST_PORT).
#
# Запуск:  ./local-up.sh
# Сброс:   ./local-up.sh --reset   (остановка + очистка томов)
# Только БД: ./local-up.sh --db-only  (postgres без сборки образов)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.local.yml"
ENV_FILE=".env.production"
PROJECT_NAME="balloo-local"
WEB_CONTAINER="balloo-web"
SERVER_CONTAINER="balloo-server"
POSTGRES_CONTAINER="balloo-postgres"
REDIS_CONTAINER="balloo-redis"
POSTFIX_CONTAINER="balloo-postfix"

MODE="full"
case "${1:-}" in
  --reset)   MODE="reset" ;;
  --db-only) MODE="db-only" ;;
esac

# ---------- цвета ----------
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}══ $1 ${NC}"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${DIM}$1${NC}"; }

# ---------- compose ----------
compose() {
  docker compose -p "$PROJECT_NAME" \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" "$@"
}

# ---------- чтение конфигурации из .env.production ----------
# Берём ключ из файла, не полагаясь на то, что он экспортирован в shell:
# compose читает .env.production сам, а наши прямые команды (prisma, curl) — нет.
env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -1 || true)"
  echo "${line#${key}=}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

# postgres://user:pass@host:port/db?schema=public -> отдельные части
parse_database_url() {
  local raw="$1"
  local without_scheme="${raw#*://}"
  local userinfo="${without_scheme%%@*}"
  local hostpart="${without_scheme#*@}"
  DB_USER="${userinfo%%:*}"
  DB_PASSWORD="${userinfo#*:}"
  local hostport="${hostpart%%/*}"
  local pathpart="${hostpart#*/}"
  DB_NAME="${pathpart%%\?*}"
  DB_HOST="${hostport%%:*}"
  DB_PORT="${hostport##*:}"
  [ "$DB_PORT" = "$hostport" ] && DB_PORT=5432
}

# ---------- 0. Preflight ----------
preflight() {
  step "0/5  Preflight"

  command -v docker >/dev/null 2>&1 || { err "docker не найден"; exit 1; }
  docker compose version >/dev/null 2>&1 || { err "docker compose plugin не найден"; exit 1; }
  ok "docker + compose v2"

  [ -f "$ENV_FILE" ] || {
    err "$ENV_FILE не найден. Скопируйте пример и заполните значения:"
    echo -e "    ${DIM}cp .env.production.example .env.production${NC}"
    exit 1
  }
  ok "$ENV_FILE"

  DATABASE_URL="$(env_value DATABASE_URL)"
  [ -n "$DATABASE_URL" ] || { err "DATABASE_URL пуст в $ENV_FILE"; exit 1; }
  parse_database_url "$DATABASE_URL"

  WEB_PORT="$(env_value VITE_WEB_HOST_PORT)"; WEB_PORT="${WEB_PORT:-8090}"
  SERVER_PORT="$(env_value SERVER_HOST_PORT)"; SERVER_PORT="${SERVER_PORT:-3100}"
  REDIS_PASSWORD="$(env_value REDIS_PASSWORD)"
  SMTP_HOST="$(env_value SMTP_HOST)"

  # Порты должны быть свободны: иначе контейнеры не поднимутся, а ошибка
  # compose про порт неочевидна для того, кто запускает визард впервые.
  local port owner
  for port in "$WEB_PORT" "$SERVER_PORT"; do
    owner="$(ss -ltnp 2>/dev/null | awk -v p=":${port}\$" '$4 ~ p {print $NF; exit}')"
    [ -z "$owner" ] && ok "порт $port свободен" || warn "порт $port занят ($owner)"
  done

  # Секреты, без которых стек поднимется, но функции не работают.
  local empty=()
  local key
  for key in VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY YANDEX_CLIENT_ID VK_CLIENT_ID MAILRU_CLIENT_ID YOOKASSA_API_KEY SMTP_PASSWORD; do
    [ -z "$(env_value "$key")" ] && empty+=("$key")
  done
  if [ ${#empty[@]} -gt 0 ]; then
    warn "пустые значения в $ENV_FILE (${#empty[@]}): ${empty[*]}"
    info "стек заработает, но push / OAuth / приём платежей / почта — нет"
  else
    ok "все ключевые секреты заполнены"
  fi

  # Единственный источник правды по данным — mockups/, сверяем наличие.
  [ -f "$REPO_ROOT/mockups/data_schema.json" ] \
    && ok "mockups/data_schema.json на месте" \
    || warn "mockups/data_schema.json не найден — схему не с чем сверить"
}

# ---------- 1. Сборка ----------
build_images() {
  step "1/5  Сборка образов (web + server)"
  info "первый прогон долгий: pnpm install + tsc + vite build + prisma generate"
  compose build
  ok "образы собраны"
}

# ---------- 2. Контейнеры ----------
start_containers() {
  step "2/5  Контейнеры"
  compose up -d
  info "ожидание postgres (макс. 60 с)"
  local i
  for i in $(seq 1 30); do
    if compose exec -T postgres pg_isready -U "${DB_USER:-balloo}" -d "${DB_NAME:-balloo}" >/dev/null 2>&1; then
      ok "postgres готов"; break
    fi
    [ "$i" -eq 30 ] && { err "postgres не готов за 60 с"; compose ps; exit 1; }
    sleep 2
  done
  compose ps
}

# ---------- 3. Миграции ----------
# 16 файлов в packages/shared/prisma/migrations — единственный источник
# схемы для прод-БД. apply-drift.sql существует под этим именем только в
# git (untracked), в файловой системе его нет, поэтому он не используется.
run_migrations() {
  step "3/5  Миграции Prisma (migrate deploy)"
  info "контейнер: $SERVER_CONTAINER, DATABASE_URL из $ENV_FILE"

  # prisma CLI берёт datasource из env("DATABASE_URL"): без явной передачи
  # команды в контейвере падает с "Environment variable not found: DATABASE_URL".
  local envargs=(-e "DATABASE_URL=$DATABASE_URL")

  local before after
  before="$(compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "select count(*) from information_schema.tables where table_schema='public'" 2>/dev/null || echo '?')"

  compose exec -T "${envargs[@]}" "$SERVER_CONTAINER" \
    npx prisma migrate deploy --schema=packages/shared/prisma/schema.prisma

  after="$(compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "select count(*) from information_schema.tables where table_schema='public'" 2>/dev/null || echo '?')"
  ok "таблиц в public: было $before → стало $after"

  applied="$(compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "select count(*) from _prisma_migrations" 2>/dev/null || echo '?')"
  ok "применено миграций в _prisma_migrations: $applied"
}

# ---------- 4. Seed ----------
# seed.ts живёт в packages/shared/prisma, его исполнители — DATABASE_URL +
# bcryptjs + ts-node. ts-node ставится в образ server (Dockerfile.server).
run_seed() {
  step "4/5  Seed (справочные данные из packages/shared/prisma/seed.ts)"

  local envargs=(-e "DATABASE_URL=$DATABASE_URL")
  local out
  out="$(compose exec -T "${envargs[@]}" -w /app/packages/shared "$SERVER_CONTAINER" \
    npx ts-node prisma/seed.ts 2>&1)" || {
      err "seed упал:"
      echo "$out" | tail -20
      return 1
    }

  echo "$out" | tail -12

  # Проверка по строкам, а не «команда вернула 0»: seed обязан заполнить таблицы.
  local table count
  for table in donate_tiers onboarding_steps text_pages blog_categories \
               knowledge_categories application_stages feature_categories; do
    count="$(compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
      "select count(*) from $table" 2>/dev/null || echo 'ошибка')"
    if [ "$count" != "0" ] && [ "$count" != "ошибка" ] && [ "$count" != "?" ]; then
      ok "  $table: $count строк"
    else
      err "  $table: $count строк — seed не заполнил таблицу"
    fi
  done

  # Переводы — отдельная проверка: без них интерфейс на не-RU пустой.
  local tr
  tr="$(compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "select count(*) from onboarding_step_translations" 2>/dev/null || echo '?')"
  ok "onboarding_step_translations: $tr строк переводов"
}

# ---------- 5. Smoke ----------
smoke_test() {
  step "5/5  Smoke-проверка"

  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT/" 2>/dev/null || echo "000")"
  [ "$code" = "200" ] && ok "web: HTTP $code (http://localhost:$WEB_PORT/)" \
                      || err "web: HTTP $code (ожидался 200)"

  # /health закрыт auth_basic — 401 без учётки является ожидаемым ответом.
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT/health" 2>/dev/null || echo "000")"
  [ "$code" = "200" ] || [ "$code" = "401" ] \
    && ok "health: HTTP $code (401 = auth_basic, норма)" \
    || warn "health: HTTP $code"

  code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SERVER_PORT/api/health" 2>/dev/null || echo "000")"
  [ "$code" = "200" ] && ok "api: HTTP $code (http://localhost:$SERVER_PORT/api/health)" \
                      || warn "api: HTTP $code"

  compose exec -T redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q PONG \
    && ok "redis: PONG" || warn "redis: нет PONG"

  compose exec -T "$POSTGRES_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 \
    && ok "postgres: готов" || warn "postgres: не готов"

  [ -n "$SMTP_HOST" ] \
    && compose exec -T "$POSTFIX_CONTAINER" postconf mail_version >/dev/null 2>&1 \
       && ok "postfix: SMTP_HOST=$SMTP_HOST" \
       || warn "postfix: не отвечает (почтовые функции недоступны)" \
    || info "SMTP_HOST пуст — postfix не поднимается, почта отключена"
}

# ---------- reset ----------
reset_stack() {
  step "Остановка и очистка стека"
  compose down -v --remove-orphans 2>/dev/null || true
  docker volume ls -q -f "name=$PROJECT_NAME" | xargs -r docker volume rm 2>/dev/null || true
  ok "стек остановлен, тома удалены"
}

# ---------- главный ----------
main() {
  echo -e "\n${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║  Balloo — локальный прод (Docker)                    ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"

  case "$MODE" in
    reset)
      reset_stack
      exit 0
      ;;
    db-only)
      preflight
      start_containers
      ok "подняты только сервисы данных; сборка образов не требовалась"
      exit 0
      ;;
    full)
      preflight
      build_images
      start_containers
      run_migrations
      run_seed
      smoke_test
      ;;
  esac

  echo -e "\n${GREEN}${BOLD}  Готово.${NC}"
  echo -e "  ${BOLD}Web:${NC}       http://localhost:${WEB_PORT}/"
  echo -e "  ${BOLD}API:${NC}       http://localhost:${SERVER_PORT}/api"
  echo -e "  ${BOLD}Swagger:${NC}   http://localhost:${SERVER_PORT}/api/docs"
  echo -e "  ${BOLD}MinIO:${NC}     http://localhost:9001 (minioadmin/minioadmin123)"
  echo -e "  ${BOLD}Postgres:${NC}  postgresql://${DB_USER}:***@localhost:5432/${DB_NAME}\n"
  info "Остановка: ./local-up.sh --reset"
}

main
