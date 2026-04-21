# Next Milestone Decision Pack

## Decision fork

Choose one primary milestone lane for the next execution window.

## Option A - Integrations-first (recommended if external connectivity is priority)

Focus: FEAT-009 hardening and productionization.

Execution targets:
- Stabilize remaining Cool Farm V2 test drift and close open backend changes.
- Finalize scheduler/ops semantics for integration runs and stale-claim sweeper.
- Keep integration audit/telemetry surfaces release-ready.

Exit criteria:
- FEAT-009 backend suites green and committed.
- Integration runbook + status telemetry reviewed by operators.

## Option B - Compliance UX-first (recommended if filing quality is priority)

Focus: FEAT-004 filing preflight and operator remediation ergonomics.

Execution targets:
- Improve filing preflight clarity and blocker remediation surfaces.
- Tighten evidence/readiness/risk explainability in operator flows.
- Reduce time-to-resolution for DDS filing exceptions.

Exit criteria:
- Preflight quality checks complete with deterministic blocker messaging.
- Operator UX acceptance checks updated and green.

## Recommendation

- If commercial/partner delivery is dominant this cycle: **Option A (FEAT-009)**.
- If filing throughput and compliance reliability are dominant: **Option B (FEAT-004)**.

## Required explicit choice

Record selected lane in `product-os/06-status/current-focus.md` before starting the next implementation slice.
