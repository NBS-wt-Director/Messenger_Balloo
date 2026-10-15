#!/usr/bin/env bash
# gradle-android.sh — обёртка над android/gradlew с окружением, проверенным
# живыми сборками APK/AAB 15.10.2026 (тикет mvp1-05, прогон 18 BUILD SUCCESSFUL).
#
# Что делает:
#   1. ANDROID_HOME → .android-sdk в воркспейсе (cmdline-tools 12.0, platforms;android-34,
#      build-tools;34.0.0; вне воркспейса SDK не ставился).
#   2. NODE_PATH → pnpm-store react-native@0.74 + .node-path-shims: settings.gradle и
#      Metro резолвят @react-native/gradle-plugin/expo-* только от cwd android/, а
#      pnpm-изолированный node_modules плоской структуры не имеет.
#   3. -I gradle-mirror-init.gradle: подменяет Maven Central (repo.maven.apache.org
#      деградирует до ~300 Б/с с этой сети) официальным GCS-зеркалом (6,6 МБ/с).
#
# Использование: ./gradle-android.sh assembleRelease | bundleRelease | ...
set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # packages/mobile-android
WS_ROOT="$(cd "$PKG_DIR/../.." && pwd)"                       # монорепо root
SDK_DIR="$WS_ROOT/.android-sdk"
RN_STORE="$(ls -d "$WS_ROOT"/node_modules/.pnpm/react-native@0.74.0*/node_modules | head -1)"
SHIMS="$WS_ROOT/.node-path-shims"

if [ ! -x "$SDK_DIR/build-tools/34.0.0/aapt" ]; then
  echo "ERROR: Android SDK not found in workspace: $SDK_DIR" >&2
  echo "Setup: download commandlinetools-linux zip into $SDK_DIR, then" >&2
  echo "  java -cp \$SDK/cmdline-tools/latest/lib/sdkmanager-classpath.jar \\" >&2
  echo "    com.android.sdklib.tool.sdkmanager.SdkManagerCli --sdk_root=\$SDK \\" >&2
  echo "    'platform-tools' 'platforms;android-34' 'build-tools;34.0.0'" >&2
  exit 1
fi

export ANDROID_HOME="$SDK_DIR"
export NODE_PATH="$RN_STORE:$SHIMS"

cd "$PKG_DIR"
exec ./android/gradlew -p android \
  -I "$PKG_DIR/android/gradle-mirror-init.gradle" \
  --no-daemon \
  "$@"
