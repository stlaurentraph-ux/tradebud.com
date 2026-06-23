#!/usr/bin/env bash
# Wait for a physical iOS device (wireless or USB), then run the LAN debug install.
#
# Usage:
#   npm run dev:device:wait              # first iPad, else first iPhone
#   TRACE_BUD_IOS_DEVICE_KIND=ipad npm run dev:device:wait
#   TRACE_BUD_IOS_DEVICE_UDID=... npm run dev:device:wait
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KIND="${TRACE_BUD_IOS_DEVICE_KIND:-ipad}"   # ipad | iphone | any
POLL_SECS="${TRACE_BUD_DEVICE_POLL_SECS:-5}"
MAX_WAIT_SECS="${TRACE_BUD_DEVICE_MAX_WAIT_SECS:-900}"
UDID="${TRACE_BUD_IOS_DEVICE_UDID:-}"

pick_udid_from_devicectl() {
  python3 - <<'PY' "$KIND"
import json, subprocess, sys
kind = sys.argv[1].lower()
raw = subprocess.check_output(
    ["xcrun", "devicectl", "list", "devices", "--columns", "*", "--json-output", "/dev/stdout"],
    text=True,
)
devices = json.loads(raw).get("result", {}).get("devices", [])
connected = [
    d for d in devices
    if d.get("connectionProperties", {}).get("pairingState") == "paired"
    and d.get("connectionProperties", {}).get("transportType") in ("wired", "localNetwork", "network")
]
if not connected:
    connected = [d for d in devices if d.get("connectionProperties", {}).get("pairingState") == "paired"]

def is_ipad(d):
    model = (d.get("hardwareProperties", {}) or {}).get("productType") or ""
    name = (d.get("deviceProperties", {}) or {}).get("name") or ""
    udid = (d.get("hardwareProperties", {}) or {}).get("udid") or ""
    blob = f"{model} {name} {udid}".lower()
    return "ipad" in blob

def is_iphone(d):
    return not is_ipad(d)

filtered = connected
if kind == "ipad":
    filtered = [d for d in connected if is_ipad(d)]
elif kind == "iphone":
    filtered = [d for d in connected if is_iphone(d)]

if not filtered:
    sys.exit(1)

udid = (filtered[0].get("hardwareProperties", {}) or {}).get("udid")
if not udid:
    sys.exit(1)
print(udid)
PY
}

pick_udid_from_xctrace() {
  local line kind_filter
  if [[ "$KIND" == "ipad" ]]; then
    kind_filter='iPad'
  elif [[ "$KIND" == "iphone" ]]; then
    kind_filter='iPhone'
  else
    kind_filter='iPhone|iPad'
  fi
  line="$(xcrun xctrace list devices 2>/dev/null | grep -E "^(${kind_filter})" | grep -v Simulator | head -1 || true)"
  [[ -n "$line" ]] || return 1
  # xctrace hardware UDIDs: 00008027-000A15620E22002E (8+16) or UUID-shaped IDs from devicectl
  echo "$line" | grep -Eo '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}|[0-9A-F]{8}-[0-9A-F]{16}' | head -1
}

resolve_udid() {
  if [[ -n "$UDID" ]]; then
    echo "$UDID"
    return 0
  fi
  pick_udid_from_devicectl || pick_udid_from_xctrace
}

echo ""
echo "Tracebud — waiting for iOS device (kind=${KIND}, max ${MAX_WAIT_SECS}s)"
echo "Metro should already be running: npm run dev:metro:production"
echo ""
echo "If your iPad is not listed yet, pair it wirelessly in Xcode:"
echo "  Xcode → Window → Devices and Simulators → select iPad → Connect via network"
echo "  (Developer Mode must be ON on the iPad; same Wi‑Fi as this Mac)"
echo ""

open -a Xcode >/dev/null 2>&1 || true

deadline=$((SECONDS + MAX_WAIT_SECS))
while (( SECONDS < deadline )); do
  if resolved="$(resolve_udid 2>/dev/null || true)" && [[ -n "$resolved" ]]; then
    echo "Found device UDID: ${resolved}"
    export TRACE_BUD_IOS_DEVICE_UDID="$resolved"
    exec bash ./scripts/run-ios-device-lan.sh "$@"
  fi
  echo "  …no ${KIND} device yet ($(date +%H:%M:%S)); retry in ${POLL_SECS}s"
  sleep "$POLL_SECS"
done

echo ""
echo "Timed out. Pair the iPad in Xcode, then re-run:"
echo "  cd apps/offline-product && npm run dev:device:wait"
exit 1
