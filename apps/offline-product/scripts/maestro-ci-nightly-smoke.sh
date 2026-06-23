#!/usr/bin/env bash
# Nightly Maestro device smoke subset on iOS simulator (slice 4.8).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=./maestro-ci-bootstrap-simulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-simulator.sh"

run_flow() {
  local flow="$1"
  local seed_profile="${2:-}"
  local FLOW_PATH=".maestro/flows/$flow"
  if [[ ! -f "$FLOW_PATH" ]]; then
    echo "Nightly flow missing: $FLOW_PATH"
    exit 1
  fi

  if [[ -n "$seed_profile" ]]; then
    echo "==> Re-seeding simulator DB (profile=$seed_profile) before $flow"
    export MAESTRO_SEED_PROFILE="$seed_profile"
    node "$ROOT/scripts/seed-maestro-simulator.mjs"
    xcrun simctl terminate "$MAESTRO_DEVICE_ID" "$MAESTRO_APP_ID" 2>/dev/null || true
  fi

  echo "==> Running Maestro nightly flow: $flow"
  xcrun simctl terminate "$MAESTRO_DEVICE_ID" "$MAESTRO_APP_ID" 2>/dev/null || true
  maestro test "$FLOW_PATH"
}

while IFS='|' read -r flow seed_profile; do
  run_flow "$flow" "$seed_profile"
done < <(node -e "
const manifest = require('./qa/automation-baselines/maestro-nightly-smoke.json');
for (const item of manifest.nightlyFlows) {
  console.log([item.flowFile, item.seedProfile ?? ''].join('|'));
}
")

echo "Maestro nightly smoke subset passed."
