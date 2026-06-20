# Tracebud Product OS

Repo-native operating system for product, architecture, delivery, and implementation.

## Canonical sources (read first)

1. `TRACEBUD_V1_2_EUDR_SPEC.md` (canonical spec file; currently contains v1.6 content)
2. `REQUIREMENTS.md` (strategy, vision, positioning)
3. `MVP_PRD.md` (v1 scope boundaries)
4. `PRODUCT_PRD.md` (detailed product requirements)
5. `JTBD_PRD.md` (role workflows and activation/remediation jobs)
6. `BUILD_READINESS_ARTIFACTS.md` (states, entitlements, exceptions, events, acceptance)

If any document conflicts with these, canonical sources win.

## v1.6 enterprise architecture guardrails (must be reflected in implementation)

- Spatial correctness: compliance geometry stored as `GEOGRAPHY`; area derived with spheroidal math.
- Geometry integrity: polygon ingestion uses `ST_MakeValid`; reject excessive correction variance.
- Lineage performance: runtime lineage traversal remains O(1) through materialized lineage fields.
- Offline sync integrity: HLC ordering and idempotency-first conflict strategy.
- TRACES resilience: automatic payload chunking for size/vertex limits with parent shipment linkage.
- GDPR + retention: cryptographic shredding for PII while preserving immutable audit references.

### Filename aliases used in prompts

- `requirement.md` => `REQUIREMENTS.md`
- `PRODUCT_PDR.md` => `PRODUCT_PRD.md`

## How this replaces external PM tools

- Roadmap: `product-os/01-roadmap/`
- Features: `product-os/02-features/`
- Workflows: `product-os/03-workflows/`
- Quality gates: `product-os/04-quality/` (+ `ci-secrets-and-fixtures.md`)
- Decisions (ADR): `product-os/05-decisions/`
- Execution status: `product-os/06-status/` (`current-focus.md`, `agent-queue.md`, `automation-ops-plan.md`)

## Working loop in Cursor

### Automation / CI (Lane 1)

1. `agent-queue.md` — pick **Ready** slice (Bundles A→E).
2. `pick-automation-slice` — claim slice, branch, collision check.
3. `implement-automation-slice` — one slice per PR; `automation-safety.mdc`.
4. `session-close` — sync queue + plan tracker.

### Features (Lane 3)

1. Read canonical sources (above).
2. `current-focus.md` — claim **In-flight** row.
3. Confirm no guardrails PR on same app (`agent-queue.md`).
4. `start-agent-task` → `build-feature`.
5. `review-feature` → PR (lane-specific template section).
6. `session-close`.

### Regressions (Lane 2)

1. `fix-regression` — minimal fix, no features.
2. `session-close` if user-visible.

### Agent rules

| Artifact | Purpose |
|----------|---------|
| `AGENTS.md` | Cloud Agent fallback |
| `.cursor/rules/agent-operations.mdc` | Always-on lanes + loops |
| `.cursor/rules/automation-safety.mdc` | CI / queue edit safety |
| `automation-ops-plan.md` | Exhaustive phases + bundles |
| `ADR-007-agent-automation-ops.md` | Decision record |
| `offline-automation-runbook.md` | Offline Phase 1.O–5 |

## Parallel work

- One writer per app directory; git worktrees for concurrent sessions.
- Feature on dashboard + guardrails on marketing = OK.
- Feature + guardrails on same app = serialize.

## Current automation priority

**Bundle A** — see `automation-ops-plan.md` §16 and `agent-queue.md` Ready section. Start: **0.M.0** marketing lint.
