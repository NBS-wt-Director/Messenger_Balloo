#!/bin/bash
# ============================================
# Balloo Messenger — Production Secrets Generator
# Генерирует все необходимые секреты для production
# ============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

# ─── Output directory ───
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_DIR="${SCRIPT_DIR}/../docker/prod"
OUTPUT_FILE="${PROD_DIR}/.env.production"

# ─── Generate random string ───
generate_secret() {
    openssl rand -hex 32
}

# ─── Generate VAPID keypair ───
# Валидная VAPID-пара бывает только в формате web-push: publicKey — несжатая
# точка P-256 (65 байт = 86–87 символов base64url), privateKey — 32 байта
# (43 символа). Случайные строки такой пары НЕ дают: web-push отвергает ключ
# синхронно при старте сервера. Фолбэк на openssl удалён — он производил ровно
# такие невалидные значения (тикет 1793615244: в .env.production public/private
# 32/32 байта → balloo-server в crash-loop).
generate_vapid_keys() {
    # log() пишет в stdout, а вывод функции захватывают через $(...) и разбирают
    # head/tail: без >&2 строка '[INFO] Generating VAPID keypair...' попала бы в
    # VAPID_PRIVATE_KEY (head -1).
    log "Generating VAPID keypair..." >&2
    if ! command -v node &> /dev/null; then
        echo "ERROR: node не найден — валидную VAPID-пару сгенерировать нечем." >&2
        exit 1
    fi
    local keys
    keys=$(cd "${SCRIPT_DIR}/../packages/server" && node -e "
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys.privateKey);
console.log(vapidKeys.publicKey);
" 2>&1) || {
        echo "ERROR: web-push не сгенерировал пару:" >&2
        echo "$keys" >&2
        echo "       Установите зависимость: pnpm --filter @balloo/server install" >&2
        exit 1
    }
    local private_key=$(echo "$keys" | head -1)
    local public_key=$(echo "$keys" | tail -1)
    # Проверка формы (в лог идут только длины в байтах, не значения)
    local key_bytes
    key_bytes=$(node -e "
const d = (v) => Buffer.from(String(v), 'base64url').length;
console.log(d(process.argv[1]) + ' ' + d(process.argv[2]));
" "$private_key" "$public_key")
    if [ "$key_bytes" != "32 65" ]; then
        echo "ERROR: web-push вернул ключи неожиданной формы (private/public байт: ${key_bytes}; нужно 32 65)." >&2
        exit 1
    fi
    echo "$private_key"
    echo "$public_key"
}

# ─── Generate all secrets ───
main() {
    echo "================================================"
    echo " Balloo Messenger — Production Secrets Generator"
    echo "================================================"
    echo ""
    
    # Check if output file already exists
    if [ -f "$OUTPUT_FILE" ]; then
        warn "File $OUTPUT_FILE already exists"
        read -p "Overwrite? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log "Aborted"
            exit 0
        fi
    fi
    
    log "Generating secrets..."
    echo ""
    
    # PostgreSQL
    local PG_PASSWORD=$(generate_secret)
    log "POSTGRES_PASSWORD: ${PG_PASSWORD:0:8}..."
    
    # Redis
    local REDIS_PASSWORD=$(generate_secret)
    log "REDIS_PASSWORD: ${REDIS_PASSWORD:0:8}..."
    
    # JWT secrets
    local JWT_ACCESS_SECRET=$(generate_secret)
    log "JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:0:8}..."
    
    local JWT_REFRESH_SECRET=$(generate_secret)
    log "JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:8}..."
    
    # MinIO
    local MINIO_ROOT_USER="balloo-minio"
    local MINIO_ROOT_PASSWORD=$(generate_secret)
    log "MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:0:8}..."
    
    # Grafana
    local GRAFANA_ADMIN_PASSWORD=$(generate_secret)
    log "GRAFANA_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:0:8}..."
    
    # Admin setup
    local ADMIN_INSTALL_PASSWORD=$(generate_secret)
    log "ADMIN_INSTALL_PASSWORD: ${ADMIN_INSTALL_PASSWORD:0:8}..."
    
    # VAPID keys
    local VAPID_KEYS=$(generate_vapid_keys)
    local VAPID_PRIVATE_KEY=$(echo "$VAPID_KEYS" | head -1)
    local VAPID_PUBLIC_KEY=$(echo "$VAPID_KEYS" | tail -1)
    log "VAPID keys generated"
    
    echo ""
    echo "================================================"
    log "Writing secrets to $OUTPUT_FILE"
    echo "================================================"
    echo ""
    
    # Write .env.production
    cat > "$OUTPUT_FILE" <<EOF
# ============================================
# Balloo Messenger — Production Environment
# Сгенерировано: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ============================================
# ⚠️  ДЕРЖИТЕ ЭТОТ ФАЙЛ В БЕЗОПАСНОМ МЕСТЕ!
# ⚠️  НЕ КОМИТЬТЕ В GIT!
# ============================================

# --- PostgreSQL ---
POSTGRES_USER=balloo
POSTGRES_PASSWORD=${PG_PASSWORD}
POSTGRES_DB=balloo

# --- Redis ---
REDIS_PASSWORD=${REDIS_PASSWORD}

# --- JWT ---
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=2592000

# --- Server ---
SERVER_PORT=3000
SERVER_HOST=0.0.0.0
NODE_ENV=production

# --- CORS ---
CORS_ORIGIN=https://balloo.su

# --- OAuth (заполните вашими ключами) ---
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_REDIRECT_URI=https://balloo.su/api/auth/oauth/yandex/callback

VK_CLIENT_ID=
VK_CLIENT_SECRET=
VK_REDIRECT_URI=https://balloo.su/api/auth/oauth/vk/callback

MAIL_CLIENT_ID=
MAIL_CLIENT_SECRET=
MAIL_REDIRECT_URI=https://balloo.su/api/auth/oauth/mail/callback

# --- Email (SMTP) — self-hosted Postfix по умолчанию ---
# Для production: SMTP_HOST=smtp.mail.ru, SMTP_PORT=465, SMTP_TLS=true
SMTP_HOST=
SMTP_PORT=25
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@balloo.su
SMTP_TLS=false

# --- CDN / Storage (MinIO) ---
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_ENDPOINT=
MINIO_PORT=9000
MINIO_BUCKET=balloo-media
MINIO_USE_SSL=false

# --- Push Notifications (VAPID Web Push) ---
VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
VAPID_SUBJECT=mailto:admin@balloo.su

# --- Payments (ЮKassa — ЗАГЛУШКА) ---
# В v1: Донаты только по СБП (+79122023035, QR-код)
# ЮKасса будет подключена позже
YOOKASSA_SHOP_ID=
YOOKASSA_API_KEY=
YOOKASSA_WEBHOOK_URL=https://api.balloo.su/api/payments/webhook/yookassa

# --- Monitoring ---
PROMETHEUS_ENABLED=false
PROMETHEUS_PORT=9090

# --- Setup ---
ADMIN_INSTALL_PASSWORD=${ADMIN_INSTALL_PASSWORD}
SETUP_PASSWORD=

# --- Report Issue Channels ---
REPORT_ISSUE_TELEGRAM=https://t.me/balloo_support
REPORT_ISSUE_VK=https://vk.com/balloo_support

# --- File Upload ---
MAX_FILE_SIZE=52428800
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_FILE_TYPES=application/pdf,application/zip,application/doc,application/docx
EOF
    
    success "Secrets written to $OUTPUT_FILE"
    
    # Set restrictive permissions
    chmod 600 "$OUTPUT_FILE"
    success "Permissions set to 600 (owner read/write only)"
    
    echo ""
    echo "================================================"
    echo " СЛЕДУЮЩИЕ ШАГИ:"
    echo "================================================"
    echo " 1. Заполните OAuth секцию (Yandex, VK, Mail)"
    echo " 2. Заполните SMTP для email (self-hosted Postfix по умолчанию)"
    echo " 3. ЮKасса — ЗАГЛУШКА: донаты только по СБП (+79122023035, QR-код)"
    echo " 4. Настройте SSL-сертификаты (см. ssl-setup.sh)"
    echo " 5. Запустите: docker compose -f docker/prod/docker-compose.yml up -d"
    echo "================================================"
    echo ""
    warn "⚠️  НЕ КОМИТЬТЕ .env.production В GIT!"
}

main "$@"
