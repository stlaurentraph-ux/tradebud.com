# P1 Pending Gate Tracker Board

## Purpose

Track unresolved `P1` gates with explicit ownership, blocker class, SLA date, and escalation level between decision cycles.

## Status Rules

- `open`: gate remains unresolved and is within SLA.
- `at_risk`: due date is within 2 business days or evidence freshness is near expiry.
- `overdue`: due date passed without decision closure.

## Escalation Levels

- `none`: normal follow-up.
- `level_1`: pending for 2 consecutive cycles.
- `level_2`: overdue more than 5 business days or repeated external miss.
- `level_3`: release-blocking impact requiring explicit leadership decision.

## Pending Gate Table

| Gate ID | Current status (`open|at_risk|overdue`) | Owner | Blocker class | Blocker detail | Next SLA date (UTC) | Escalation level | Last updated (UTC) | Resolution note |
|---|---|---|---|---|---|---|---|---|
| P1-01 | `open` | | region decision | | | `none` | | |
| P1-02 | `open` | | external endpoint confirmation | | | `none` | | |
| P1-03 | `open` | | platform sign-off | | | `none` | | |
| P1-04 | `open` | | partner access model | | | `none` | | |
| P1-05 | `open` | | legal sign-off dependency | | | `none` | | |

## Cycle Checklist

- [ ] Every `pending` gate row has named owner and SLA date.
- [ ] Blocker class/detail are specific enough to route action.
- [ ] Escalation levels match current cycle age/risk.
- [ ] Resolved gates are updated with closure note and removed from pending cycle focus.
