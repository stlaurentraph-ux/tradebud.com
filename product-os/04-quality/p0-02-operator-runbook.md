# P0-02 Operator Runbook

## Purpose

Run `P0-02` end-to-end with one operational playbook from dispatch through closeout.

## Phase 0 - Preconditions

- [ ] External counsel is appointed.
- [ ] Counsel email/channel is verified.
- [ ] Required source pack is available.

If any item is missing -> stop and resolve before dispatch.

## Phase 1 - Dispatch

Execute:

1. `product-os/04-quality/p0-02-send-packet.md`
2. `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`

Then immediately execute:

3. `product-os/04-quality/p0-02-dispatch-one-pass-update-block.md`

Expected result:

- Request status becomes `sent` in tracker.
- `current-focus.md` and `daily-log.md` have dispatch trace.

If dispatch fails -> log failure in tracker follow-up row, correct issue, resend within same thread.

## Phase 2 - Follow-Up Cadence (every 3 business days)

Use:

- `product-os/04-quality/p0-02-counsel-follow-up-templates.md`

Cadence branches:

- If D+3 and no confirmation -> send Template A (`follow_up_d3_sent`).
- If D+6 and no schedule confidence -> send Template B (`follow_up_d6_sent`).
- If response date risk persists -> send Template C (`escalation_follow_up_sent`).
- If counsel revises date -> update tracker with `response_date_revised` and adjust expected date in status logs.

After every follow-up:

- Update `p0-02-counsel-response-tracker.md`
- Add a `daily-log.md` note when outcome materially changes schedule/risk.

## Phase 3 - Memo Receipt

On signed memo arrival, execute immediately:

1. `product-os/04-quality/p0-02-memo-received-one-pass-closeout-block.md`
2. `product-os/04-quality/p0-02-counsel-memo-intake-template.md`
3. `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`

Expected result:

- Tracker memo receipt record populated.
- Intake metadata populated with immutable memo reference.
- Scaffold traceability record populated.

If memo is unsigned or missing explicit decisions -> keep `P0-02` open and request corrected signed memo in same thread.

## Phase 4 - Closeout

Execute:

1. `product-os/04-quality/p0-02-closeout-checklist.md`

Mandatory artifacts to update:

- `TRACEBUD_V1_2_EUDR_SPEC.md` (only if legal deltas required)
- `product-os/01-roadmap/v1-6-spec-execution-board.md` (mark `P0-02` complete)
- `product-os/06-status/current-focus.md`
- `product-os/06-status/done-log.md`
- `product-os/06-status/daily-log.md`

If any closeout validation item fails -> do not mark P0-02 complete; fix failing item first.

## Completion Criteria

`P0-02` is complete only when all are true:

- Signed memo received with immutable ID/reference.
- All three legal questions have explicit decisions.
- Required legal conditions are represented in spec wording.
- Execution board and status logs include memo ID/date evidence.
