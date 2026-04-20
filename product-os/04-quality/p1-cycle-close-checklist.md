# P1 Cycle Close Checklist

## Purpose

Close a P1 cycle only when all operational artifacts reconcile to the same counts and gate states.

## Cycle Metadata

- Cycle date (UTC): `<YYYY-MM-DD>`
- Cycle owner: `<OWNER>`
- Reviewed by: `<OWNER_OR_REVIEWER>`

## Reconciliation Checks (must all pass)

- [ ] One-pass block values are complete in `product-os/04-quality/p1-external-decision-one-pass-update-block.md`.
- [ ] Evidence register sync is complete in `product-os/04-quality/p1-external-decision-evidence-register.md`.
- [ ] Pending tracker sync is complete in `product-os/04-quality/p1-pending-gate-tracker-board.md`.
- [ ] Snapshot counts in `product-os/04-quality/p1-cycle-snapshot-template.md` match gate-level statuses.
- [ ] Ledger row in `product-os/04-quality/p1-decision-history-ledger.md` matches snapshot totals and deltas.
- [ ] Weekly summary in `product-os/04-quality/p1-weekly-summary-block-template.md` matches latest snapshot + ledger row values.
- [ ] `current-focus.md` and `daily-log.md` reflect the same weekly block values.
- [ ] Any gate marked `decided` has `verified` evidence and no unresolved blocker in pending tracker.

## Decision

- Cycle close status: `<passed|failed>`
- If failed, failed checks: `<CHECK_IDS_OR_LINES>`
- Corrective owner: `<OWNER>`
- Corrective due date (UTC): `<YYYY-MM-DD>`

## Closeout Note (paste-ready)

- P1 cycle `<YYYY-MM-DD>` close checklist `<passed|failed>`; reconciliation across one-pass/evidence/tracker/snapshot/ledger/weekly-summary is `<complete|incomplete>`, corrective owner `<OWNER>`, due `<YYYY-MM-DD>`.
