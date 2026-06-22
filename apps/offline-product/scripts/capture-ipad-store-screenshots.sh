#!/usr/bin/env bash
# Capture real Tracebud iPad App Store screenshots (13" / 2064×2752) on the iOS Simulator.
# Requires: Xcode, Tracebud installed on iPad Pro 13-inch (M5) simulator (expo run:ios once).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/store-assets/app-store/ios/13-inch"
SIM_NAME="${IPAD_DEVICE:-iPad Pro 13-inch (M5)}"
SIM_ID="$(xcrun simctl list devices booted 2>/dev/null | grep "$SIM_NAME" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' || true)"

if [[ -z "$SIM_ID" ]]; then
  echo "Booting $SIM_NAME…"
  open -a Simulator
  xcrun simctl boot "$SIM_NAME" 2>/dev/null || true
  xcrun simctl bootstatus booted -b
  SIM_ID="$(xcrun simctl list devices booted | grep "$SIM_NAME" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"
fi

mkdir -p "$OUT"
cd "$ROOT"

echo "==> Launch Tracebud on $SIM_NAME"
xcrun simctl terminate "$SIM_ID" com.tracebud.app 2>/dev/null || true
xcrun simctl launch "$SIM_ID" com.tracebud.app
sleep 10

echo "==> 01 home"
xcrun simctl io booted screenshot "$OUT/01-home.png"

echo "==> 02 map + 03 my plots (Maestro point navigation)"
maestro test --device "$SIM_ID" .maestro/flows/app-store-ipad-screenshots-nav.yaml
cp "$ROOT/02-map-plot.png" "$ROOT/03-my-plots.png" "$OUT/"
rm -f "$ROOT/02-map-plot.png" "$ROOT/03-my-plots.png"

echo "==> 04 home (offline-first)"
xcrun simctl openurl "$SIM_ID" "tracebudoffline://" 2>/dev/null || true
sleep 6
xcrun simctl io booted screenshot "$OUT/04-offline.png"

echo "==> 05 settings"
xcrun simctl openurl "$SIM_ID" "tracebudoffline://settings" 2>/dev/null || true
sleep 6
xcrun simctl io booted screenshot "$OUT/05-backup-settings.png"

for f in "$OUT"/*.png; do
  W=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
  H=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
  echo "  $(basename "$f") ${W}x${H}"
done

cat <<EOF

Saved iPad 13" App Store screenshots to:
  $OUT

Upload in App Store Connect → your version → iPad → 13" display (portrait).

EOF
