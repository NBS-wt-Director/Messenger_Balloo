#!/bin/sh
# ============================================================
# Balloo Server — Docker Entrypoint
# Применяет миграции Prisma и seed перед запуском приложения.
# ============================================================
#
# Переменные окружения:
#   RUN_MIGRATIONS — "0" = пропустить, "1" (по умолч.) = применить.
#   RUN_SEED       — "0" = пропустить, "1" (по умолч.) = запустить.
#
# Примечание: seed идемпотентен (использует findFirst/upsert вместо create),
# поэтому безопасно запускать при каждом старте контейнера.
# ============================================================

set -e

SHARED="/app/packages/shared"

# ─── Миграции ───────────────────────────────────────────────
if [ "${RUN_MIGRATIONS:-1}" != "0" ]; then
  echo "[entrypoint] Applying Prisma migrations (prisma migrate deploy)..."
  if (cd "$SHARED" && prisma migrate deploy); then
    echo "[entrypoint] Migrations applied."
  else
    echo "[entrypoint] ERROR: prisma migrate deploy failed." >&2
    exit 1
  fi
else
  echo "[entrypoint] Skipping migrations (RUN_MIGRATIONS=0)."
fi

# ─── Seed ───────────────────────────────────────────────────
if [ "${RUN_SEED:-1}" != "0" ]; then
  if [ -f "$SHARED/prisma/seed.js" ]; then
    echo "[entrypoint] Seeding (node prisma/seed.js)..."
    if (cd "$SHARED" && node prisma/seed.js); then
      echo "[entrypoint] Seed OK."
    else
      echo "[entrypoint] WARNING: seed failed, continuing startup." >&2
    fi
  else
    echo "[entrypoint] Seed disabled: seed.js not found."
  fi
else
  echo "[entrypoint] Skipping seed (RUN_SEED=0)."
fi

# ─── Запуск приложения ──────────────────────────────────────
exec "$@"
