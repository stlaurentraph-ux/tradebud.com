#!/usr/bin/env bash
# Optional Maestro flows for production OTA gate (slice 5.10).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=./maestro-ci-bootstrap-simulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-simulator.sh"

OPTIONAL_FLOWS="$(node -e "
const manifest = require('../../product-os/04-quality/ota-production-gate.json');
for (const flow of manifest.productionMaestroFlows ?? []) {
  if (!flow.required) console.log(flow.flowFile);
}
")"

if [[ -z "$OPTIONAL_FLOWS" ]]; then
  echo "No optional production Maestro flows configured."
  exit 0
fi

while IFS= read -r flow; do
  FLOW_PATH=".maestro/flows/$flow"
  if [[ ! -f "$FLOW_PATH" ]]; then
    echo "Optional flow missing (skip): $FLOW_PATH"
    continue
  fi
  echo "==> Running optional production Maestro flow: $flow"
  xcrun simctl terminate "$MAESTRO_DEVICE_ID" "$MAESTRO_APP_ID" 2>/dev/null || true
  maestro test "$FLOW_PATH"
done <<< "$OPTIONAL_FLOWS"

echo "Optional production Maestro flows passed."
