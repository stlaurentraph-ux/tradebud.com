# P0-03 Weekly Checkpoint Template Pack (Weeks 1-12)

## Purpose

Provide a fixed 12-week checkpoint template with gate-progress fields so pilot reporting stays consistent through the full 3-month window.

## Gate Progress Scoreboard (update weekly)

| Gate metric | Target | Current value | Progress | Status |
|---|---:|---:|---:|---|
| Active farmers | 20 | 0 | `0/20` | `pending` |
| Completed batches | 1 | 0 | `0/1` | `pending` |
| Buyer interactions | 1 | 0 | `0/1` | `pending` |

Status rules:

- `pending`: progress below target.
- `met`: target reached or exceeded.
- `at_risk`: trend indicates likely miss without corrective action.

## Week-by-Week Template (copy into evidence log rows)

| Week | Week ending (UTC) | Active farmers | Batches completed (cumulative) | Buyer interactions (cumulative) | Progress snapshot (`farmers/20`, `batches/1`, `buyer/1`) | Risks/blockers | Corrective actions | Owner |
|---:|---|---:|---:|---:|---|---|---|---|
| 1 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 2 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 3 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 4 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 5 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 6 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 7 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 8 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 9 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 10 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 11 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |
| 12 | `<YYYY-MM-DD>` |  |  |  |  |  |  |  |

## Midpoint Escalation Rule (end of week 6)

- If `batches completed` is still `0` -> add explicit escalation note and corrective plan in weekly row.
- If `active farmers` is below 10 -> flag `at_risk` and assign corrective owner/date.

## End-of-Pilot Handoff Inputs

At week 12, prepare:

- Final scoreboard values and statuses.
- Top 3 blockers encountered and outcomes.
- Spec-delta candidates to carry into closeout artifacts.
