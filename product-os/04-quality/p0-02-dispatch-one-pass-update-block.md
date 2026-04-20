# P0-02 Dispatch One-Pass Update Block

## Purpose

Fill this once immediately after dispatch, then paste the derived blocks into tracker and status docs without retyping.

## Step 1: Fill Once (single source of truth)

- Dispatch date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Dispatch calendar date (UTC): `<YYYY-MM-DD>`
- Recipient email: `<COUNSEL_EMAIL>`
- Counsel name: `<COUNSEL_NAME>`
- Expected response date: `<YYYY-MM-DD>`
- Message channel: `<email|portal|other>`
- Conversation/thread ID: `<THREAD_ID_OR_EMAIL>`
- Escalation owner: `<OWNER>`
- Next action date (UTC): `<YYYY-MM-DD>` (first follow-up date)

## Step 2: Paste into `p0-02-counsel-response-tracker.md`

### Active Request block

- Request status: `sent`
- Recipient: `<COUNSEL_EMAIL>`
- Sent date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Expected response date: `<YYYY-MM-DD>`
- Follow-up cadence: `every 3 business days`
- Escalation owner: `<OWNER>`

### Follow-Up Log first row

| Date (UTC) | Action | Channel | Outcome | Next action date | Owner |
|---|---|---|---|---|---|
| `<YYYY-MM-DD>` | `dispatch_sent` | `<email|portal|other>` | `sent_ack_pending` | `<YYYY-MM-DD>` | `<OWNER>` |

## Step 3: Paste into `current-focus.md`

- P0-02 counsel request sent on `<YYYY-MM-DDTHH:MM:SSZ>` to `<COUNSEL_EMAIL>` via `<email|portal|other>`; expected response date `<YYYY-MM-DD>`; tracker updated at `product-os/04-quality/p0-02-counsel-response-tracker.md`; next follow-up due `<YYYY-MM-DD>`.

## Step 4: Paste into `daily-log.md`

### `<YYYY-MM-DD>` (execution: P0-02 counsel dispatch sent)
- Focus: dispatch P0-02 legal memo request to counsel and start SLA tracking.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: outbound request sent to `<COUNSEL_NAME>` (`<COUNSEL_EMAIL>`) via `<email|portal|other>` with commissioning brief + source pack; expected response date `<YYYY-MM-DD>`; first follow-up date `<YYYY-MM-DD>`.
- Risks: legal gate remains external until signed memo arrives.
- Blockers: Signed counsel memo pending.
- Next step: send D+3 follow-up using `product-os/04-quality/p0-02-counsel-follow-up-templates.md` and log outcome in tracker.
