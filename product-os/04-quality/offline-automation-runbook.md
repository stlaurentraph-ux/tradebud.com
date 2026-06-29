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
| **1.O.3** | Maestro macOS workflow prep | Maestro optional job | **done** — PR #155 |
| **3.O.1** | Maestro golden path on `main` | Blocking E2E (one flow) | **done** — PR #157 |

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

Existing steps unchanged: lint, typecheck, unit tests, `field-regression-guard.mjs`, `qa:maestro:preflight`, i18n queue smoke.

---

## Maestro CI (1.O.3+)

**Cost runbook (H25):** `product-os/04-quality/maestro-ci-cost-runbook.md` — local prepush before GitHub macOS/Android.

| Job | Platform | When | Command |
|-----|----------|------|---------|
| **Local prepush** | dev machine | **Before push** (Maestro paths) | `npm run qa:maestro:prepush` / `:full` on macOS |
| Expo `app` (Linux) | ubuntu | Every offline PR / push | `npm run qa:maestro:preflight` |
| `offline-maestro.yml` | ubuntu + macos | PR (Maestro paths) + manual dispatch | preflight; cost-gated E2E |
| `offline-maestro.yml` → **golden path** | macos + android | PR / push to `main` | `settings-sync-smoke.yaml` |

**Prepush (mandatory before push):**

```bash
cd apps/offline-product
npm run qa:maestro:prepush          # static + regression (~2 min)
npm run qa:maestro:prepush:full     # + local iOS golden path on macOS
```

**Manual macOS E2E:** GitHub Actions → **Offline Maestro** → `workflow_dispatch` with `run_golden_path=true`.

**Golden path on PR + `main` (H25):** both platforms build from the checked-out commit (`maestro-ci-assemble-*`). Boot state is defined in `maestro-boot-state-registry.md` / `maestro-boot-state.json` — profile `golden_path_minimal` seeds locale + welcome dismissed and the flow waits on `maestro-boot-ready`. Guard: `maestro-boot-state-guard.mjs`.

**Simulator seed (4.8+ / nightly):** macOS Maestro runners source `maestro-ci-bootstrap-simulator.sh`, which seeds SQLite (`Maria Santos` / `Finca Norte`) via `seed-maestro-simulator.mjs` before plot/document flows. Golden path uses `MAESTRO_SEED_SKIP=1` + boot profile instead of full farmer/plot seed.

**Refresh flow manifest baseline:**

```bash
cd apps/offline-product
npm run qa:maestro:write-baseline
```

Blocking E2E on `main` is slice **3.O.1** — golden path job in `offline-maestro.yml` (PR #157 merged).

---

## Mobile rollout SLO (4.O.1)

Weekly field-app health without Vercel/marketing smoke. Uses Sentry `tracebud/react-native` session stats + analytics failure proxies.

| Command | Purpose |
|---------|---------|
| `npm run mobile:slo:collect -- --report=mobile-rollout-slo-report.json` | Pull Sentry metrics (skips when token unset) |
| `npm run mobile:slo:gate -- --report=mobile-rollout-slo-report.json` | Evaluate thresholds (`release-rollout-slo-gate.mjs`) |
| `npm run mobile:slo:assert` | CI wiring guard |

**Workflow:** `.github/workflows/offline-mobile-slo-gate.yml` — Monday 10:00 UTC (reuses `SENTRY_RELEASE_HEALTH_AUTH_TOKEN`).

**Manifest:** `product-os/04-quality/mobile-rollout-slo.json`

**Nightly Maestro:** `tenure-evidence.yaml` + `mark-three-corners.yaml` in slice 4.8 manifest (4 flows nightly).

---

## Field tenant isolation smoke (4.O.2)

Blocking cross-farmer API probe in Expo CI (production API).

| Command | Purpose |
|---------|---------|
| `npm run qa:tenant-isolation` | Live probe — farmer A must not list/patch farmer B's plots |
| `npm run qa:tenant-isolation:assert` | CI wiring guard |

**Manifest:** `product-os/04-quality/golden-field-tenant-smoke.json`  
**Runbook:** `product-os/04-quality/golden-field-tenant-smoke.md`

**CI:** Expo `app` job sets `FIELD_TENANT_SMOKE_STRICT=1` — missing `FIELD_TENANT_SMOKE_*` secrets fail the job (no silent skip). Reuses `SUPABASE_URL` + `SUPABASE_ANON_KEY` from deploy smoke.

---

## Production OTA gate (5.10)

EAS skew protection + strict Maestro gate before production OTA.

| Command | Purpose |
|---------|---------|
| `npm run ota:skew:assert` | runtimeVersion + channel wiring + native fingerprint (+ optional EAS probe) |
| `npm run ota:production:preflight` | Full local gate before production OTA (sign-off required) |
| `npm run update:production:safe` | Preflight + `eas update` to production channel |
| `npm run ota:production:assert` | CI wiring guard |

**Workflow:** `.github/workflows/offline-ota-production-gate.yml` — manual dispatch; Linux guards + macOS Maestro.

**Manifest:** `product-os/04-quality/ota-production-gate.json`

**Nightly Maestro:** `mark-three-corners.yaml` added (4 flows).

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
