# P0-02 Counsel Response Tracker

## Purpose

Track outbound legal request status, response SLA, follow-ups, and memo receipt events for `P0-02`.

## Active Request

- Request status: `not_sent`
- Recipient: `<fill_recipient>`
- Sent date/time (UTC): `<fill_when_sent>`
- Expected response date: `<fill_expected_date>`
- Follow-up cadence: `every 3 business days`
- Escalation owner: `<fill_owner>`

## Follow-Up Log

| Date (UTC) | Action | Channel | Outcome | Next action date | Owner |
|---|---|---|---|---|---|
| `<fill_date>` | `initial_send_pending` | `email` | `pending` | `<fill_next_action_date>` | `<fill_owner>` |

## Memo Receipt Record

- Memo received date/time (UTC):
- Memo ID/reference:
- Signed by:
- Signature date:
- File/link:

## Completion Gate Bridge

On `memo_received`, execute immediately:

1. `product-os/04-quality/p0-02-counsel-memo-intake-template.md`
2. `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`
3. `product-os/04-quality/p0-02-closeout-checklist.md`

