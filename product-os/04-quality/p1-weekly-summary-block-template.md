# P1 Weekly Summary Block Template

## Purpose

Generate a consistent weekly summary using fields already captured in the cycle snapshot and decision-history ledger.

## Inputs (copy from latest cycle artifacts)

- Snapshot source: `product-os/04-quality/p1-cycle-snapshot-template.md`
- Ledger source: `product-os/04-quality/p1-decision-history-ledger.md`

Fill:

- Week ending (UTC): `<YYYY-MM-DD>`
- Cycle owner: `<OWNER>`
- Decided gates: `<N>/5`
- Pending gates: `<N>/5`
- At-risk gates: `<N>`
- Overdue gates: `<N>`
- Highest escalation: `<none|level_1|level_2|level_3>`
- Net delta decided vs prior: `<+N|0|-N>`
- Net delta overdue vs prior: `<+N|0|-N>`
- Reopened gates: `<NONE_OR_LIST>`
- Primary blocker theme: `<ONE_LINE>`
- Next corrective emphasis: `<ONE_LINE>`
- Support needed: `<ONE_LINE>`

## Weekly Summary Block (paste-ready)

### P1 Weekly Summary — `<YYYY-MM-DD>`
- Status: decided `<N>/5`, pending `<N>/5`, at-risk `<N>`, overdue `<N>`, highest escalation `<none|level_1|level_2|level_3>`.
- Trend vs prior: decided `<+N|0|-N>`, overdue `<+N|0|-N>`, reopened gates `<NONE_OR_LIST>`.
- Blockers: `<ONE_LINE>`.
- Next actions: `<ONE_LINE>`.
- Support needed: `<ONE_LINE>`.

## Publication Targets

- `product-os/06-status/current-focus.md`
- `product-os/06-status/daily-log.md`
