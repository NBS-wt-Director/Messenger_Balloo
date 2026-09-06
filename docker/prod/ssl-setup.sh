#!/usr/bin/env bash
# ============================================
# Balloo Messenger — SSL Certificate Manager
# ============================================
# Автоматическое получение и обновление SSL-сертификатов Let's Encrypt
#
# Использование:
#   ./ssl-setup.sh                  # Получить сертификаты для всех доменов
#   ./ssl-setup.sh --renew          # Принудительно обновить все сертификаты
#   ./ssl-setup.sh --list           # Показать статус сертификатов
#   ./ssl-setup.sh --help           # Показать справку
#
# Критерий готовности тикета №7:
#   SSL-сертификаты генерируются автоматически через certbot
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SSL_DIR="$SCRIPT_DIR/ssl"
CERTBOT_DIR="$SCRIPT_DIR/certbot"
WEBROOT="$SCRIPT_DIR/certbot/webroot"

# ─── Домены Balloo ───
DOMAINS=(
    "balloo.su"
    "app.balloo.su"
    "admin.balloo.su"
    "features.balloo.su"
    "api.balloo.su"
    "download.balloo.su"
    "history.balloo.su"
    "command.balloo.su"
    "blog.balloo.su"
    "docs.balloo.su"
)

# ─── Цвета для вывода ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Проверка зависимостей ───
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен. Установите Docker перед запуском."
        exit 1
    fi

    if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
        log_error "Docker Compose не установлен."
        exit 1
    fi

    log_info "Зависимости проверены: Docker OK"
}

# ─── Инициализация директорий ───
init_dirs() {
    mkdir -p "$SSL_DIR"/{balloo.su,app.balloo.su,admin.balloo.su,features.balloo.su,api.balloo.su,download.balloo.su,history.balloo.su,command.balloo.su,blog.balloo.su,docs.balloo.su}
    mkdir -p "$WEBROOT"
    log_success "Директории созданы: $SSL_DIR, $WEBROOT"
}

# ─── Получить/обновить сертификат для одного домена ───
get_cert_for_domain() {
    local domain="$1"
    local cert_dir="$SSL_DIR/$domain"
    local email="${SSL_EMAIL:-admin@balloo.su}"
    local server="${ACME_SERVER:-https://acme-v02.api.letsencrypt.org/directory}"

    # Для staging используем --staging
    if [[ "${STAGING:-false}" == "true" ]]; then
        server="https://acme-staging-v02.api.letsencrypt.org/directory"
        log_warn "РЕЖИМ STAGING: используем staging ACME server"
    fi

    log_info "Запрашиваем сертификат для: $domain"

    docker run --rm -it \
        -v "$SCRIPT_DIR/certbot:/var/www/certbot" \
        -v "$cert_dir:/etc/letsencrypt" \
        certbot/certbot \
        certonly \
        --webroot \
        --webroot-path "/var/www/certbot" \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        --server "$server" \
        -d "$domain" 2>&1

    if [[ $? -eq 0 ]]; then
        log_success "Сертификат для $domain получен"
        return 0
    else
        log_error "Ошибка получения сертификата для $domain"
        return 1
    fi
}

# ─── Получить сертификаты для всех доменов ───
get_all_certs() {
    local domain
    local failed=()

    log_info "=========================================="
    log_info "Начинаем получение SSL-сертификатов"
    log_info "=========================================="

    init_dirs

    for domain in "${DOMAINS[@]}"; do
        if ! get_cert_for_domain "$domain"; then
            failed+=("$domain")
        fi
    done

    echo ""
    log_info "=========================================="
    if [[ ${#failed[@]} -eq 0 ]]; then
        log_success "Все сертификаты получены успешно!"
        log_info "Сертификаты сохранены в: $SSL_DIR"
        log_info "Для использования обновите nginx-production.conf"
    else
        log_error "Не удалось получить сертификаты для:"
        for d in "${failed[@]}"; do
            echo "  - $d"
        done
        exit 1
    fi
}

# ─── Принудительное обновление всех сертификатов ───
renew_all_certs() {
    log_info "=========================================="
    log_info "Принудительное обновление сертификатов"
    log_info "=========================================="

    for domain in "${DOMAINS[@]}"; do
        log_info "Обновляем: $domain"
        get_cert_for_domain "$domain" || true
    done

    log_success "Все сертификаты обновлены"
}

# ─── Показать статус сертификатов ───
list_certs() {
    log_info "=========================================="
    log_info "Статус SSL-сертификатов"
    log_info "=========================================="

    local domain cert_path expiry
    for domain in "${DOMAINS[@]}"; do
        cert_path="$SSL_DIR/$domain/fullchain.pem"
        if [[ -f "$cert_path" ]]; then
            expiry=$(openssl x509 -enddate -noout -in "$cert_path" 2>/dev/null | cut -d= -f2 || echo "неизвестно")
            log_success "$domain — истекает: $expiry"
        else
            log_warn "$domain — сертификат не найден"
        fi
    done
}

# ─── Настройка автоматического обновления (cron) ───
setup_auto_renew() {
    log_info "Настраиваем автоматическое обновление сертификатов (cron)"

    local cron_job="0 3 * * 1 docker compose -f $SCRIPT_DIR/docker-compose.prod.yml run --rm nginx certbot renew --quiet && docker compose -f $SCRIPT_DIR/docker-compose.prod.yml restart nginx"

    # Проверяем, есть ли уже такая запись
    if crontab -l 2>/dev/null | grep -q "balloo.*certbot"; then
        log_warn "Автоматическое обновление уже настроено"
        crontab -l | grep -v "balloo.*certbot" | crontab -
    fi

    (crontab -l 2>/dev/null || true; echo "$cron_job") | crontab -
    log_success "Автообновление настроено: каждый понедельник в 03:00"
}

# ─── Показать справку ───
show_help() {
    echo "Balloon Messenger — SSL Certificate Manager"
    echo ""
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  (без параметров)     Получить сертификаты для всех доменов"
    echo "  --renew              Принудительно обновить все сертификаты"
    echo "  --list               Показать статус сертификатов"
    echo "  --auto-renew         Настроить автоматическое обновление через cron"
    echo "  --staging            Исполь staging ACME server (для тестов)"
    echo "  --help               Показать эту справку"
    echo ""
    echo "Переменные окружения:"
    echo "  SSL_EMAIL            Email для Let's Encrypt (по умолчанию: admin@balloo.su)"
    echo "  STAGING=true         Исполь staging ACME server"
    echo "  ACME_SERVER=URL      Произвольный ACME server"
    echo ""
    echo "Домены Balloo:"
    printf "  %-25s Основной мессенджер\n" "balloo.su"
    printf "  %-25s Мобильное приложение\n" "app.balloo.su"
    printf "  %-25s Админ-панель\n" "admin.balloo.su"
    printf "  %-25s Фич-реквесты\n" "features.balloo.su"
    printf "  %-25s API и документация\n" "api.balloo.su"
    printf "  %-25s Загрузки\n" "download.balloo.su"
    printf "  %-25s История версий\n" "history.balloo.su"
    printf "  %-25s Портал сотрудников\n" "command.balloo.su"
    printf "  %-25s Корпоративный блог\n" "blog.balloo.su"
    printf "  %-25s API документация\n" "docs.balloo.su"
}

# ─── Main ───
main() {
    check_prerequisites

    case "${1:-}" in
        --renew)
            renew_all_certs
            ;;
        --list)
            list_certs
            ;;
        --auto-renew)
            setup_auto_renew
            ;;
        --staging)
            export STAGING=true
            get_all_certs
            ;;
        --help)
            show_help
            ;;
        "")
            get_all_certs
            ;;
        *)
            log_error "Неизвестная команда: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
