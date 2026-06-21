#!/usr/bin/env bash
# Nightly Maestro device smoke subset on iOS simulator (slice 4.8).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=./maestro-ci-bootstrap-simulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-simulator.sh"

FLOWS="$(node -e "
const manifest = require('./qa/automation-baselines/maestro-nightly-smoke.json');
for (const item of manifest.nightlyFlows) {
  console.log(item.flowFile);
}
")"

if [[ -z "$FLOWS" ]]; then
  echo "No nightly Maestro flows configured."
  exit 1
fi

while IFS= read -r flow; do
  FLOW_PATH=".maestro/flows/$flow"
  if [[ ! -f "$FLOW_PATH" ]]; then
    echo "Nightly flow missing: $FLOW_PATH"
    exit 1
  fi
  echo "==> Running Maestro nightly flow: $flow"
  xcrun simctl terminate "$MAESTRO_DEVICE_ID" "$MAESTRO_APP_ID" 2>/dev/null || true
  maestro test "$FLOW_PATH"
done <<< "$FLOWS"

echo "Maestro nightly smoke subset passed."
