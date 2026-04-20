# P0-03 Midpoint Review Packet (Week 6)

## Purpose

Standardize week-6 pilot decisioning with explicit evidence and one selected path: `continue`, `recover`, or `escalate`.

## Midpoint Snapshot Inputs

- Review date (UTC): `<YYYY-MM-DD>`
- Week-6 ending date (UTC): `<YYYY-MM-DD>`
- Active farmers (current): `<N>`
- Completed batches (current): `<N>`
- Buyer interactions (current): `<N>`
- Top 3 blockers:
  1. `<BLOCKER>`
  2. `<BLOCKER>`
  3. `<BLOCKER>`

## Decision Gate

Select one decision:

- [ ] `continue` (on-track)
- [ ] `recover` (at-risk but recoverable)
- [ ] `escalate` (material risk to P0-03 closure)

## Decision Criteria

### Continue (on-track)

Use when all apply:

- Active farmers are on path to `>=20` by week 12.
- At least one batch completion is already achieved or clearly imminent.
- Buyer participation is active and not blocked.

### Recover (at-risk but recoverable)

Use when any apply, but corrective plan is credible:

- Farmer adoption behind target trajectory.
- Batch completion still `0` with feasible near-term path.
- Buyer interaction exists but is inconsistent.

Required recovery fields:

- Recovery owner:
- Recovery actions (max 5):
- Recovery due dates:
- Next review date:

### Escalate (material risk)

Use when any apply:

- No credible path to `>=20` active farmers by week 12.
- Batch completion path is blocked by unresolved structural issue.
- Tier 3 buyer engagement is not viable in pilot window.

Required escalation fields:

- Escalation owner:
- Escalation audience:
- Decision requested (scope change / timeline change / partner replacement / stop):
- Decision needed by (UTC):

## Required Artifact Updates After Midpoint Decision

- `product-os/04-quality/p0-03-pilot-evidence-log.md` (week-6 row + scoreboard status)
- `product-os/06-status/current-focus.md` (midpoint decision summary)
- `product-os/06-status/daily-log.md` (midpoint execution entry)

## Midpoint Status Snippet (copy/edit)

- P0-03 midpoint review (`week 6`) decision: `<continue|recover|escalate>`; farmers `<N>/20`, batches `<N>/1`, buyer interactions `<N>/1`; key blockers documented and owner actions assigned.
