# P0-02 Counsel Follow-Up Templates

## Purpose

Provide copy-ready follow-up messages after initial dispatch so P0-02 stays on a predictable SLA cadence.

## Usage Rules

- Keep cadence at every 3 business days unless counsel confirms a new date.
- Reuse the same thread whenever possible for traceability.
- After each follow-up, update:
  - `product-os/04-quality/p0-02-counsel-response-tracker.md` (row in follow-up log)
  - `product-os/06-status/daily-log.md` (brief execution note when material)

## Template A - D+3 gentle follow-up

Subject: Re: Tracebud P0-02 Legal Opinion Request (Signed Memo Required)

Hello `<COUNSEL_NAME>`,

Following up on the P0-02 legal memo request sent on `<SENT_UTC>`.
Current expected response date is `<EXPECTED_DATE>`.

Please confirm:

1. You received the source pack.
2. The expected response date remains feasible.
3. Any clarification needed on the three required legal positions.

Thank you,  
`<YOUR_NAME>`

## Template B - D+6 schedule confirmation follow-up

Subject: Re: Tracebud P0-02 Legal Opinion Request - schedule confirmation

Hello `<COUNSEL_NAME>`,

Quick schedule check for the P0-02 signed memo request.
We are tracking `<EXPECTED_DATE>` as the response target and need to keep release gating evidence current.

If the date changes, please share the revised date and any interim constraints so we can update the execution tracker accurately.

Thank you,  
`<YOUR_NAME>`

## Template C - escalation follow-up (owner loop-in)

Subject: Re: Tracebud P0-02 Legal Opinion Request - escalation for response date

Hello `<COUNSEL_NAME>`,

Escalating this request due to the P0-02 release gate dependency.
We still require the signed memo with explicit positions, residual risks, and section-level wording deltas.

Current tracker expectation is `<EXPECTED_DATE>`. If this cannot be met, please provide:

- revised delivery date
- blocking dependencies
- whether a partial signed position memo can be issued first

Cc: `<ESCALATION_OWNER>`

Thank you,  
`<YOUR_NAME>`

## Follow-Up Log Action Labels (for tracker consistency)

- `follow_up_d3_sent`
- `follow_up_d6_sent`
- `escalation_follow_up_sent`
- `response_date_revised`
- `memo_received`
