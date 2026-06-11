#!/usr/bin/env bash
# Install the real Tracebud .app on iOS Simulator (not Expo Go) for pixel-perfect App Store screenshots.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Largest phone simulator on this Mac — use for 6.7"/6.9" App Store slots (check px with capture script).
IPHONE_NAME="${IPHONE_DEVICE:-iPhone 17 Pro Max}"

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Install Xcode from the App Store first."
  exit 1
fi

DEVICE_ID="$(xcrun simctl list devices available | grep "$IPHONE_NAME" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' || true)"
if [[ -z "$DEVICE_ID" ]]; then
  echo "No simulator named \"$IPHONE_NAME\". Available iPhones:"
  xcrun simctl list devices available | grep iPhone || true
  exit 1
fi

echo "==> Booting $IPHONE_NAME ($DEVICE_ID)"
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
open -a Simulator
xcrun simctl bootstatus "$DEVICE_ID" -b

echo "==> Removing previous Tracebud install from simulator…"
xcrun simctl uninstall "$DEVICE_ID" com.tracebud.app 2>/dev/null || true

echo "==> Installing latest EAS simulator build (profile: simulator)…"
if ! EAS_NO_VCS=1 npx eas-cli build:run \
  --platform ios \
  --profile simulator \
  --latest \
  --simulator "$DEVICE_ID"; then
  echo ""
  echo "No simulator build found yet. Start one with:"
  echo "  npm run build:simulator"
  echo ""
  echo "When the build finishes, re-run:"
  echo "  npm run run:simulator"
  exit 1
fi

cat <<EOF

Tracebud is installed on $IPHONE_NAME.

Demo data (Maria Santos, 3 plots) loads automatically — or Settings → App Store screenshots → Load demo data.

Capture screenshots:
  ⌘S in Simulator, or: npm run capture:screenshot -- iphone-01-home.png

EOF
