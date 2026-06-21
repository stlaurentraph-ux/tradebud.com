#!/usr/bin/env bash
# Boot iOS simulator and install Tracebud for Maestro CI (shared by golden path + nightly).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${PATH:+$PATH:}$HOME/.maestro/bin"

IPHONE_DEVICE="${IPHONE_DEVICE:-iPhone 16}"
APP_ID="${MAESTRO_APP_ID:-com.tracebud.app}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found — install before running Maestro CI."
  exit 1
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Xcode not available on this runner."
  exit 1
fi

DEVICE_ID="$(xcrun simctl list devices available | grep "$IPHONE_DEVICE" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' || true)"
if [[ -z "$DEVICE_ID" ]]; then
  echo "No simulator named \"$IPHONE_DEVICE\". Available iPhones:"
  xcrun simctl list devices available | grep iPhone || true
  exit 1
fi

echo "==> Booting $IPHONE_DEVICE ($DEVICE_ID)"
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE_ID" -b

echo "==> Removing previous Tracebud install"
xcrun simctl uninstall "$DEVICE_ID" "$APP_ID" 2>/dev/null || true

if [[ -n "${EXPO_TOKEN:-}" ]]; then
  echo "==> Installing latest EAS simulator build (EXPO_TOKEN set)"
  EAS_NO_VCS=1 npx eas-cli build:run \
    --platform ios \
    --profile simulator \
    --latest \
    --non-interactive \
    --simulator "$DEVICE_ID"
else
  echo "==> Building and installing via expo run:ios (no EXPO_TOKEN — slower)"
  export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
  export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
  export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
  export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"
  export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
  npx expo run:ios --device "$DEVICE_ID"
fi

export MAESTRO_DEVICE_ID="$DEVICE_ID"
export MAESTRO_APP_ID="$APP_ID"
