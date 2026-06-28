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

echo "==> Running Maestro golden path (Android): $GOLDEN_FLOW"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"
adb -s "$DEVICE_SERIAL" shell am force-stop "$MAESTRO_APP_ID" 2>/dev/null || true
if ! maestro test --device "$DEVICE_SERIAL" "$FLOW_PATH"; then
  dump_tracebud_logcat "Logcat after Maestro failure" || true
  exit 1
fi

echo "Maestro Android golden path passed: $GOLDEN_FLOW"
