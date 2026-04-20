# P0-03 Operator Runbook

## Purpose

Run the MVP pilot gate (`P0-03`) end-to-end with explicit phase transitions and closure checks.

## Phase 0 - Preconditions

- [ ] Tier 2 cooperative candidate confirmed.
- [ ] Tier 3 buyer candidate confirmed.
- [ ] Pilot owner, ops owner, analytics owner assigned.
- [ ] 3-month pilot window proposed.

If any precondition is missing -> do not start pilot status.

## Phase 1 - Kickoff

Execute in order:

1. `product-os/04-quality/p0-03-pilot-kickoff-checklist.md`
2. `product-os/04-quality/p0-03-kickoff-one-pass-update-block.md`
3. `product-os/04-quality/p0-03-pilot-evidence-log.md`

Expected result:

- Kickoff record completed with real partners and dates.
- Pilot evidence log status set to `active`.
- Weekly cadence row initialized.

## Phase 2 - Weekly Operations Cadence

Each week:

- Update active farmers, completed batches, buyer interactions.
- Record risks/blockers and corrective actions.
- Update acceptance evidence table when thresholds are met.
- Use `product-os/04-quality/p0-03-weekly-checkpoint-template-pack.md` as the canonical weekly row/scoreboard format.

If active farmers trend below target path -> record risk and corrective owner immediately.
If batch count is still `0` at midpoint -> mark as escalation risk in weekly log.
At week 6, execute `product-os/04-quality/p0-03-midpoint-review-packet.md` and record one explicit decision path (`continue`/`recover`/`escalate`).

## Phase 3 - Spec Feedback

As pilot findings emerge:

- Add entries in `Spec Delta Candidates` table.
- Map each candidate to affected spec sections.
- Assign owner and status.

If a finding materially changes compliance behavior -> prioritize delta before pilot close.

## Phase 4 - Closeout

Execute:

1. `product-os/04-quality/p0-03-closeout-one-pass-update-block.md`

Close `P0-03` only when all are true:

- Tier 2 cooperative evidence is present.
- Farmer participation evidence meets `>=20`.
- At least one completed batch is evidenced.
- Tier 3 buyer participation is evidenced.
- Pilot report location is linked.
- Spec-delta candidates are resolved or explicitly queued with owner/deadline.
- Execution board and status logs reflect closure.
