#!/usr/bin/env bash
# CI golden-path Maestro on Android emulator (audit H25).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export MAESTRO_SEED_SKIP="${MAESTRO_SEED_SKIP:-1}"

# shellcheck source=./maestro-ci-bootstrap-emulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-emulator.sh"

GOLDEN_FLOW="${MAESTRO_GOLDEN_FLOW:-settings-sync-smoke.yaml}"
FLOW_PATH=".maestro/flows/$GOLDEN_FLOW"
if [[ ! -f "$FLOW_PATH" ]]; then
  echo "Golden flow missing: $FLOW_PATH"
  exit 1
fi

stabilize_adb() {
  echo "==> Stabilizing adb before Maestro"
  adb kill-server 2>/dev/null || true
  sleep 2
  adb start-server
  adb -s "$DEVICE_SERIAL" wait-for-device
  adb -s "$DEVICE_SERIAL" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'
  adb -s "$DEVICE_SERIAL" shell input keyevent 82 2>/dev/null || true
}

prewarm_tracebud_for_maestro() {
  echo "==> Pre-warming Tracebud (dex cache + RN boot before Maestro driver connect)"
  adb -s "$DEVICE_SERIAL" shell am force-stop "$MAESTRO_APP_ID" 2>/dev/null || true
  adb -s "$DEVICE_SERIAL" logcat -c 2>/dev/null || true
  adb -s "$DEVICE_SERIAL" shell am start -W -n "$MAESTRO_APP_ID/.MainActivity" 2>/dev/null || \
    adb -s "$DEVICE_SERIAL" shell monkey -p "$MAESTRO_APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
  wait_for_android_js_boot "Maestro pre-warm" || true
  adb -s "$DEVICE_SERIAL" shell am force-stop "$MAESTRO_APP_ID" 2>/dev/null || true
  sleep 3
}

run_maestro_with_retry() {
  local attempts="${MAESTRO_CI_RETRY_ATTEMPTS:-3}"
  local n=1
  while [[ "$n" -le "$attempts" ]]; do
    echo "==> Maestro attempt $n/$attempts"
    stabilize_adb
    adb -s "$DEVICE_SERIAL" shell am force-stop "$MAESTRO_APP_ID" 2>/dev/null || true
    sleep 2
    if maestro test --device "$DEVICE_SERIAL" "$FLOW_PATH"; then
      return 0
    fi
    dump_tracebud_logcat "Logcat after Maestro attempt $n failure" || true
    if [[ "$n" -lt "$attempts" ]]; then
      echo "==> Maestro attempt $n failed — retrying after adb settle"
      sleep 15
    fi
    n=$((n + 1))
  done
  return 1
}

echo "==> Running Maestro golden path (Android): $GOLDEN_FLOW"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"

stabilize_adb
prewarm_tracebud_for_maestro
if ! run_maestro_with_retry; then
  exit 1
fi

echo "Maestro Android golden path passed: $GOLDEN_FLOW"
