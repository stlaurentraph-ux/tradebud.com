# P0-02 Final Send Packet

## Purpose

Single-file packet to dispatch the P0-02 legal memo request immediately.

Canonical flow reference: `product-os/04-quality/p0-02-operator-runbook.md`.

## Step 1: Fill These Fields

- Counsel name: `<COUNSEL_NAME>`
- Counsel email: `<COUNSEL_EMAIL>`
- Sender name: `<YOUR_NAME>`
- Expected response date: `<YYYY-MM-DD>`
- Message channel: `<email|portal|other>`
- Conversation/thread ID placeholder: `<THREAD_ID_OR_EMAIL>`

## Step 1.5: Preflight (must be true before send)

- [ ] Counsel is actually appointed and reachable now (not a placeholder contact).
- [ ] Expected response date is realistic and business-day aligned.
- [ ] Source-pack paths below are current and accessible.
- [ ] Subject line contains `P0-02` and response date.
- [ ] This packet has no remaining `<...>` placeholders.

## Step 2: Subject Line

Tracebud P0-02 Legal Opinion Request (Signed Memo Required) — Response requested by `<YYYY-MM-DD>`

## Step 3: Email Body (copy/edit/send)

Hello `<COUNSEL_NAME>`,

We are requesting a signed legal memo for Tracebud v1.6 execution gate **P0-02**.

Required legal positions:

1. GDPR cryptographic shredding under retention obligations.
2. Downstream first/subsequent interpretation boundary.
3. Adequacy of Section 45.4 liability boundary wording.

Source pack:

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `REQUIREMENTS.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`
- `product-os/01-roadmap/v1-6-spec-execution-board.md`
- `product-os/04-quality/p0-02-counsel-memo-commissioning-brief.md`

Required output contract:

- Explicit position per question (approved / approved with conditions / not approved)
- Residual risk statement per question
- Required wording changes with section references
- Release blockers and mitigation conditions
- Signature block (name, firm, date, memo ID/version)

Preferred format: signed PDF memo with memo ID and signature date.

Thank you,  
`<YOUR_NAME>`

## Step 3.5: Source-Pack Manifest (attach or link in same message)

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `REQUIREMENTS.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`
- `product-os/01-roadmap/v1-6-spec-execution-board.md`
- `product-os/04-quality/p0-02-counsel-memo-commissioning-brief.md`
- `product-os/04-quality/p0-02-counsel-memo-intake-template.md`

## Step 4: Immediately After Send (copy to tracker)

- Request status: `sent`
- Recipient: `<COUNSEL_EMAIL>`
- Sent date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Expected response date: `<YYYY-MM-DD>`
- Follow-up cadence: `every 3 business days`
- Escalation owner: `<OWNER>`
- Conversation/thread ID: `<THREAD_ID_OR_EMAIL>`
- Message channel: `<email|portal|other>`

## Step 5: Log Updates Required

- `product-os/04-quality/p0-02-counsel-response-tracker.md`
- `product-os/06-status/current-focus.md`
- `product-os/06-status/daily-log.md`
- `product-os/04-quality/p0-02-counsel-follow-up-templates.md` (for D+3/D+6/escalation cadence messages)
- `product-os/04-quality/p0-02-dispatch-one-pass-update-block.md` (fill once; paste tracker + status updates)
- `product-os/04-quality/p0-02-memo-received-one-pass-closeout-block.md` (use on signed memo receipt for one-pass closeout updates)

## Step 6: Post-Send Status Snippet (copy once, then edit values)

- P0-02 counsel request dispatched to `<COUNSEL_EMAIL>` on `<YYYY-MM-DDTHH:MM:SSZ>` via `<CHANNEL>`; expected response date `<YYYY-MM-DD>`, follow-up cadence every 3 business days, thread `<THREAD_ID_OR_EMAIL>`.

