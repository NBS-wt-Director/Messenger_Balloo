#!/bin/bash
# ============================================
# Balloo Messenger - Production Backup Script
# Version: 1.0 | Date: 2026-07-30
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_DIR="${SCRIPT_DIR}/../docker/prod"
BACKUP_DIR="${PROD_DIR}/backups"
LOG_FILE="${PROD_DIR}/logs/backup-$(date +%Y%m%d_%H%M%S).log"
RETENTION_DAYS=30

# Yandex Object Storage settings
UPLOAD_TO_YANDEX="${UPLOAD_TO_YANDEX:-false}"
YANDEX_BUCKET="${YANDEX_BUCKET:-balloo-backups}"

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

backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/db_backup_${timestamp}.sql"
    local backup_gz="${backup_file}.gz"

    log "Starting database backup..."
    mkdir -p "$BACKUP_DIR"

    docker exec balloo-postgres-prod pg_dump -U "${POSTGRES_USER:-balloo}" "${POSTGRES_DB:-balloo}" \
        2>/dev/null > "$backup_file" || {
            error "Database backup failed"
            return 1
        }

    local backup_size=$(du -sh "$backup_file" 2>/dev/null | cut -f1)
    success "Database backup: $backup_file ($backup_size)"

    log "Compressing..."
    gzip -f "$backup_file"
    success "Backup compressed: $backup_gz"
    echo "$backup_gz"
}

backup_minio() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/minio_backup_${timestamp}.tar.gz"

    log "Starting MinIO backup..."
    mkdir -p "$BACKUP_DIR"

    if docker ps --format '{{.Names}}' | grep -q "balloo-minio"; then
        docker cp balloo-minio-prod:/data "${BACKUP_DIR}/minio_data_${timestamp}" 2>/dev/null || {
            warn "MinIO backup skipped"
            return 1
        }
        tar -czf "$backup_file" -C "${BACKUP_DIR}" "minio_data_${timestamp}" 2>/dev/null || true
        rm -rf "${BACKUP_DIR}/minio_data_${timestamp}"
        success "MinIO backup: $backup_file"
        echo "$backup_file"
    else
        warn "MinIO not found, skipping"
        return 0
    fi
}

upload_to_yandex() {
    if [ "$UPLOAD_TO_YANDEX" != "true" ]; then
        log "Yandex Object Storage upload disabled"
        return 0
    fi

    log "Uploading to Yandex Object Storage..."
    if ! command -v yc &> /dev/null; then
        warn "yc CLI not found, skipping upload"
        return 0
    fi

    for backup_file in "${BACKUP_DIR}"/db_backup_*.sql.gz "${BACKUP_DIR}"/minio_backup_*.tar.gz; do
        if [ -f "$backup_file" ]; then
            local filename=$(basename "$backup_file")
            log "  Uploading: $filename"
            yc storage upload \
                --dest "gs://${YANDEX_BUCKET}/backups/$filename" \
                --source "$backup_file" \
                2>/dev/null || warn "Failed to upload $filename"
        fi
    done
    success "Upload to Yandex Object Storage completed"
}

cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "minio_backup_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
    find "${PROD_DIR}/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    success "Old backups cleaned up"
}

verify_backup() {
    local backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    log "Verifying backup integrity..."
    if [[ "$backup_file" == *.gz ]]; then
        gzip -t "$backup_file" 2>/dev/null || { error "Backup corrupted: $backup_file"; return 1; }
    else
        [ ! -s "$backup_file" ] && { error "Backup empty: $backup_file"; return 1; }
    fi
    success "Backup verified: $backup_file"
}

generate_report() {
    log "Backup report:"
    local db_backups=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" 2>/dev/null | wc -l)
    local minio_backups=$(find "$BACKUP_DIR" -name "minio_backup_*.tar.gz" 2>/dev/null | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log "  Database backups: $db_backups"
    log "  MinIO backups: $minio_backups"
    log "  Total size: $total_size"
}

main() {
    local command="${1:-full}"
    mkdir -p "${PROD_DIR}/logs"

    case "$command" in
        db) backup_database;;
        minio) backup_minio;;
        upload) upload_to_yandex;;
        cleanup) cleanup_old_backups;;
        verify)
            local backup_file=$(ls -t "${BACKUP_DIR}"/db_backup_*.sql.gz 2>/dev/null | head -1)
            if [ -n "$backup_file" ]; then verify_backup "$backup_file"; else error "No backup found"; fi
            ;;
        full)
            log "Starting full backup..."
            local db_backup=$(backup_database)
            backup_minio || true
            [ -n "$db_backup" ] && [ -f "$db_backup" ] && verify_backup "$db_backup"
            upload_to_yandex
            cleanup_old_backups
            generate_report
            success "Full backup completed!"
            ;;
        help|--help|-h) echo "Usage: $0 [db|minio|upload|cleanup|verify|full|help]";;
        *) error "Unknown command: $command"; exit 1;;
    esac
}

main "$@"
