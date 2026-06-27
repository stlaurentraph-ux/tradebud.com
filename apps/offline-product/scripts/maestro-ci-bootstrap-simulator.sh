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
open -a Simulator >/dev/null 2>&1 || true
sleep 3

echo "==> Removing previous Tracebud install"
xcrun simctl uninstall "$DEVICE_ID" "$APP_ID" 2>/dev/null || true

IOS_APP_PATH="$ROOT/ios-build/DerivedData/Build/Products/Debug-iphonesimulator/Tracebud.app"
if [[ -d "$IOS_APP_PATH" ]]; then
  echo "==> Installing prebuilt simulator app (PR branch — includes tab-home testIDs)"
  xcrun simctl install "$DEVICE_ID" "$IOS_APP_PATH"
elif [[ -n "${EXPO_TOKEN:-}" ]]; then
  echo "==> Installing latest EAS simulator build (EXPO_TOKEN set; may lag main testIDs)"
  # build:run has no --non-interactive; CI=1 keeps npx/eas non-prompting on agents.
  CI=1 EAS_NO_VCS=1 npx eas-cli build:run \
    --platform ios \
    --profile simulator \
    --latest \
    --simulator "$DEVICE_ID"
else
  echo "==> Building and installing via expo run:ios (no prebuilt app or EXPO_TOKEN)"
  export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
  export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
  export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
  export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"
  export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
  npx expo run:ios --device "$DEVICE_ID"
fi

export MAESTRO_DEVICE_ID="$DEVICE_ID"
export MAESTRO_APP_ID="$APP_ID"

seed_maestro_db() {
  if [[ "${MAESTRO_SEED_SKIP:-}" == "1" ]]; then
    echo "==> Skipping full Maestro DB seed (MAESTRO_SEED_SKIP=1)"
    echo "==> Launching Tracebud once to initialize local SQLite"
    xcrun simctl launch "$DEVICE_ID" "$APP_ID" >/dev/null
    echo "==> Applying golden-path boot profile (polls until DB exists, up to ${MAESTRO_SEED_DB_WAIT_MS:-120000}ms)"
    MAESTRO_BOOT_PROFILE="${MAESTRO_BOOT_PROFILE:-golden_path_minimal}" \
      MAESTRO_BOOT_PLATFORM=ios \
      MAESTRO_SEED_DB_WAIT_MS="${MAESTRO_SEED_DB_WAIT_MS:-120000}" \
      node "$ROOT/scripts/seed-maestro-boot-profile.mjs"
    xcrun simctl terminate "$DEVICE_ID" "$APP_ID" 2>/dev/null || true
    return
  fi

  echo "==> Launching Tracebud once to initialize local SQLite"
  xcrun simctl launch "$DEVICE_ID" "$APP_ID" >/dev/null
  sleep 2

  echo "==> Seeding simulator DB for plot/document Maestro flows"
  node "$ROOT/scripts/seed-maestro-simulator.mjs"

  echo "==> Relaunching clean app state after seed"
  xcrun simctl terminate "$DEVICE_ID" "$APP_ID" 2>/dev/null || true
}

seed_maestro_db
