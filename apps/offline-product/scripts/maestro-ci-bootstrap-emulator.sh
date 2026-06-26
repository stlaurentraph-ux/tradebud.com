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
echo "==> Removing previous Tracebud install"
adb uninstall "$APP_ID" 2>/dev/null || true

echo "==> Building and installing via expo run:android"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"
export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
# Re-wait after uninstall — expo prebuild can take long enough for adb to look disconnected.
adb -s "$DEVICE_SERIAL" wait-for-device
adb -s "$DEVICE_SERIAL" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'
# ANDROID_SERIAL selects the emulator; expo `--device` expects a display name, not adb serial.
npx expo run:android --no-bundler

export MAESTRO_APP_ID="$APP_ID"

echo "Android bootstrap ready for Maestro."
