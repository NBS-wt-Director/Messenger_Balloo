#!/usr/bin/env bash
# Apply the rotated postgres password to the ALREADY INITIALISED cluster.
#
# POSTGRES_PASSWORD in the env file only affects first-time initdb, so an
# existing volume keeps the old password until ALTER USER is run.
#
# Run AFTER rotate-secrets.mjs and BEFORE `docker compose up -d --force-recreate`.
# The password is read from .env.production, never passed on the command line,
# so it does not land in ~/.bash_history.
set -euo pipefail

cd "$(dirname "$0")"
ENV_FILE=.env.production

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found in $(pwd)" >&2
  exit 1
fi

read_key() {
  # last assignment wins, value taken verbatim after the first '='
  grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2-
}

PG_USER="$(read_key POSTGRES_USER)"; PG_USER="${PG_USER:-balloo}"
PG_DB="$(read_key POSTGRES_DB)";     PG_DB="${PG_DB:-balloo}"
PG_PASS="$(read_key POSTGRES_PASSWORD)"

if [ -z "$PG_PASS" ]; then
  echo "ERROR: POSTGRES_PASSWORD is empty in $ENV_FILE" >&2
  exit 1
fi

# The generated password is hex-only, so quoting inside the SQL literal is safe.
case "$PG_PASS" in
  *[\'\"\]*) echo "ERROR: POSTGRES_PASSWORD contains quote/backslash chars; fix it before rotating" >&2; exit 1 ;;
esac

echo "rotating postgres password for user '$PG_USER' ..."
printf "ALTER USER \"%s\" WITH PASSWORD '%s';\n" "$PG_USER" "$PG_PASS" \
  | docker exec -i balloo-postgres psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1

echo "ALTER USER ok."
echo "Next: docker compose -f docker-compose.local.yml --env-file .env.production up -d --force-recreate"
