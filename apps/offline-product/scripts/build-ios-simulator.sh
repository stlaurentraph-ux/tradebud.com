#!/usr/bin/env bash
# Cloud-build Tracebud for iOS Simulator (same native UI as TestFlight, with store demo data).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> EAS build: ios / profile simulator (includes EXPO_PUBLIC_STORE_DEMO=1)"
EAS_BUILD_NO_EXPO_GO_WARNING=true EAS_NO_VCS=1 node scripts/eas-build.mjs \
  --platform ios \
  --profile simulator \
  --non-interactive

echo ""
echo "When finished: npm run run:simulator"
