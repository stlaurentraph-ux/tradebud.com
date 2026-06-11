#!/usr/bin/env bash
# Save a Simulator screenshot for App Store assets.
# Usage: npm run capture:screenshot -- iphone-01-home.png
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/store-assets/app-store/captured/ios"
mkdir -p "$OUT_DIR"

NAME="${1:-screenshot-$(date +%Y%m%d-%H%M%S).png}"
OUT="$OUT_DIR/$NAME"

if ! xcrun simctl list devices 2>/dev/null | grep -q Booted; then
  echo "No booted iOS Simulator. Open Simulator and boot iPhone 15 Plus (or iPad Pro 12.9)."
  exit 1
fi

xcrun simctl io booted screenshot "$OUT"
W=$(sips -g pixelWidth "$OUT" 2>/dev/null | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$OUT" 2>/dev/null | awk '/pixelHeight/{print $2}')
echo "Saved $OUT (${W}x${H})"
