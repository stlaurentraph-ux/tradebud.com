#!/usr/bin/env bash
# Boot iOS Simulator, open Tracebud, guide screenshot capture.
# Requires: Xcode, Tracebud installed on the booted simulator (preview build or expo run:ios).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_IPHONE="$ROOT/store-assets/app-store/captured/ios"
OUT_IPAD="$ROOT/store-assets/app-store/captured/ipad"
mkdir -p "$OUT_IPHONE" "$OUT_IPAD"

if ! command -v xcrun >/dev/null 2>&1 || ! xcrun simctl help >/dev/null 2>&1; then
  echo "Xcode Command Line Tools required. Install Xcode from the App Store, then:"
  echo "  xcode-select --install"
  exit 1
fi

IPHONE_DEVICE="${IPHONE_DEVICE:-iPhone 15 Plus}"
IPAD_DEVICE="${IPAD_DEVICE:-iPad Pro 12.9-inch (6th generation)}"

boot_sim() {
  local name="$1"
  open -a Simulator >/dev/null 2>&1 || true
  if xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
    echo "Simulator already booted."
    return
  fi
  echo "Booting $name…"
  xcrun simctl boot "$name" 2>/dev/null || true
  xcrun simctl bootstatus booted -b
}

capture() {
  local out_dir="$1"
  local filename="$2"
  xcrun simctl io booted screenshot "$out_dir/$filename"
  echo "  → $out_dir/$filename"
}

boot_sim "$IPHONE_DEVICE"

cat <<'EOF'

Tracebud store screenshot capture
================================
1. Open Tracebud on the Simulator (install preview build if needed).
2. Settings → scroll to "App Store screenshots" → tap **Load demo data**.
3. Capture each screen with ⌘S (Desktop) OR run from another terminal:

   cd apps/offline-product
   npm run capture:screenshot -- iphone-01-home.png

Suggested iPhone shots (portrait):
  iphone-01-home.png       Home
  iphone-02-my-plots.png   My Plots
  iphone-03-plot-detail.png  Plot → Finca Norte
  iphone-04-map.png        Register plot (if you start a walk)
  iphone-05-settings.png   Settings

For iPad, boot iPad Pro 12.9" and repeat:
  IPHONE_DEVICE="iPad Pro 12.9-inch (6th generation)" npm run store-screenshots:capture

EOF

if [[ "${AUTO_CAPTURE:-}" == "1" ]]; then
  echo "AUTO_CAPTURE=1: saving placeholder frame…"
  capture "$OUT_IPHONE" "iphone-00-check-simulator.png"
fi
