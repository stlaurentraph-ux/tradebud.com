# Structural contracts runbook

How Tracebud encodes cross-cutting invariants as **contract-as-code** so agents and CI catch class regressions early.

## Registries

| Domain | Markdown | Code mirror | Guard |
|--------|----------|-------------|-------|
| Farmer cross-device artifacts | `farmer-artifact-sync-registry.md` | `features/sync/farmerArtifactRegistry.ts` | `sync-parity-guard.mjs`, `registry-md-parity-guard.mjs`, `pending-sync-registry-guard.mjs` |
| Field regressions | `field-app-regression-ledger.md` | — | `field-regression-guard.mjs` |
| Analytics slices | — | — | `analytics-slice-guard.mjs` (report/strict via `run-automation-guards.mjs`) |

## Commands

```bash
cd apps/offline-product

# All structural guards (local: feature-doc warns only)
npm run qa:structural

# CI mode (feature-doc blocks)
npm run qa:structural:ci

# Full regression lane (lint + typecheck + test + field regression + structural)
npm run qa:regression

# Scaffold a new farmer artifact
npm run scaffold:farmer-artifact -- --id my_artifact --audit my_artifact_synced
```

## Adding a farmer artifact (checklist)

1. Run scaffold script (prints checklist + optional restore stub).
2. Implement upload, server store, restore, UI reload.
3. Add row to `farmer-artifact-sync-registry.md` and arrays in `farmerArtifactRegistry.ts`.
4. Wire `restoreFarmerCloudState` and `enqueueFarmerCloudSyncActions` as needed.
5. Add unit test for restore path.
6. Extend `DEVICE_SMOKE_CHECKLIST.md` §12 (cross-device).
7. Update FEAT doc + `daily-log.md`.
8. `npm run qa:structural` green.

## Orchestrator mental model

```
Local mutation → pending_sync / audit enqueue → server truth
Other device   → restoreFarmerCloudState → SQLite → UI reload
```

Settings **cloud parity hint** (`measureCloudParitySummary`) compares server plot/voucher counts vs local after sync — use when debugging “missing on iPad” reports.

## CI

The Expo app job runs `npm run qa:structural:ci` after field regression guard.

## Agent rules

- `.cursor/rules/structural-contracts.mdc` — always-on pointer
- `.cursor/rules/cross-device-sync.mdc` — sync/evidence/state paths

## PR template

Lane 3 includes a **Structural contracts** subsection — complete when touching offline features or sync.
