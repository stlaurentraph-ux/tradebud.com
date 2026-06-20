# Offline automation runbook

Annex to `product-os/06-status/automation-ops-plan.md` — field app (`apps/offline-product`) guardrails, CI tiers, and release gates.

**Lane 1 command:** `implement-automation-slice`  
**Cursor rule:** `.cursor/rules/offline-automation.mdc`  
**Regression ledger:** `field-app-regression-ledger.md`

---

## Phase map (1.O)

| Slice | Goal | CI mode | Branch |
|-------|------|---------|--------|
| **1.O.1** | Guard scripts + baselines + report-mode CI | Report (non-blocking deltas) | **done** — PR #122 |
| **1.O.2** | Enable `--strict` on guards in CI | Blocking | **done** — PR #153 |
| **1.O.3** | Maestro macOS workflow prep | Maestro optional job | `chore/automation-offline-maestro` |

Later phases (3.O Maestro on `main`, release health) — see automation-ops-plan §7.

---

## Verification tiers

| Tier | Command | When |
|------|---------|------|
| 0 — fast | `npm run qa:regression` | Every PR touching offline |
| 1 — automation | `npm run qa:automation:phase1` | Every PR + CI `app` job |
| 2 — strict | `npm run qa:automation:phase1:strict` | CI `app` job (since 1.O.2) |
| 3 — device | `npm run qa:device` + sign-off | Preview OTA / release |

---

## Guard scripts

All live under `apps/offline-product/scripts/`. Baselines: `apps/offline-product/qa/automation-baselines/*.json`.

### `run-automation-guards.mjs`

Orchestrator. Flags:

- *(default)* — report mode; print deltas vs baseline; exit 0 unless `--strict`
- `--strict` — fail on drift (slice **1.O.2**)
- `--write-baseline` — refresh all baseline JSON files (local only; commit baselines in 1.O.1 PR)

```bash
cd apps/offline-product
npm run qa:automation:write-baselines   # refresh baselines
npm run qa:automation:phase1            # report mode
npm run qa:automation:phase1:strict     # blocking (post 1.O.2)
```

### `mobile-api-openapi-parity.mjs`

Scans `features/api`, `features/sync`, `features/network` for `/v1/*` paths; compares normalized templates to `docs/openapi/tracebud-v1-draft.yaml`. Surfaces mobile calls missing from OpenAPI (contract drift).

### `ota-native-fingerprint-gate.mjs`

SHA-256 fingerprint of OTA-sensitive native config (`app.json`, `eas.json`: runtimeVersion, plugins, bundle IDs, permissions, EAS channels). Drift means **native rebuild required** — do not ship JS-only OTA.

### `analytics-slice-guard.mjs`

Tracks canonical `ANALYTICS_EVENTS` in `features/observability/analytics.ts` and `trackEvent(ANALYTICS_EVENTS.*)` usage. New events require FEAT doc / analytics baseline update.

---

## CI integration

GitHub `app` job (after typecheck):

1. `npm run security:preflight`
2. `npm run qa:automation:phase1:strict` (blocking since 1.O.2)

Existing steps unchanged: lint, typecheck, unit tests, `field-regression-guard.mjs`, i18n queue smoke.

---

## Agent rules

- **Lane 3** waits while **1.O.*** guardrails PR is open on `apps/offline-product/`.
- Agents must **not** run `release:*`, `update:*`, EAS submit, or set `DEVICE_SMOKE_SIGNOFF_SKIP=1`.
- Before PR: `npm run qa:regression && npm run qa:automation:phase1`.

---

## Baseline workflow

1. Implement or change guard logic on `chore/automation-offline-phase1`.
2. Run `npm run qa:automation:write-baselines`.
3. Commit `qa/automation-baselines/*.json` with the guard PR.
4. After merge + green on `main`, slice **1.O.2** flipped CI to `--strict` (PR #153 merged).
