# ADR-007-agent-automation-ops

## Status

Accepted (2026-06-20)

## Context

Tracebud development uses Cursor agents for feature work alongside manual QA and partial CI (dashboard: lint + vitest only; no build/typecheck gate). Parallel work across dashboard, offline, and backend risks branch collisions, silent API drift, and agents merging broken builds. Sentry provides post-deploy signal but is not wired into agent intake or CI gates.

## Decision

Adopt a **three-lane operating model** integrated into Cursor and product-os:

1. **Lane 1 — Guardrails:** CI, regression guards, contract tests. Branches `chore/automation-*`. Command `implement-automation-slice`. One plan slice per PR with local proof before push.
2. **Lane 2 — Maintenance:** Regressions from Sentry/CI/staging. Branches `fix/*`. Command `fix-regression`. No feature scope.
3. **Lane 3 — Features:** Product slices from FEAT docs. Branches `feature/<app>-*`. Command `build-feature`. Intake via `agent-queue.md` (Ready only).

**Concurrency:** at most one active writer per app directory (`apps/dashboard-product`, `apps/offline-product`, `tracebud-backend`, etc.). Parallel app work uses separate branches and preferably git worktrees or Cloud Agent sessions.

**Canonical docs:** `product-os/06-status/automation-ops-plan.md` (exhaustive — four loops, Phases 0–5, Bundles A–E), `agent-queue.md` (intake), `.cursor/rules/agent-operations.mdc`, `.cursor/rules/automation-safety.mdc` (Lane 1 CI edits).

**Rollout:** phased 0→5; branch protection for new required checks only after green on `main`.

## Consequences

- Agents must read `agent-queue.md` before starting work.
- Automation changes do not ship with product behavior in the same PR.
- Feature agents defer dashboard CI hardening until Phase 0 guardrails merge (or use separate branch if different app).
- Status logs and queue updated per `docs-maintenance.mdc` and `session-close`.

## Alternatives considered

- **CI-only, no Cursor integration:** rejected — agents would not know lane boundaries or safe slice size.
- **Single agent does features + fixes + CI:** rejected — scope creep and mixed PRs.
- **Full Playwright before build gate:** rejected — Phase 0 build/typecheck has higher ROI first.

## Open follow-ups

- Bundle A implementation (0.M.0–0.M.3, 0.1–0.5) — see `agent-queue.md`
- GitHub branch protection (human 0.H)
- `ci-secrets-and-fixtures.md` — stub live; populate as secrets added
- Cursor Automations editor setup (Phase 3.1–3.2)
