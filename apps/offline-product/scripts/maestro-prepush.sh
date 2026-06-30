#!/usr/bin/env bash
# Local Maestro prepush gate — run BEFORE pushing Maestro/offline CI changes.
#
# Tier 1–2 (default): static wiring + regression — fast, any OS (~2 min).
# Tier 3 (full):      local iOS golden path on macOS — same path as CI macOS job (~15–30 min).
#
# Usage:
#   npm run qa:maestro:prepush           # static tiers (agents, quick check)
#   npm run qa:maestro:prepush:full       # static + local iOS golden path (humans before push)
#
# Env:
#   MAESTRO_PREPUSH_MODE=static|full     default static unless :full script sets full
#   MAESTRO_PREPUSH_SKIP_LOCAL=1         skip tier 3 even in full mode (macOS without Maestro)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${MAESTRO_PREPUSH_MODE:-static}"

echo "==> Maestro prepush (mode=${MODE})"
echo "    Rule: do not push Maestro changes until this passes; use :full on macOS before push."
echo ""

echo "==> Tier 1: Maestro static wiring"
node ./scripts/generate-maestro-ci-boot-db.mjs
npm run qa:maestro:preflight
npm run qa:maestro:golden-path:assert
npm run qa:maestro:prepush:assert

echo ""
echo "==> Tier 2: offline regression (lint, typecheck, tests, structural guards)"
npm run qa:regression

if [[ "$MODE" != "full" ]]; then
  echo ""
  echo "Maestro prepush (static) passed."
  echo "On macOS, before pushing Maestro E2E changes, also run:"
  echo "  npm run qa:maestro:prepush:full"
  exit 0
fi

if [[ "${MAESTRO_PREPUSH_SKIP_LOCAL:-}" == "1" ]]; then
  echo ""
  echo "[warn] MAESTRO_PREPUSH_SKIP_LOCAL=1 — skipping local iOS golden path."
  echo "Maestro prepush (full, local skipped) passed."
  exit 0
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo ""
  echo "[error] qa:maestro:prepush:full requires macOS for local iOS golden path."
  echo "Run static prepush here, then full prepush on a Mac before push."
  exit 1
fi

export PATH="${PATH:+$PATH:}$HOME/.maestro/bin"

if ! command -v maestro >/dev/null 2>&1; then
  echo "[error] Maestro CLI not found. Install: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  exit 1
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "[error] Xcode not available — required for local iOS golden path."
  exit 1
fi

echo ""
echo "==> Tier 3: local iOS golden path (CI-parity assemble + bootstrap + flow)"
bash ./scripts/maestro-ci-assemble-ios-simulator.sh
npm run qa:maestro:golden-path

echo ""
echo "Maestro prepush (full) passed — safe to push Maestro changes."
echo "GitHub will still run Android (and macOS only if not already green on the PR)."
