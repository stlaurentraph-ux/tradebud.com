# P0-02 Single-Shot Closeout Checklist

## Purpose

Close `P0-02` in one deterministic pass after signed counsel memo is received.

## Required Inputs (must exist before execution)

- Signed memo file/reference ID
- Completed intake artifact:
  - `product-os/04-quality/p0-02-counsel-memo-intake-template.md`
- Completed spec delta mapping:
  - `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`

## Exact Update Order

1. Apply legal wording deltas in `TRACEBUD_V1_2_EUDR_SPEC.md`
   - Target legal-sensitive sections pre-labeled in scaffold (29, 22, 23, 45.4).
2. Update execution gate source:
   - `product-os/01-roadmap/v1-6-spec-execution-board.md`
   - Mark `P0-02` as complete with memo ID/date reference.
3. Update current status board:
   - `product-os/06-status/current-focus.md`
   - Replace P0-02 pending text with completed text including memo ID/date.
4. Append trace in completion log:
   - `product-os/06-status/done-log.md`
   - Add one line for P0-02 closure with memo reference.
5. Record operational timeline entry:
   - `product-os/06-status/daily-log.md`
   - Add closure entry: scope, files, decisions, blockers resolved.

## Line-Level Touchpoint Index (fill during closeout)

| File | Section/header to update | Memo ID/date inserted | Completed |
|---|---|---|---|
| `TRACEBUD_V1_2_EUDR_SPEC.md` | Section 29 / 22 / 23 / 45.4 as applicable | | [ ] |
| `product-os/01-roadmap/v1-6-spec-execution-board.md` | P0-02 row | | [ ] |
| `product-os/06-status/current-focus.md` | P0 gate status bullet | | [ ] |
| `product-os/06-status/done-log.md` | new top done entry | | [ ] |
| `product-os/06-status/daily-log.md` | new top daily entry | | [ ] |

## Final Validation (all required)

- [ ] Memo ID/date appears in all status artifacts.
- [ ] Intake template is fully populated and signed memo reference is immutable.
- [ ] Scaffold rows are fully resolved (no blank legal condition mappings).
- [ ] Execution board `P0-02` is marked complete.
- [ ] No unresolved legal blocker remains for engineering kickoff.

## Closeout Stamp

- P0-02 closed at:
- Closed by:
- Counsel memo ID:

