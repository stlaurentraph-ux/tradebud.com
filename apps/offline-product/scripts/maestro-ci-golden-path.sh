#!/usr/bin/env bash
# CI golden-path Maestro: boot simulator, install Tracebud, run one flow (slice 3.O.1).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Golden path only needs Settings → Backup; skip plot DB seed (~1 min on CI).
export MAESTRO_SEED_SKIP="${MAESTRO_SEED_SKIP:-1}"

# shellcheck source=./maestro-ci-bootstrap-simulator.sh
source "$ROOT/scripts/maestro-ci-bootstrap-simulator.sh"

GOLDEN_FLOW="${MAESTRO_GOLDEN_FLOW:-settings-sync-smoke.yaml}"
FLOW_PATH=".maestro/flows/$GOLDEN_FLOW"
if [[ ! -f "$FLOW_PATH" ]]; then
  echo "Golden flow missing: $FLOW_PATH"
  exit 1
fi

echo "==> Running Maestro golden path: $GOLDEN_FLOW"
xcrun simctl terminate "$MAESTRO_DEVICE_ID" "$MAESTRO_APP_ID" 2>/dev/null || true
maestro test "$FLOW_PATH"

echo "Maestro golden path passed: $GOLDEN_FLOW"
