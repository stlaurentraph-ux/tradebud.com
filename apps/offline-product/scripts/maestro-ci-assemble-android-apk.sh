#!/usr/bin/env bash
# Prebuild Android, embed the JS bundle, and assemble a standalone debug APK for Maestro CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
export MAESTRO_CI="${MAESTRO_CI:-1}"
export EXPO_PUBLIC_MAESTRO_CI="${EXPO_PUBLIC_MAESTRO_CI:-1}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"

echo "==> expo prebuild (android)"
npx expo prebuild --platform android --no-install

# New Architecture adds heavy dex work on x86_64 CI emulators — disable for Maestro APK only.
GRADLE_PROPS="$ROOT/android/gradle.properties"
if [[ -f "$GRADLE_PROPS" ]]; then
  sed -i.bak 's/newArchEnabled=true/newArchEnabled=false/' "$GRADLE_PROPS" 2>/dev/null || \
    sed -i '' 's/newArchEnabled=true/newArchEnabled=false/' "$GRADLE_PROPS"
  echo "==> Maestro CI: newArchEnabled=false in android/gradle.properties"
fi

GRADLE_FILE="$ROOT/android/app/build.gradle"
echo "==> Force JS embed in debug APK (debug variant skips bundling by default)"
MAESTRO_GRADLE_FILE="$GRADLE_FILE" node <<'NODE'
const fs = require('node:fs');
const gradlePath = process.env.MAESTRO_GRADLE_FILE;
if (!gradlePath) {
  throw new Error('MAESTRO_GRADLE_FILE is required');
}
let source = fs.readFileSync(gradlePath, 'utf8');
if (!/debuggableVariants\s*=\s*\[\]/.test(source)) {
  source = source.replace(/react\s*\{/, 'react {\n    debuggableVariants = []');
  fs.writeFileSync(gradlePath, source);
}
NODE

echo "==> expo export:embed (android) — bundle JS for offline APK (no Metro)"
npx expo export:embed --eager --platform android --dev false

echo "==> gradle assembleDebug (x86_64 for CI emulator)"
cd android
./gradlew assembleDebug --no-daemon -q -PreactNativeArchitectures=x86_64

APK_PATH="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK_PATH" ]]; then
  echo "Missing APK at $APK_PATH"
  exit 1
fi

if ! unzip -l "$APK_PATH" | grep -qE 'assets/index.android.bundle|\.hbc'; then
  echo "::error::Missing embedded JS bundle (index.android.bundle) in $APK_PATH — debug APK will not boot offline without debuggableVariants = []."
  unzip -l "$APK_PATH" | head -40 || true
  exit 1
fi

if ! unzip -l "$APK_PATH" | grep -q 'lib/x86_64/'; then
  echo "::error::Missing lib/x86_64 native libs in $APK_PATH — CI emulator requires x86_64 ABI."
  unzip -l "$APK_PATH" | grep 'lib/' | head -20 || true
  exit 1
fi

echo "Android debug APK ready (embedded bundle verified): $APK_PATH"
