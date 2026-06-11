#!/usr/bin/env bash
# Open the native Tracebud app (not Expo Go) on the screenshot simulator.
set -euo pipefail

DEVICE_NAME="${IPHONE_DEVICE:-iPhone 17 Pro Max}"
DEVICE_ID="$(xcrun simctl list devices available | grep "$DEVICE_NAME" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"

if [[ -z "$DEVICE_ID" ]]; then
  echo "No simulator named \"$DEVICE_NAME\"."
  exit 1
fi

if ! xcrun simctl listapps "$DEVICE_ID" 2>/dev/null | grep -q com.tracebud.app; then
  echo "Tracebud is not installed on $DEVICE_NAME."
  echo "Run: npm run run:simulator"
  exit 1
fi

xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
open -a Simulator
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl launch "$DEVICE_ID" com.tracebud.app
echo "Launched Tracebud on $DEVICE_NAME (not Expo Go)."
