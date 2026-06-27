# Maestro boot state registry

Canonical **pre-flow app state** for Maestro CI. Prevents drift between binary install, SQLite seed, flow YAML, and testIDs.

**JSON baseline:** `apps/offline-product/qa/automation-baselines/maestro-boot-state.json`  
**Code mirror:** `apps/offline-product/features/testing/maestroBootStateRegistry.ts`  
**CI guard:** `maestro-boot-state-guard.mjs` (in `npm run qa:structural`)

## Why this exists

Maestro golden path failures clustered when:

- iOS installed a stale EAS artifact while Android built from the PR commit
- Bootstrap skipped full seed but flows still assumed English + dismissed welcome
- Guards checked YAML strings, not boot semantics

This registry is the single contract for **profile → settings → seed script → testIDs → build policy**.

## Profiles

| Profile | Use | Seed script | Build from commit |
|---------|-----|-------------|-------------------|
| `golden_path_minimal` | H25 PR golden path (`MAESTRO_SEED_SKIP=1`) | `seed-maestro-boot-profile.mjs` | **Yes** (both platforms) |
| `default` | Nightly plot/document flows | `seed-maestro-simulator.mjs` | No (EAS simulator OK) |

### `golden_path_minimal` settings

| Setting key | Value | Purpose |
|-------------|-------|---------|
| `tracebudAppLanguage` | `en` | Locale-safe Backup / Sync assertions |
| `account_welcome_dismissed` | `1` | Skip welcome sheet (matches `SignInSheetContext`) |

### Boot-ready testID

| testID | When visible |
|--------|----------------|
| `maestro-boot-ready` | `authReady && !welcomeVisible` in `SignInSheetContext` |

Golden path flow waits on `maestro-boot-ready` before navigating tabs.

## How to change

1. Edit `maestro-boot-state.json` and `maestroBootStateRegistry.ts` together.
2. Update bootstrap scripts if seed script or profile env changes.
3. Update `.maestro/flows/settings-sync-smoke.yaml` if `flowTestIds` change.
4. Run `cd apps/offline-product && npm run qa:structural`.

## Guards

- `maestro-boot-state-guard.mjs` — JSON ↔ TS ↔ bootstrap ↔ flow ↔ app testID
- `maestro-golden-path-guard.mjs` — H25 workflow wiring (uses manifest `goldenPathBootProfile`)
