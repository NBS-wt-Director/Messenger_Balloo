#!/bin/bash
# ============================================
# Balloo Messenger - Production Deploy Script
# Version: 1.0 | Date: 2026-07-30
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_DIR="${SCRIPT_DIR}/../docker/prod"
LOG_FILE="${PROD_DIR}/logs/deploy-$(date +%Y%m%d_%H%M%S).log"
COMPOSE_FILE="${PROD_DIR}/docker-compose.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $1" | tee -a "$LOG_FILE"
}
success() { echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"; }

preflight() {
    log "Pre-flight checks..."
    command -v docker &> /dev/null || { error "Docker not installed"; exit 1; }
    command -v docker-compose &> /dev/null || { error "Docker Compose not installed"; exit 1; }
    if [ ! -f "${PROD_DIR}/.env.production" ]; then
        error ".env.production not found in $PROD_DIR"
        exit 1
    fi
    mkdir -p "$(dirname "$LOG_FILE")"
    success "Pre-flight checks passed"
}

backup_current() {
    log "Making backup..."
    mkdir -p "${PROD_DIR}/backups"
    if [ -f "$COMPOSE_FILE" ]; then
        cp "$COMPOSE_FILE" "${PROD_DIR}/backups/docker-compose.yml.bak.$(date +%Y%m%d_%H%M%S)"
        success "docker-compose.yml backed up"
    fi
    log "Database backup..."
    docker exec balloo-postgres-prod pg_dump -U "${POSTGRES_USER:-balloo}" "${POSTGRES_DB:-balloo}" \
        | gzip > "${PROD_DIR}/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz" 2>/dev/null || \
        warn "DB backup skipped (postgres may not be running)"
}

pull_images() {
    log "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    success "Images pulled"
}

run_migrations() {
    log "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" run --rm server \
        npx prisma migrate deploy || {
            error "Migrations failed!"
            docker-compose -f "$COMPOSE_FILE" up -d postgres redis minio
            exit 1
        }
    success "Migrations completed"
}

deploy() {
    log "Deploying..."
    log "Building images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache || { error "Build failed!"; exit 1; }
    success "Images built"
    log "Stopping current containers..."
    docker-compose -f "$COMPOSE_FILE" down || true
    log "Starting containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    success "Containers started"
}

healthcheck() {
    log "Running health checks..."
    local max_retries=30 retry=0
    while [ $retry -lt $max_retries ]; do
        if curl -sf http://localhost:3100/health > /dev/null 2>&1; then
            success "Server is healthy"
            break
        fi
        retry=$((retry + 1))
        [ $retry -eq $max_retries ] && { error "Server health check failed"; return 1; }
        sleep 2
    done
    success "All health checks passed"
}

cleanup() {
    log "Cleaning up..."
    docker image prune -f
    find "${PROD_DIR}/backups" -name "*.bak.*" -mtime +30 -delete 2>/dev/null || true
    find "${PROD_DIR}/backups" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
    success "Cleanup completed"
}

rollback() {
    log "Rolling back..."
    local latest_backup=$(ls -t "${PROD_DIR}/backups"/docker-compose.yml.bak.* 2>/dev/null | head -1)
    if [ -z "$latest_backup" ]; then error "No backup found"; exit 1; fi
    cp "$latest_backup" "$COMPOSE_FILE"
    docker-compose -f "$COMPOSE_FILE" down
    docker-compose -f "$COMPOSE_FILE" up -d
    success "Rollback completed"
}

main() {
    local command="${1:-deploy}"
    case "$command" in
        deploy) preflight; backup_current; pull_images; run_migrations; deploy; healthcheck; cleanup; success "Deployment completed!";;
        rollback) rollback;;
        status) log "Deployment status:"; docker-compose -f "$COMPOSE_FILE" ps;;
        logs) docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f;;
        help|--help|-h) echo "Usage: $0 [deploy|rollback|status|logs|help]";;
        *) error "Unknown command: $command"; exit 1;;
    esac
}

main "$@"
