# P1 Decision History Ledger

## Purpose

Keep an append-only history of P1 cycle outcomes and deltas so blocker recurrence and trend drift are visible across cycles.

## Usage Rules

- Add one row per completed cycle; do not edit prior rows except typo correction.
- Keep delta fields relative to the immediately previous cycle.
- If a gate changes from `decided` back to `pending`, flag it in `Reopened gates`.
- Use links/paths to evidence packets or cycle snapshots for traceability.

## Cycle Ledger

| Cycle date (UTC) | Owner | Decided (`N/5`) | Pending (`N/5`) | At-risk (`N`) | Overdue (`N`) | Highest escalation | Reopened gates | Net delta decided vs prior | Net delta overdue vs prior | Primary blocker theme | Snapshot/evidence reference |
|---|---|---:|---:|---:|---:|---|---|---:|---:|---|---|
| | | | | | | | | | | | |

## Trend Notes

- Consecutive cycles with no `decided` improvement: `<N>`
- Gates repeatedly marked `overdue`: `<NONE_OR_LIST>`
- Escalation trend: `<improving|flat|worsening>`
- Next corrective emphasis: `<ONE_LINE>`
