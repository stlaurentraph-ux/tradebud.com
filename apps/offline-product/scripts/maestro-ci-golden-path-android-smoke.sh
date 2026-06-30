#!/usr/bin/env bash
# PR Android smoke — bootstrap + minimal Maestro flow (audit H25).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export MAESTRO_SEED_SKIP="${MAESTRO_SEED_SKIP:-1}"
export MAESTRO_CI_ARTIFACT_DIR="${MAESTRO_CI_ARTIFACT_DIR:-$ROOT/ci-artifacts/maestro-android}"

collect_on_failure() {
  local ec=$?
  if [[ "$ec" -ne 0 ]]; then
    bash "$ROOT/scripts/maestro-ci-collect-android-debug-artifacts.sh" || true
  fi
  return "$ec"
}

trap collect_on_failure EXIT

# shellcheck source=./maestro-ci-bootstrap-emulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-emulator.sh"

SMOKE_FLOW="${MAESTRO_ANDROID_SMOKE_FLOW:-android-pr-smoke.yaml}"
FLOW_PATH=".maestro/flows/$SMOKE_FLOW"
if [[ ! -f "$FLOW_PATH" ]]; then
  echo "Smoke flow missing: $FLOW_PATH"
  exit 1
fi

echo "==> Running Maestro Android PR smoke: $SMOKE_FLOW"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"

if ! maestro test --device "$DEVICE_SERIAL" "$FLOW_PATH"; then
  bash "$ROOT/scripts/maestro-ci-collect-android-debug-artifacts.sh" || true
  exit 1
fi

trap - EXIT
echo "Maestro Android PR smoke passed: $SMOKE_FLOW"
