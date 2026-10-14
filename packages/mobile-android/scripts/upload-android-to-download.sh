#!/bin/bash
# ============================================================
# Загрузка собранных Android APK/AAB на download.balloo.su
# (тикет 1791927977: self-update по APK с нашего домена)
# ============================================================
#
# Отличия от старой версии скрипта: раньше отправлялись ТОЛЬКО метаданные
# (POST /api/downloads/upload-mobile), файл никуда не попадал и URL в БД
# указывал в никуда. Теперь файл отправляется целиком (multipart) на
# POST /api/downloads/upload-mobile-file: сервер кладёт его в DOWNLOADS_DIR,
# сам считает sha256+size и создаёт запись DownloadFile.
# Раздача: https://download.balloo.su/downloads/android/balloo-v<version>-<arch>.<ext>
#
# Параметры:
#   $1 — путь к папке с артефактами
#        (по умолчанию android/app/build/outputs/apk/release)
#   $2 — версия semver (по умолчанию version из app.json)
#   $3 — versionCode (по умолчанию versionCode из android/app/build.gradle)
#
# Переменные окружения:
#   API_BASE    — API загрузок (по умолчанию http://localhost:3100,
#                 прод: https://api.balloo.su)
#   ADMIN_TOKEN — JWT администратора (ОБЯЗАТЕЛЕН)
#
# Использование:
#   export ADMIN_TOKEN="admin-jwt-token-here"
#   API_BASE=https://api.balloo.su ./scripts/upload-android-to-download.sh
#
# После загрузки проверяет GET /api/downloads/android/latest?arch=universal.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"

ARTIFACTS_DIR="${1:-$PKG_DIR/android/app/build/outputs/apk/release}"
VERSION="${2:-}"
VERSION_CODE="${3:-}"
API_BASE="${API_BASE:-http://localhost:3100}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ─── Версия: аргумент > app.json (expo.version) ───
if [[ -z "$VERSION" ]]; then
  VERSION=$(node -e "process.stdout.write(require('$PKG_DIR/app.json').expo.version||'')" 2>/dev/null || true)
fi
if [[ -z "$VERSION" ]]; then
  echo -e "${RED}Ошибка: версию определить нечем — передайте 2-м параметром или заполните app.json${NC}"
  exit 1
fi

# ─── versionCode: аргумент > android/app/build.gradle ───
if [[ -z "$VERSION_CODE" ]]; then
  VERSION_CODE=$(grep -oE 'versionCode +[0-9]+' "$PKG_DIR/android/app/build.gradle" 2>/dev/null | grep -oE '[0-9]+' | head -1 || true)
fi
if [[ -z "$VERSION_CODE" ]]; then
  echo -e "${RED}Ошибка: versionCode определить нечем — передайте 3-м параметром или заполните android/app/build.gradle${NC}"
  exit 1
fi

if [[ ! -d "$ARTIFACTS_DIR" ]]; then
  echo -e "${RED}Ошибка: папка с артефактами не найдена: $ARTIFACTS_DIR${NC}"
  echo "Соберите APK: pnpm build:android:universal (или gradlew assembleRelease)"
  exit 1
fi

# Без токена — ошибка, а НЕ молчаливый exit 0: тихий пропуск выдавался
# за успешную публикацию (тикеты mvp1-05, 1791927977).
if [[ -z "$ADMIN_TOKEN" ]]; then
  echo -e "${RED}Ошибка: ADMIN_TOKEN не установлен. Используйте: export ADMIN_TOKEN=\"...\"${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Загрузка Android-сборок на $API_BASE${NC}"
echo -e "${GREEN}Версия: $VERSION (versionCode $VERSION_CODE)${NC}"
echo -e "${GREEN}Артефакты: $ARTIFACTS_DIR${NC}"
echo -e "${GREEN}========================================${NC}"

# Загрузка одного файла multipart'ом. Код != 201 — падение скрипта.
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
  echo -e "${YELLOW}Загружаю: $(basename "$filepath") (${arch}, ${format}) — ${filesize} байт${NC}"

  local response http_code body
  response=$(curl -sS -w '\n%{http_code}' -X POST "${API_BASE}/api/downloads/upload-mobile-file" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -F "file=@${filepath}" \
    -F "version=${VERSION}" \
    -F "versionCode=${VERSION_CODE}" \
    -F "arch=${arch}" \
    -F "format=${format}") || {
    echo -e "${RED}Ошибка curl при загрузке $(basename "$filepath")${NC}"
    exit 1
  }

  http_code="${response##*$'\n'}"
  body="${response%$'\n'*}"

  if [[ "$http_code" != "201" ]]; then
    echo -e "${RED}✗ HTTP $http_code: $body${NC}"
    exit 1
  fi

  echo -e " ${GREEN}✓${NC} $body"
}

echo ""
echo "--- Universal APK (самообновление приложений) ---"
upload_file "${ARTIFACTS_DIR}/app-release.apk" "apk" "universal"

echo ""
echo "--- Universal AAB (архив для Google Play) ---"
upload_file "${ARTIFACTS_DIR}/app-release.aab" "aab" "universal"

echo ""
echo "--- Split APKs ---"
upload_file "${ARTIFACTS_DIR}/app-arm64-v8a-release.apk" "apk" "arm64-v8a"
upload_file "${ARTIFACTS_DIR}/app-armeabi-v7a-release.apk" "apk" "armeabi-v7a"
upload_file "${ARTIFACTS_DIR}/app-x86_64-release.apk" "apk" "x86_64"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Проверка: GET /api/downloads/android/latest${NC}"
LATEST=$(curl -sS "${API_BASE}/api/downloads/android/latest?arch=universal")
echo "$LATEST"
if ! echo "$LATEST" | grep -q "\"version\":\"${VERSION}\""; then
  echo -e "${RED}✗ latest не соответствует загруженной версии ${VERSION}${NC}"
  exit 1
fi
echo -e "${GREEN}✓ latest = $VERSION, приложение увидит эту сборку${NC}"
echo -e "${GREEN}Загрузка завершена${NC}"
echo -e "${GREEN}========================================${NC}"
