#!/bin/bash
# upload-to-download.sh — Загружает артефакты сборки Desktop на download.balloo.su
#
# Параметры:
#   $1 — путь к папке с артефактами (например, ./release/)
#   $2 — версия (например, 1.0.0)
#   $3 — API URL (опционально, по умолчанию https://api.balloo.su)
#
# Использование:
#   ./scripts/upload-to-download.sh ./release 1.0.0
#   ./scripts/upload-to-download.sh ./release 1.0.0 https://api.balloo.su

set -euo pipefail

ARTIFACTS_DIR="${1:-./release}"
VERSION="${2:-1.0.0}"
API_URL="${3:-http://localhost:3100}"

if [ ! -d "$ARTIFACTS_DIR" ]; then
  echo "❌ Ошибка: Директория '$ARTIFACTS_DIR' не найдена"
  echo "Использование: $0 <путь_к_артефактам> <версия> [api_url]"
  exit 1
fi

echo "📦 Загрузка Desktop-артефактов версии $VERSION"
echo "📁 Источник: $ARTIFACTS_DIR"
echo "🌐 API: $API_URL"
echo ""

upload_file() {
  local filepath="$1"
  local platform="$2"
  local format="$3"
  local arch="${4:-x64}"

  if [ ! -f "$filepath" ]; then
    echo "  ⏭️  Файл не найден: $filepath — пропускаем"
    return 0
  fi

  local filename
  filename=$(basename "$filepath")
  local filesize
  filesize=$(stat -c%s "$filepath" 2>/dev/null || stat -f%z "$filepath" 2>/dev/null)
  local checksum
  checksum=$(sha256sum "$filepath" | cut -d' ' -f1 2>/dev/null || shasum -a 256 "$filepath" | cut -d' ' -f1 2>/dev/null)

  echo "  📤 Загрузка: $filename"
  echo "     Размер: $filesize байт"
  echo "     SHA256: $checksum"

  local response
  response=$(curl -s -X POST "$API_URL/api/downloads/upload-desktop" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"platform\": \"$platform\",
      \"format\": \"$format\",
      \"version\": \"$VERSION\",
      \"arch\": \"$arch\",
      \"url\": \"https://download.balloo.su/desktop/$VERSION/$filename\",
      \"size\": $filesize,
      \"checksum\": \"$checksum\"
    }" 2>/dev/null || echo '')

  if echo "$response" | grep -q '"success":true'; then
    echo "  ✅ Успешно: $filename"
  else
    echo "  ⚠️  Предупреждение: Проблема при загрузке $filename"
    echo "     Ответ: $response"
  fi
}

# === Windows ===
echo "🪟 Windows:"
upload_file "$ARTIFACTS_DIR/Balloo Setup ${VERSION} x64.exe" "win" "exe" "x64"
upload_file "$ARTIFACTS_DIR/Balloo Setup ${VERSION} ia32.exe" "win" "exe" "ia32"
upload_file "$ARTIFACTS_DIR/Balloo ${VERSION} x64.msi" "win" "msi" "x64"
upload_file "$ARTIFACTS_DIR/Balloo ${VERSION} Portable x64.exe" "win" "portable" "x64"

# === Linux ===
echo "🐧 Linux:"
upload_file "$ARTIFACTS_DIR/balloo_${VERSION}_amd64.deb" "linux" "deb" "x64"
upload_file "$ARTIFACTS_DIR/balloo_${VERSION}_arm64.deb" "linux" "deb" "arm64"
upload_file "$ARTIFACTS_DIR/balloo-${VERSION}.x86_64.rpm" "linux" "rpm" "x64"
upload_file "$ARTIFACTS_DIR/Balloo-${VERSION}.AppImage" "linux" "appimage" "x64"
upload_file "$ARTIFACTS_DIR/Balloo-${VERSION}-arm64.AppImage" "linux" "appimage" "arm64"
upload_file "$ARTIFACTS_DIR/balloo-${VERSION}.tar.gz" "linux" "tar.gz" "x64"
upload_file "$ARTIFACTS_DIR/balloo-${VERSION}-arm64.tar.gz" "linux" "tar.gz" "arm64"

# === macOS ===
echo "🍎 macOS:"
upload_file "$ARTIFACTS_DIR/Balloo ${VERSION} x64.dmg" "mac" "dmg" "x64"
upload_file "$ARTIFACTS_DIR/Balloo ${VERSION} arm64.dmg" "mac" "dmg" "arm64"
upload_file "$ARTIFACTS_DIR/Balloo ${VERSION} x64.zip" "mac" "zip" "x64"
upload_file "$ARTIFACTS_DIR/Balloo ${VERSION} arm64.zip" "mac" "zip" "arm64"

echo ""
echo "🎉 Загрузка завершена!"
