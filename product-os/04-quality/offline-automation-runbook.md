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
| Expo `app` (Linux) | ubuntu | Offline / Maestro path changes on PR | `npm run qa:maestro:preflight` + path-filtered Expo job |
| `offline-maestro.yml` | ubuntu + macos | Maestro paths on PR (cost-gated) | preflight; cost-gated E2E |
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

## Field app release discipline

Applies to **every** preview OTA, store build, and production promote — not pilot-only.

| Gate | When | What |
|------|------|------|
| Fast automated | Every PR | Tier 0–2 verify (`qa:regression`, `qa:structural`, `qa:automation:phase1`) |
| Flow smoke | Sync / auth / mapping / documents touched | Relevant `DEVICE_SMOKE_CHECKLIST.md` sections on a physical device |
| Local E2E | Maestro / Android / OAuth / native config touched | `qa:maestro:prepush` (+ local Android golden before `main` — see cost runbook) |
| Bug-class guard | Every fix merge | Row in `field-app-regression-ledger.md` + test or structural guard |
| UI honesty | Farmer-facing slice | Success UI requires real preconditions (server link **and** empty queue, fresh SQLite read — not stale closure) |
| Promote | Preview → production | `release:preflight`, device sign-off, release health (see `release-health-gate.md`) |

**Pilot E2E bypass** (`e2eBypass.enabled` in `maestro-golden-path-ci.json`) is a **time-boxed exception** with an owner and `allowedUntil` date — not the default. Re-enable full E2E after local golden is green.

**Do not** ship production OTA from Metro-only validation. Preview channel first (`RELEASE_MODEL.md`).

### Sentry performance spans (Phase B)

Parent/child spans (sampled at `tracesSampleRate` in `sentryClient.ts`) cover:

| Span `op` | Name | Surface |
|-----------|------|---------|
| `app.lifecycle` | `app.boot` | SQLite + auth hydrate |
| `auth.oauth` | `auth.oauth.*` | OAuth sign-in + cold-start callback |
| `sync.session` | `sync.session_open` | Token verify before sync |
| `sync.pipeline` | `field.sync.pipeline` | Manual/auto backup pipeline |
| `sync.restore` / `sync.upload` / `sync.enqueue` / `sync.queue_drain` | step names under pipeline | Per-step latency in Sentry Performance |

`reportSyncFailure` annotates the active span with `sync_step`, `sync_cause`, and optional `sync_action_type`.

Helper: `features/observability/sentrySpans.ts` — always no-ops when Sentry is disabled (dev / Maestro CI thin boot).

### In-app problem report (Phase C)

Settings → **Need help?** → **Report a problem** opens a modal with an optional farmer note. Submission attaches a **sanitized** diagnostic snapshot (build/OTA, queue counts, classified sync step/cause — no PII or raw queue errors).

| Path | Behavior |
|------|----------|
| Sentry enabled | `captureFieldProblemFeedback` → Sentry User Feedback + `field_problem_report_submitted` analytics |
| Sentry disabled (local dev) | Pre-filled `mailto:support@tracebud.com` fallback |

Code: `features/observability/fieldProblemReport.ts`, `components/settings/ReportProblemModal.tsx`, wired from `app/(tabs)/settings.tsx`.

**Preview QA reporting:** `eas.json` preview profile sets `EXPO_PUBLIC_SENTRY_ENABLED=1` and `EXPO_PUBLIC_SENTRY_ENVIRONMENT=preview`. Ensure `EXPO_PUBLIC_SENTRY_DSN` is set on the EAS **preview** environment (same `react-native` DSN as production).

**Issue alerts (react-native):** manifest `product-os/04-quality/sentry-mobile-alert-rules.json` — apply with:

```bash
cd apps/offline-product
node scripts/setup-sentry-mobile-alerts.mjs
```

Requires `SENTRY_AUTH_TOKEN` with `alerts:write`. Manual UI fallback: `product-os/04-quality/sentry-mobile-alert-rules.md`.

---

## Minute-aware merge checklist

**Principle:** local verify **discovers**; GitHub Actions **confirms**. CI is the receipt, not the debugger.

**Cost runbook:** `maestro-ci-cost-runbook.md` (cost pyramid, cost gate, bypass rules).

### What costs minutes

| Expensive | Cheap / free |
|-----------|----------------|
| macOS Maestro (~10× Linux multiplier) | `qa:regression` + `qa:structural` locally |
| Android emulator assemble + smoke (~2h Linux) | `qa:maestro:prepush` (~2 min local) |
| Repeated pushes (cancel + restart billing) | One push per logical fix |
| Unrelated app jobs | Path filters skip marketing/backend/dashboard |

### Commit → push → merge

| Step | When satisfied locally? | Notes |
|------|-------------------------|-------|
| **Commit** | Yes | On `fix/*` or `feature/*` branch — never directly on `main` |
| **Push** | Yes | Opens/updates PR; **batch work first** — one push per fix slice |
| **Merge** | After minimum bar below | `main` merge triggers another CI run — avoid merge/revert loops |

### Local verify (before every push)

```bash
cd apps/offline-product
npm run qa:regression
npm run qa:structural    # when sync / registry / Maestro manifest touched
```

**Maestro / Android / OAuth / native paths** — also:

```bash
npm run qa:maestro:prepush
# macOS + booted emulator, before merge to main or native/Maestro release:
npm run qa:maestro:local:android:golden
# or: MAESTRO_PREPUSH_ANDROID_GOLDEN=1 npm run qa:maestro:prepush:full
```

### Minimum merge bar

**Default fix PR** (with `e2eBypass` active):

- [ ] Local tier 0 (+ structural if relevant) passed
- [ ] One push (or minimal push loop after local fix)
- [ ] PR CI green for jobs that **ran** (offline Linux `app` job + Maestro preflight ~1 min)
- [ ] Device smoke on phone when farmers would notice the change

**Higher bar** (re-enable E2E, Maestro/native release, or bypass off):

- [ ] Local Android golden green (`qa:maestro:local:android:golden`)
- [ ] `workflow_dispatch` on **Offline Maestro** with `force_e2e` / `run_golden_path` when PR matrix is insufficient
- [ ] Regression ledger row + guard for recurring bug class

**Production OTA / store** (additional — not every fix PR):

- [ ] Preview channel validated on tester device
- [ ] `npm run ota:production:preflight` or `update:preview:safe` path per `RELEASE_MODEL.md`
- [ ] DB migration applied on production **before** deploy when slice requires it (see `daily-log.md` ops notes)

### Minute-saving habits

1. **Work locally until green, then push once** — biggest saver.
2. **One app per PR** — path filters skip unrelated CI jobs.
3. **Android-only delta** — cost gate may skip macOS if iOS already green on the PR; avoid touching iOS Maestro files unnecessarily.
4. **`workflow_dispatch` sparingly** — full matrix on demand, not every iteration.
5. **Don't use CI to debug** — failed 45 min emulator runs mean local golden was skipped.
6. **Monitor billing** — GitHub → Settings → Billing → Actions; `gh run list --workflow=offline-maestro.yml`.

### Decision tree

```
Fix done and verified locally?
  └─ No  → keep working (free)
  └─ Yes → commit on branch → push ONCE
           └─ PR CI green for jobs that ran?
                └─ No  → fix locally; avoid push loops
                └─ Yes → farmer-visible field change?
                         └─ Yes → device smoke (free) → merge
                         └─ No  → merge
```

### Do not merge yet when

- CI red or still running for a **required** job
- Maestro/Android/oauth changed but only tested in Metro (not device/emulator)
- Fix bundled with unrelated feature work (hard to bisect)
- Production DB migration required but not applied
- Temporary bypass treated as full E2E sign-off

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
