#!/usr/bin/env bash
# Boot Android emulator and install Tracebud for Maestro CI (audit H25).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${PATH:+$PATH:}$HOME/.maestro/bin"

APP_ID="${MAESTRO_APP_ID:-com.tracebud.app}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found — install before running Maestro CI."
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found — Android SDK must be on PATH."
  exit 1
fi

adb wait-for-device
DEVICE_SERIAL="$(adb devices | awk 'NR>1 && $2=="device" { print $1; exit }')"
if [[ -z "$DEVICE_SERIAL" ]]; then
  echo "No connected Android device/emulator."
  adb devices -l || true
  exit 1
fi

export ANDROID_SERIAL="$DEVICE_SERIAL"
export MAESTRO_ANDROID_SERIAL="$DEVICE_SERIAL"

echo "==> Using Android device $DEVICE_SERIAL"

APK_PATH="${MAESTRO_ANDROID_APK_PATH:-$ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"
if [[ ! -f "$APK_PATH" ]]; then
  echo "::error::Missing prebuilt APK at $APK_PATH (assemble step must run first)."
  find "$ROOT" -name 'app-debug.apk' 2>/dev/null | head -5 || true
  exit 1
fi

echo "==> Removing previous Tracebud install"
adb -s "$DEVICE_SERIAL" shell pm clear "$APP_ID" 2>/dev/null || true
adb -s "$DEVICE_SERIAL" shell pm uninstall --user 0 "$APP_ID" 2>/dev/null || \
  adb -s "$DEVICE_SERIAL" uninstall "$APP_ID" 2>/dev/null || true

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"
export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"

adb -s "$DEVICE_SERIAL" wait-for-device
adb -s "$DEVICE_SERIAL" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'

echo "==> Installing prebuilt debug APK from $APK_PATH"
adb -s "$DEVICE_SERIAL" install -r -g "$APK_PATH"

export MAESTRO_APP_ID="$APP_ID"

# Maestro driver handshake can exceed the 15s Android default on cold CI emulators.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"

echo "==> Launching Tracebud once to initialize local SQLite"
adb -s "$DEVICE_SERIAL" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || \
  adb -s "$DEVICE_SERIAL" shell am start -n "$APP_ID/.MainActivity" >/dev/null 2>&1 || true

if [[ "${MAESTRO_SEED_SKIP:-}" == "1" ]]; then
  echo "==> Applying golden-path boot profile (polls until DB exists, up to ${MAESTRO_SEED_DB_WAIT_MS:-120000}ms)"
  MAESTRO_BOOT_PROFILE="${MAESTRO_BOOT_PROFILE:-golden_path_minimal}" \
    MAESTRO_BOOT_PLATFORM=android \
    MAESTRO_ANDROID_SERIAL="$DEVICE_SERIAL" \
    MAESTRO_SEED_DB_WAIT_MS="${MAESTRO_SEED_DB_WAIT_MS:-120000}" \
    node "$ROOT/scripts/seed-maestro-boot-profile.mjs"
fi

adb -s "$DEVICE_SERIAL" shell am force-stop "$APP_ID" 2>/dev/null || true

echo "Android bootstrap ready for Maestro (flow uses launchApp clearState: false)."
