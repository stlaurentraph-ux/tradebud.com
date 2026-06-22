# Agent instructions (Tracebud monorepo)

**Canonical agent ops:** `.cursor/rules/agent-operations.mdc`  
**Automation safety (Lane 1):** `.cursor/rules/automation-safety.mdc`  
**Work queue:** `product-os/06-status/agent-queue.md`  
**Exhaustive plan:** `product-os/06-status/automation-ops-plan.md`  
**Offline annex:** `product-os/04-quality/offline-automation-runbook.md`  
**CI secrets (doc only):** `product-os/04-quality/ci-secrets-and-fixtures.md`

Use this file when tooling does not load `.cursor/rules/*.mdc` (Cloud Agents, external bots).

## Operating model (summary)

| Loop | Who acts |
|------|----------|
| Build | CI + guards on PR |
| Deploy | Vercel / Railway / EAS after merge |
| Verify | Smoke, Playwright, Sentry → Lane 2 if red |
| Ops | n8n Founder OS (forms, cadence) |

| Lane | Branch | Start command |
|------|--------|---------------|
| 1 Guardrails | `chore/automation-*` | `pick-automation-slice` → `implement-automation-slice` |
| 2 Maintenance | `fix/*` | `fix-regression` |
| 3 Features | `feature/<app>-*` | `start-agent-task` → `build-feature` |

**Parallelism:** one writer per app directory. Different apps OK concurrently. Lane 3 waits if Lane 1 guardrails PR is open on the same app.

**Implementation order:** Bundles A→E in `automation-ops-plan.md` §16. Default next work: **Bundle A** (`0.M.0` marketing lint first).

## Read order (Lane 3 product changes)

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`
7. `product-os/06-status/current-focus.md` — claim **In-flight** before editing
8. App runbook if offline: `offline-automation-runbook.md`

Lane 1 guardrails: read `automation-ops-plan.md` + `agent-queue.md` + `automation-safety.mdc` instead.

## Per-app verify (before PR)

| App | Command |
|-----|---------|
| **offline** | `cd apps/offline-product && npm run qa:regression && npm run qa:automation:phase1` |
| **marketing** | `npm run lint -w tracebud-marketing && npm run build -w tracebud-marketing` |
| **dashboard** | `npm run lint -w dashboard-product && npm test -w dashboard-product` |
| **backend** | `npm run lint -w tracebud-backend && npm test -w tracebud-backend` |

After Bundle A: `npm run check:marketing` / `npm run check:dashboard` when those scripts exist.

CI green on PR is source of truth.

## Forbidden (all agents)

- Push to `main` or merge PRs without human approval
- Commit `.env.local`, tokens, or CI secrets
- Weaken CI (skip tests, delete checks, `--max-warnings` > 0)
- Mix guardrails CI + product features in one PR
- Mix root lockfile/workspace restructure + product code in one PR
- Vercel / Railway / Supabase **production** config without explicit user request
- Enable GitHub required branch checks (human gate **0.H**)
- Offline: `release:*`, `update:*`, EAS submit; `DEVICE_SMOKE_SIGNOFF.json`; `DEVICE_SMOKE_SIGNOFF_SKIP=1`

## Allowed

- Feature slices on `feature/*` branches
- Guardrail slices on `chore/automation-*` (one slice ID per PR)
- Fix slices on `fix/*` (max ~200 lines)
- Guard scripts, baselines, Maestro flows, testIDs (Lane 1)
- `product-os/` status updates for the slice

## Quality gates (Lane 3)

See `.cursor/rules/quality-gates.mdc` and `build-feature.md`: permissions, transitions, exceptions, analytics, acceptance criteria; v1.6 when relevant.

## Human command map

| Intent | Command |
|--------|---------|
| Pick next CI slice | `pick-automation-slice` |
| Implement CI slice | `implement-automation-slice` |
| Start feature | `start-agent-task` |
| Build feature | `build-feature` |
| Fix regression | `fix-regression` |
| Weekly health digest | `weekly-health-summary` |
| Review | `review-feature` |
| Session end | `session-close` |
