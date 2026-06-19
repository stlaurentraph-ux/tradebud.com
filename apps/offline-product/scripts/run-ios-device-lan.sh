#!/usr/bin/env bash
# Build/install debug app on a USB iPhone with correct Metro LAN hostname.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IP="$(bash ./scripts/write-xcode-lan-env.sh)"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
export SENTRY_DISABLE_AUTO_UPLOAD=true

node ./scripts/sync-ios-google-url-scheme.mjs

echo ""
echo "Device build — JS bundle host: http://${IP}:8081"
echo ""

if ! lsof -i :8081 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Metro is not running. Start it first (keep this terminal open):"
  echo "  npm run dev:metro"
  echo ""
  echo "Then re-open the app on your phone, or run this command again to reinstall."
  echo ""
fi

DEVICE_UDID="${TRACE_BUD_IOS_DEVICE_UDID:-}"
if [[ -z "$DEVICE_UDID" ]]; then
  DEVICE_UDID="$(
    xcrun xctrace list devices 2>/dev/null \
      | grep -E '^iPhone|^iPad' \
      | grep -v Simulator \
      | grep -Eo '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' \
      | tail -1 \
      || true
  )"
fi

if [[ -n "$DEVICE_UDID" ]]; then
  exec npx expo run:ios --device "$DEVICE_UDID" "$@"
fi

exec npx expo run:ios --device "$@"
