# P1 External Decision Operator Runbook

## Purpose

Run `P1-01..P1-05` in repeatable decision cycles with explicit preflight, evidence verification, publication, and follow-up ownership.

## Phase 0 - Preflight

- [ ] Decision cycle owner is assigned.
- [ ] Decision cycle date and target due date are set.
- [ ] Source contacts for cloud/TRACES/mobile/GeoID/legal are identified.
- [ ] Last cycle blockers are reviewed.

If owner or source contacts are missing -> do not start a new cycle.

## Phase 1 - Evidence Collection and Verification

Execute:

1. `product-os/04-quality/p1-external-decision-evidence-register.md`
2. `product-os/04-quality/p1-pending-gate-tracker-board.md`

Required actions:

- Add or update one evidence row per gate touched this cycle.
- Update pending-gate rows for every unresolved gate (`owner`, `blocker`, `SLA`, `escalation`).
- Set `verification status` to `verified` only after source confirmation.
- Set `fresh-until` for every active row.
- Mark replaced records as `superseded` instead of deleting history.

If evidence cannot be verified -> keep corresponding gate `pending`.

## Phase 2 - Decision Publication

Execute in order:

1. `product-os/04-quality/p1-external-decision-one-pass-update-block.md`
2. `product-os/04-quality/p1-cycle-snapshot-template.md`
3. `product-os/04-quality/p1-decision-history-ledger.md`
4. `product-os/04-quality/p1-weekly-summary-block-template.md`
5. `product-os/04-quality/p1-cycle-close-checklist.md`
6. `product-os/01-roadmap/v1-6-spec-execution-board.md` (P1 follow-up context)
7. `product-os/06-status/current-focus.md`
8. `product-os/06-status/daily-log.md`

Expected result:

- All five gate statuses for the cycle are published in one aligned snapshot.
- Evidence-register synchronization status is recorded.
- Leadership-visible cycle snapshot is published with risk/escalation rollup.
- Append-only decision-history ledger row is captured with cycle deltas.
- Weekly summary block is published with consistent wording and trend fields.
- Cycle-close checklist confirms reconciliation across all cycle artifacts.
- Residual blockers and next due date are explicit.

## Phase 3 - Follow-Up SLA and Escalation

For every `pending` gate:

- Assign named owner and next due date.
- Record blocker reason and required external input.
- Recheck evidence freshness before next cycle publication.
- Update escalation level in `product-os/04-quality/p1-pending-gate-tracker-board.md`.

Escalate when:

- A gate remains `pending` for two consecutive cycles.
- Evidence freshness lapses before decision publication.
- Legal or external partner response date is repeatedly missed.

On escalation:

- Add escalation note in `daily-log.md`.
- Add explicit escalation owner and resolution deadline in cycle notes.

## Completion Criteria

`P1` is complete only when all are true:

- `P1-01..P1-05` are all `decided`.
- Every gate has at least one `verified` evidence row.
- No unresolved blockers remain in the latest cycle.
- Execution board and status logs reflect the same final gate states.
