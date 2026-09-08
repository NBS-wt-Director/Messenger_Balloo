#!/bin/bash
# ============================================================
# Balloo Messenger — Сборка Desktop + Android + Автозагрузка
# Версия: 1.0 | Дата: 2026-09-07
# ============================================================
# Автоматически:
#   1. Собирает Desktop-билды (deb, AppImage, exe)
#   2. Собирает Android APK
#   3. Загружает файлы на сервер
#   4. Регистрирует в API загрузок
#   5. Выводит ссылки для страницы загрузки
# ============================================================

set -euo pipefail

# ─── Конфигурация ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RELEASE_DIR="$PROJECT_ROOT/packages/desktop/release"
ANDROID_RELEASE_DIR="$PROJECT_ROOT/packages/mobile-android/android/app/build/outputs/apk/release"
VERSION="1.0.0"
BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Сервер
PROD_HOST="${PROD_HOST:-188.73.176.34}"
PROD_USER="${PROD_USER:-cfr_balloo}"
API_URL="${API_URL:-https://api.balloo.su}"
API_TOKEN="${API_TOKEN:-}"  # JWT token админа

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" | tee -a "$SCRIPT_DIR/build-error.log"; }

# ─── Проверки ──────────────────────────────────────────────
preflight() {
    log "Pre-flight checks..."
    
    # Node.js и pnpm
    command -v node &> /dev/null || { error "Node.js не установлен"; exit 1; }
    command -v pnpm &> /dev/null || { error "pnpm не установлен"; exit 1; }
    
    # Java (для Android)
    command -v java &> /dev/null || { error "Java (JDK) не установлен"; exit 1; }
    
    # Git
    command -v git &> /dev/null || { error "Git не установлен"; exit 1; }
    
    # SSH
    command -v ssh &> /dev/null || { error "SSH не установлен"; exit 1; }
    
    # Ключи API
    if [ -z "$API_TOKEN" ]; then
        warn "API_TOKEN не установлен! Загрузка в API не сработает."
        warn "Используется режим: только сборка + загрузка на сервер."
    fi
    
    success "Pre-flight checks passed"
}

# ─── Сборка Desktop ───────────────────────────────────────
build_desktop() {
    log "=================================================="
    log "🖥️  Сборка Desktop (Linux + Windows)"
    log "=================================================="
    
    cd "$PROJECT_ROOT/packages/desktop"
    
    # Базовая сборка
    log "Step 1: TypeScript + Vite build..."
    pnpm build || { error "Vite build failed"; exit 1; }
    success "Vite build completed"
    
    # Linux: deb + AppImage
    if [ "${BUILD_LINUX:-true}" = "true" ]; then
        log "Step 2: Linux packages (deb, AppImage)..."
        pnpm build:linux || { warn "Linux build failed (может не хватать зависимостей)"; }
    fi
    
    # Windows: exe
    if [ "${BUILD_WINDOWS:-true}" = "true" ]; then
        log "Step 3: Windows packages (exe)..."
        pnpm build:win || { warn "Windows build failed (нужен Wine или Windows-машина)"; }
    fi
    
    # macOS (если на Mac)
    if [ "${BUILD_MAC:-false}" = "true" ] && [[ "$(uname)" == "Darwin" ]]; then
        log "Step 4: macOS packages (dmg)..."
        pnpm build:mac || { warn "macOS build failed (нужен Mac)"; }
    fi
    
    # Проверяем что получилось
    if [ -d "$RELEASE_DIR" ]; then
        local count=$(find "$RELEASE_DIR" -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.exe" -o -name "*.dmg" \) 2>/dev/null | wc -l)
        if [ "$count" -gt 0 ]; then
            success "Desktop-билды созданы: $count файлов в $RELEASE_DIR"
            ls -lh "$RELEASE_DIR"/*.{deb,AppImage,exe,dmg,msi} 2>/dev/null || true
        else
            warn "Desktop-билды не найдены в $RELEASE_DIR"
        fi
    else
        warn "Папка release не найдена: $RELEASE_DIR"
    fi
}

# ─── Сборка Android ──────────────────────────────────────
build_android() {
    log "=================================================="
    log "📱 Сборка Android (APK)"
    log "=================================================="
    
    cd "$PROJECT_ROOT/packages/mobile-android"
    
    # Очищаем предыдущие сборки
    log "Step 1: Clean previous builds..."
    cd android && ./gradlew clean && cd ..
    success "Clean completed"
    
    # Сборка APK
    log "Step 2: Building APK release..."
    cd android && ./gradlew assembleRelease && cd ..
    success "APK build completed"
    
    # Проверяем результат
    if [ -d "$ANDROID_RELEASE_DIR" ]; then
        local apks=$(find "$ANDROID_RELEASE_DIR" -name "*.apk" 2>/dev/null)
        if [ -n "$apks" ]; then
            success "Android APK созданы:"
            echo "$apks" | while read -r apk; do
                local size=$(ls -lh "$apk" | awk '{print $5}')
                local name=$(basename "$apk")
                echo "   - $name ($size)"
            done
        else
            warn "APK файлы не найдены в $ANDROID_RELEASE_DIR"
        fi
    else
        warn "Папка android/app/build не найдена"
    fi
}

# ─── Загрузка на сервер ──────────────────────────────────
upload_to_server() {
    log "=================================================="
    log "📤 Загрузка файлов на сервер"
    log "=================================================="
    
    local server_dir="/home/${PROD_USER}/balloo/downloads"
    
    # Создаём директорию на сервере
    log "Creating remote directory..."
    ssh -o StrictHostKeyChecking=no "${PROD_USER}@${PROD_HOST}" "mkdir -p ${server_dir}"
    success "Remote directory created"
    
    # Загружаем Desktop-билды
    if [ -d "$RELEASE_DIR" ]; then
        log "Uploading Desktop packages..."
        local desktop_files=$(find "$RELEASE_DIR" -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.exe" -o -name "*.dmg" \) 2>/dev/null)
        
        if [ -n "$desktop_files" ]; then
            echo "$desktop_files" | while read -r file; do
                local filename=$(basename "$file")
                log "  Uploading: $filename"
                scp "$file" "${PROD_USER}@${PROD_HOST}:${server_dir}/" || warn "Failed to upload $filename"
            done
            success "Desktop packages uploaded"
        fi
    fi
    
    # Загружаем Android APK
    if [ -d "$ANDROID_RELEASE_DIR" ]; then
        log "Uploading Android packages..."
        local android_files=$(find "$ANDROID_RELEASE_DIR" -name "*.apk" 2>/dev/null)
        
        if [ -n "$android_files" ]; then
            echo "$android_files" | while read -r file; do
                local filename=$(basename "$file")
                log "  Uploading: $filename"
                scp "$file" "${PROD_USER}@${PROD_HOST}:${server_dir}/" || warn "Failed to upload $filename"
            done
            success "Android packages uploaded"
        fi
    fi
    
    # Проверяем что на сервере
    log "Files on server:"
    ssh "${PROD_USER}@${PROD_HOST}" "ls -lh ${server_dir}/"
}

# ─── Регистрация в API ───────────────────────────────────
register_in_api() {
    if [ -z "$API_TOKEN" ]; then
        warn "API_TOKEN не установлен — пропускаем регистрацию в API"
        return
    fi
    
    log "=================================================="
    log "🔗 Регистрация в API загрузок"
    log "=================================================="
    
    local server_dir="/home/${PROD_USER}/balloo/downloads"
    
    # Desktop-файлы
    if [ -d "$RELEASE_DIR" ]; then
        find "$RELEASE_DIR" -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.exe" -o -name "*.dmg" \) 2>/dev/null | while read -r file; do
            local filename=$(basename "$file")
            local filesize=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
            local checksum=$(sha256sum "$file" | awk '{print $1}')
            
            # Определяем платформу и формат
            local platform=""
            local format=""
            
            case "$filename" in
                *.deb) platform="linux"; format="deb" ;;
                *.AppImage) platform="linux"; format="appimage" ;;
                *.exe) platform="win"; format="exe" ;;
                *.dmg) platform="mac"; format="dmg" ;;
                *) continue ;;
            esac
            
            log "Registering: $filename ($platform/$format)"
            
            curl -s -X POST "${API_URL}/api/downloads/upload-desktop" \
                -H "Authorization: Bearer ${API_TOKEN}" \
                -H "Content-Type: application/json" \
                -d "{
                    \"platform\": \"${platform}\",
                    \"format\": \"${format}\",
                    \"version\": \"${VERSION}\",
                    \"arch\": \"x64\",
                    \"url\": \"https://download.balloo.su/downloads/${filename}\",
                    \"size\": ${filesize},
                    \"checksum\": \"${checksum}\"
                }" | python3 -m json.tool 2>/dev/null || warn "Failed to register $filename"
        done
    fi
    
    # Android-файлы
    if [ -d "$ANDROID_RELEASE_DIR" ]; then
        find "$ANDROID_RELEASE_DIR" -name "*.apk" 2>/dev/null | while read -r file; do
            local filename=$(basename "$file")
            local filesize=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
            local checksum=$(sha256sum "$file" | awk '{print $1}')
            
            log "Registering: $filename (android/apk)"
            
            curl -s -X POST "${API_URL}/api/downloads/upload-mobile" \
                -H "Authorization: Bearer ${API_TOKEN}" \
                -H "Content-Type: application/json" \
                -d "{
                    \"platform\": \"android\",
                    \"format\": \"apk\",
                    \"version\": \"${VERSION}\",
                    \"arch\": \"universal\",
                    \"url\": \"https://download.balloo.su/downloads/${filename}\",
                    \"size\": ${filesize},
                    \"checksum\": \"${checksum}\"
                }" | python3 -m json.tool 2>/dev/null || warn "Failed to register $filename"
        done
    fi
}

# ─── Вывод результатов ───────────────────────────────────
print_results() {
    log "=================================================="
    log "📊 Итоги сборки"
    log "=================================================="
    
    echo ""
    echo -e "${GREEN}Desktop-билды:${NC}"
    if [ -d "$RELEASE_DIR" ]; then
        find "$RELEASE_DIR" -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.exe" -o -name "*.dmg" \) 2>/dev/null | while read -r file; do
            local filename=$(basename "$file")
            local size=$(ls -lh "$file" | awk '{print $5}')
            echo "  🖥️  $filename — $size"
        done
    else
        echo "  (не собрано)"
    fi
    
    echo ""
    echo -e "${GREEN}Android-билды:${NC}"
    if [ -d "$ANDROID_RELEASE_DIR" ]; then
        find "$ANDROID_RELEASE_DIR" -name "*.apk" 2>/dev/null | while read -r file; do
            local filename=$(basename "$file")
            local size=$(ls -lh "$file" | awk '{print $5}')
            echo "  📱 $filename — $size"
        done
    else
        echo "  (не собрано)"
    fi
    
    echo ""
    echo -e "${GREEN}Ссылки для загрузки:${NC}"
    echo "  Desktop: https://download.balloo.su/downloads/"
    echo "  Android: https://download.balloo.su/downloads/"
    echo "  API:     ${API_URL}/api/downloads"
    echo ""
}

# ─── Главная ─────────────────────────────────────────────
main() {
    local command="${1:-all}"
    
    case "$command" in
        preflight)
            preflight
            ;;
        desktop)
            preflight
            build_desktop
            ;;
        android)
            preflight
            build_android
            ;;
        upload)
            upload_to_server
            ;;
        api)
            register_in_api
            ;;
        all)
            preflight
            build_desktop
            build_android
            upload_to_server
            register_in_api
            print_results
            ;;
        help|--help|-h)
            echo "Использование: $0 [command]"
            echo ""
            echo "Команды:"
            echo "  preflight  — Проверка зависимостей"
            echo "  desktop    — Только Desktop-билд"
            echo "  android    — Только Android-билд"
            echo "  upload     — Загрузка на сервер"
            echo "  api        — Регистрация в API"
            echo "  all        — Всё (билд + загрузка + API)"
            echo "  help       — Эта справка"
            echo ""
            echo "Переменные окружения:"
            echo "  PROD_HOST  — IP сервера (по умолчанию: 188.73.176.34)"
            echo "  PROD_USER  — Пользователь SSH (по умолчанию: cfr_balloo)"
            echo "  API_URL    — URL API (по умолчанию: https://api.balloo.su)"
            echo "  API_TOKEN  — JWT токен админа"
            echo "  BUILD_LINUX   — true/false (по умолчанию: true)"
            echo "  BUILD_WINDOWS — true/false (по умолчанию: true)"
            echo "  BUILD_MAC     — true/false (по умолчанию: false)"
            ;;
        *)
            error "Неизвестная команда: $command"
            exit 1
            ;;
    esac
}

main "$@"
