# P1 Cycle Snapshot Template

## Purpose

Provide a single-cycle leadership snapshot for `P1-01..P1-05` status, risk posture, and escalation rollup.

## Fill Once (per cycle)

- Snapshot date (UTC): `<YYYY-MM-DD>`
- Cycle owner: `<OWNER>`
- Next cycle due (UTC): `<YYYY-MM-DD>`
- Evidence register sync complete: `<yes|no>`
- Pending tracker sync complete: `<yes|no>`

## Gate Status Snapshot

| Gate ID | Decision status (`pending|decided`) | Risk status (`open|at_risk|overdue`) | Escalation (`none|level_1|level_2|level_3`) | Owner | Next SLA (UTC) | Evidence status (`pending|verified|superseded`) | Note |
|---|---|---|---|---|---|---|---|
| P1-01 | | | | | | | |
| P1-02 | | | | | | | |
| P1-03 | | | | | | | |
| P1-04 | | | | | | | |
| P1-05 | | | | | | | |

## Rollup

- Decided gates: `<N>/5`
- Pending gates: `<N>/5`
- At-risk gates: `<N>`
- Overdue gates: `<N>`
- Highest escalation level this cycle: `<none|level_1|level_2|level_3>`
- Release-blocking gates: `<NONE_OR_LIST>`

## Leadership Summary (3 lines max)

- Progress: `<ONE_LINE>`
- Main blocker: `<ONE_LINE>`
- Required decision/support before next cycle: `<ONE_LINE>`

## Publication Targets

Paste/adapt into:

- `product-os/06-status/current-focus.md`
- `product-os/06-status/daily-log.md`
