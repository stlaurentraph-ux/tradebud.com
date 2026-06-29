#!/usr/bin/env bash
# CI golden-path Maestro on Android emulator (audit H25).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export MAESTRO_SEED_SKIP="${MAESTRO_SEED_SKIP:-1}"

# shellcheck source=./maestro-ci-bootstrap-emulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-emulator.sh"

GOLDEN_FLOW="${MAESTRO_GOLDEN_FLOW:-settings-sync-smoke-android.yaml}"
FLOW_PATH=".maestro/flows/$GOLDEN_FLOW"
if [[ ! -f "$FLOW_PATH" ]]; then
  echo "Golden flow missing: $FLOW_PATH"
  exit 1
fi

stabilize_adb() {
  local mode="${1:-full}"
  if [[ "$mode" == "light" ]]; then
    echo "==> Light adb settle (preserve warm Tracebud process)"
    adb -s "$DEVICE_SERIAL" wait-for-device
    adb -s "$DEVICE_SERIAL" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done' 2>/dev/null || true
    return
  fi
  echo "==> Stabilizing adb before Maestro"
  adb kill-server 2>/dev/null || true
  sleep 2
  adb start-server
  adb -s "$DEVICE_SERIAL" wait-for-device
  adb -s "$DEVICE_SERIAL" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'
  adb -s "$DEVICE_SERIAL" shell input keyevent 82 2>/dev/null || true
}

run_maestro_with_retry() {
  local attempts="${MAESTRO_CI_RETRY_ATTEMPTS:-2}"
  local n=1
  while [[ "$n" -le "$attempts" ]]; do
    echo "==> Maestro attempt $n/$attempts (bootWarmed=${MAESTRO_BOOT_WARMED:-0})"
    if [[ "$n" -eq 1 && "${MAESTRO_BOOT_WARMED:-0}" == "1" ]]; then
      stabilize_adb light
      echo "==> Foreground warmed Tracebud (launchApp uses stopApp: false)"
      adb -s "$DEVICE_SERIAL" shell am start -n "$MAESTRO_APP_ID/.MainActivity" 2>/dev/null || true
      sleep 5
      # The Maestro CLI startup gap (~6-9 min) gives the OS time to kill the app under memory
      # pressure. If the process is gone, wait for a fresh JS boot so the flow's
      # extendedWaitUntil does not race against a cold start.
      if ! adb -s "$DEVICE_SERIAL" shell pidof "$MAESTRO_APP_ID" 2>/dev/null | grep -q .; then
        echo "==> App process not found — waiting for fresh JS boot before Maestro"
        wait_for_android_js_boot "pre-Maestro re-warm" || echo "==> Re-warm timed out — Maestro extendedWaitUntil will handle slow boot"
      fi
    else
      stabilize_adb full
      adb -s "$DEVICE_SERIAL" shell am force-stop "$MAESTRO_APP_ID" 2>/dev/null || true
      sleep 2
    fi
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

if ! run_maestro_with_retry; then
  exit 1
fi

echo "Maestro Android golden path passed: $GOLDEN_FLOW"
