#!/bin/bash
# ============================================================
# Загрузка собранных Android APK/AAB на download.balloo.su
# ============================================================
#
# Параметры:
#   $1 — путь к папке с артефактами (например, ./android/app/build/outputs/apk/release/)
#   $2 — версия (например, 1.0.0)
#
# Загружает:
#   - app-release.apk (universal)
#   - app-release.aab (для Google Play)
#   - app-arm64-v8a-release.apk
#   - app-armeabi-v7a-release.apk
#   - app-x86_64-release.apk
#
# API endpoint: POST /api/downloads/upload-mobile
# Требуется: admin-токен в переменной ADMIN_TOKEN
#
# Использование:
#   export ADMIN_TOKEN="admin-jwt-token-here"
#   ./scripts/upload-android-to-download.sh ./build-outputs 1.0.0

set -euo pipefail

ARTIFACTS_DIR="${1:-}"
VERSION="${2:-}"
API_BASE="${API_BASE:-http://localhost:3100}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка параметров
if [[ -z "$ARTIFACTS_DIR" ]]; then
  echo -e "${RED}Ошибка: Укажите путь к папке с артефактами (1-й параметр)${NC}"
  echo "Использование: $0 <путь_к_артефактам> <версия>"
  exit 1
fi

if [[ -z "$VERSION" ]]; then
  echo -e "${RED}Ошибка: Укажите версию (2-й параметр)${NC}"
  echo "Использование: $0 <путь_к_артефактам> <версия>"
  exit 1
fi

if [[ -z "$ADMIN_TOKEN" ]]; then
  echo -e "${YELLOW}Предупреждение: ADMIN_TOKEN не установлен. Используйте: export ADMIN_TOKEN=\"...\"${NC}"
  echo -e "${YELLOW}Пропускаю загрузку...${NC}"
  exit 0
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Загрузка Android-сборок на download.balloo.su${NC}"
echo -e "${GREEN}Версия: $VERSION${NC}"
echo -e "${GREEN}Артефакты: $ARTIFACTS_DIR${NC}"
echo -e "${GREEN}========================================${NC}"

# Функция вычисления SHA256
checksum() {
  sha256sum "$1" | cut -d' ' -f1
}

# Функция загрузки одного файла
upload_file() {
  local filepath="$1"
  local format="$2"
  local arch="$3"

  if [[ ! -f "$filepath" ]]; then
    echo -e "${YELLOW}Файл не найден: $filepath — пропускаю${NC}"
    return 0
  fi

  local filesize
  filesize=$(stat -c%s "$filepath")
  local filechecksum
  filechecksum=$(checksum "$filepath")
  local filename
  filename=$(basename "$filepath")

  echo -e "${YELLOW}Загружаю: $filename (${arch}, ${format}) — ${filesize} байт${NC}"

  curl -s -X POST "${API_BASE}/api/downloads/upload-mobile" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"platform\": \"android\",
      \"format\": \"${format}\",
      \"version\": \"${VERSION}\",
      \"arch\": \"${arch}\",
      \"url\": \"https://download.balloo.su/android/${filename}\",
      \"size\": ${filesize},
      \"checksum\": \"${filechecksum}\"
    }"

  echo -e " ${GREEN}✓${NC}"
}

echo ""
echo "--- Universal APK ---"
upload_file "${ARTIFACTS_DIR}/app-release.apk" "apk" "universal"

echo ""
echo "--- Universal AAB (Google Play) ---"
upload_file "${ARTIFACTS_DIR}/app-release.aab" "aab" "universal"

echo ""
echo "--- Split APKs ---"
upload_file "${ARTIFACTS_DIR}/app-arm64-v8a-release.apk" "apk" "arm64-v8a"
upload_file "${ARTIFACTS_DIR}/app-armeabi-v7a-release.apk" "apk" "armeabi-v7a"
upload_file "${ARTIFACTS_DIR}/app-x86_64-release.apk" "apk" "x86_64"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Загрузка завершена${NC}"
echo -e "${GREEN}========================================${NC}"
