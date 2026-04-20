# P0-02 Readiness Index

## Current Gate State

- Gate: `P0-02` (legal memo)
- State: `blocked_on_signed_counsel_memo`
- Blocker owner: `You + counsel`
- Operator playbook: `product-os/04-quality/p0-02-operator-runbook.md`

## Artifact Chain (execution order)

1. Outbound request prep
   - `product-os/04-quality/p0-02-counsel-memo-commissioning-brief.md`
   - `product-os/04-quality/p0-02-counsel-handoff-message-draft.md`
   - `product-os/04-quality/p0-02-counsel-dispatch-example.md`
   - `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`
2. After send tracking
   - `product-os/04-quality/p0-02-counsel-response-tracker.md`
   - `product-os/04-quality/p0-02-post-send-status-snippet.md`
   - `product-os/04-quality/p0-02-counsel-follow-up-templates.md`
   - `product-os/04-quality/p0-02-dispatch-one-pass-update-block.md`
3. On memo receipt
   - `product-os/04-quality/p0-02-counsel-memo-intake-template.md`
   - `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`
   - `product-os/04-quality/p0-02-closeout-checklist.md`
   - `product-os/04-quality/p0-02-memo-received-one-pass-closeout-block.md`

## Immediate Next Action

- Send counsel request using final packet + checklist:
  - `product-os/04-quality/p0-02-send-packet.md`
  - `product-os/04-quality/p0-02-counsel-dispatch-checklist.md`
- Record send metadata in response tracker.
- Apply post-send status snippet into status logs.

## Gate Close Definition

P0-02 is closed only when:

- signed memo is received and referenced by immutable ID
- all three legal questions are explicitly answered
- required legal wording deltas are patched in canonical spec
- execution board and status logs are updated with memo ID/date

