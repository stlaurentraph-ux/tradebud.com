#!/usr/bin/env bash
# Prebuild Android, embed the JS bundle, and assemble a standalone debug APK for Maestro CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"

echo "==> expo prebuild (android)"
npx expo prebuild --platform android --no-install

echo "==> expo export:embed (android) — bundle JS for offline APK (no Metro)"
npx expo export:embed --eager --platform android --dev false

echo "==> gradle assembleDebug"
cd android
./gradlew assembleDebug --no-daemon -q

APK_PATH="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK_PATH" ]]; then
  echo "Missing APK at $APK_PATH"
  exit 1
fi

echo "Android debug APK ready: $APK_PATH"
