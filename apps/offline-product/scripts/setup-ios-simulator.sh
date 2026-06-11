#!/usr/bin/env bash
# One-time Xcode Simulator setup + launch Tracebud for store screenshots.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Install Xcode from the App Store, then run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 1
fi

echo "==> Xcode: $(xcodebuild -version | head -1)"

if ! xcrun simctl list runtimes 2>/dev/null | grep -q iOS; then
  echo "==> Downloading iOS Simulator runtime (~8 GB, one-time)…"
  xcodebuild -downloadPlatform iOS
fi

IPHONE_NAME="${IPHONE_DEVICE:-iPhone 17 Pro Max}"
DEVICE_ID="$(xcrun simctl list devices available | grep "$IPHONE_NAME" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"

if [[ -z "$DEVICE_ID" ]]; then
  echo "No simulator named \"$IPHONE_NAME\". Available:"
  xcrun simctl list devices available | grep iPhone
  exit 1
fi

echo "==> Booting $IPHONE_NAME ($DEVICE_ID)"
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
open -a Simulator
xcrun simctl bootstatus "$DEVICE_ID" -b

if ! command -v pod >/dev/null 2>&1; then
  echo ""
  echo "CocoaPods is required for the native build. Install it once:"
  echo "  brew install cocoapods"
  echo "If Homebrew is missing: https://brew.sh"
  echo ""
  echo "Then re-run: npm run ios:simulator"
  exit 1
fi

export EXPO_PUBLIC_STORE_DEMO=1
echo "==> Building Tracebud (first run may take 10–15 min)…"
npx expo run:ios --device "$DEVICE_ID"

cat <<EOF

Tracebud should be open in Simulator.

1. Settings → App Store screenshots → Load demo data
2. Capture: ⌘S in Simulator, or: npm run capture:screenshot -- iphone-01-home.png

EOF
