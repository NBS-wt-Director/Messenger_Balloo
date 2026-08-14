#!/usr/bin/env bash
# ============================================
# Balloo Messenger — Генератор production-секретов
# ============================================
# Запуск: bash scripts/generate-secrets.sh
# Выводит в терминал все секреты для .env.production
# ============================================

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_secret() {
    local name="$1"
    local value="$2"
    echo -e "  ${GREEN}$name${NC} ="
    echo -e "  ${YELLOW}$value${NC}"
    echo ""
}

print_warning() {
    echo -e "  ${YELLOW}⚠  $1${NC}"
}

print_info() {
    echo -e "  ${CYAN}ℹ  $1${NC}"
}

# Генерация случайной строки
generate_random() {
    openssl rand -base64 48
}

# Генерация VAPID ключей
generate_vapid_keys() {
    npx --yes web-push generate-vapid-keys 2>/dev/null
}

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Balloo Messenger — Production Secrets Generator        ║${NC}"
echo -e "${GREEN}║  Ubuntu Server 24.04 LTS                                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

# ─── 1. PostgreSQL Password ───
print_header "1️⃣  PostgreSQL Password"
PG_PASS=$(generate_random)
print_secret "POSTGRES_PASSWORD" "$PG_PASS"

# ─── 2. Redis Password ───
print_header "2️⃣  Redis Password"
REDIS_PASS=$(generate_random)
print_secret "REDIS_PASSWORD" "$REDIS_PASS"

# ─── 3. JWT Secrets ───
print_header "3️⃣  JWT Secrets (минимум 32 символа)"
JWT_ACCESS=$(generate_random)
JWT_REFRESH=$(generate_random)
print_secret "JWT_ACCESS_SECRET" "$JWT_ACCESS"
print_secret "JWT_REFRESH_SECRET" "$JWT_REFRESH"

# ─── 4. Setup Passwords ───
print_header "4️⃣  Setup Passwords (для initial install)"
echo -e "  ${GREEN}ADMIN_INSTALL_PASSWORD${NC} ="
echo -e "  ${YELLOW}131013${NC}"
echo ""
echo -e "  ${GREEN}SETUP_PASSWORD${NC} ="
echo -e "  ${YELLOW}$(generate_random | tr -dc 'a-zA-Z0-9' | head -c 16)${NC}"
echo ""

# ─── 5. MinIO Credentials ───
print_header "5️⃣  MinIO Credentials (если используешь self-hosted)"
MINIO_ACCESS=$(generate_random)
MINIO_SECRET=$(generate_random)
print_secret "MINIO_ACCESS_KEY" "$MINIO_ACCESS"
print_secret "MINIO_SECRET_KEY" "$MINIO_SECRET"

# ─── 6. Сводка ───
print_header "📋  СВОДКА СЕКРЕТОВ"
echo -e "${GREEN}Скопируйте значения ниже в .env.production:${NC}"
echo ""
echo "# PostgreSQL"
echo "POSTGRES_PASSWORD=$PG_PASS"
echo ""
echo "# Redis"
echo "REDIS_PASSWORD=$REDIS_PASS"
echo ""
echo "# JWT"
echo "JWT_ACCESS_SECRET=$JWT_ACCESS"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH"
echo ""
echo "# Setup"
echo "ADMIN_INSTALL_PASSWORD=131013"
echo ""
echo "# MinIO (self-hosted)"
echo "MINIO_ACCESS_KEY=$MINIO_ACCESS"
echo "MINIO_SECRET_KEY=$MINIO_SECRET"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ОСТАЛЬНЫЕ СЕКРЕТЫ (OAuth, SMTP, YooKassa, VAPID) нужно${NC}"
echo -e "${YELLOW}ЗАПОЛНИТЬ ВРУЧНУЮ — они требуют внешних аккаунтов.${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ─── 7. VAPID Keys (опционально) ───
print_header "🔔  VAPID Keys (Push Notifications)"
print_info "Установите web-push: npm install -g web-push"
print_info "Затем выполните: web-push generate-vapid-keys"
echo ""

# ─── 8. OAuth (Инструкция) ───
print_header "🔐  OAuth (Yandex, VK, Mail.ru)"
echo -e "  ${CYAN}Эти ключи нужно получить в консолях разработчиков:${NC}"
echo ""
echo -e "  ${GREEN}Yandex:${NC} https://oauth.yandex.ru/client/new"
echo -e "  ${GREEN}VK:${NC}     https://vk.com/apps?act=manage"
echo -e "  ${GREEN}Mail.ru:${NC} https://oauth.ok.ru/stopapp"
echo ""
echo -e "  ${YELLOW}⚠ Redirect URI для production:${NC}"
echo -e "  https://app.balloo.su/api/auth/oauth/{provider}/callback"
echo ""

# ─── 9. YooKassa ───
print_header "💳  YooKassa (ЮKassa)"
echo -e "  ${GREEN}Личный кабинет:${NC} https://yookassa.ru/"
echo -e "  ${GREEN}API ключ:${NC} Настройки → API → Ключ API"
echo ""

# ─── 10. SMTP ───
print_header "📧  SMTP (Email)"
echo -e "  ${GREEN}Варианты:${NC}"
echo -e "  1. Self-hosted Postfix (см. docs/06-devops-infrastructure.md)"
echo -e "  2. Mail.ru для домена: https://store.mail.ru/cloud/smtp"
echo -e "  3. Yandex 360: https://360.yandex.ru/business/"
echo ""

echo -e "${GREEN}✅ Генерация завершена!${NC}"
echo -e "${GREEN}Следующий шаг:${NC} скопируйте секреты в .env.production"
