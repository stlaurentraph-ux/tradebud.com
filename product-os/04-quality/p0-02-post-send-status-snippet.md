# P0-02 Post-Send Status Snippet

Use this immediately after sending the counsel request.

## `current-focus.md` snippet

- P0-02 counsel request sent on `<UTC_TIMESTAMP>` to `<RECIPIENT>`; expected response date `<EXPECTED_DATE>`; tracker updated at `product-os/04-quality/p0-02-counsel-response-tracker.md`.

## `daily-log.md` snippet

### `<YYYY-MM-DD>` (execution: P0-02 counsel dispatch sent)
- Focus: dispatch P0-02 legal memo request to counsel and start SLA tracking.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: outbound request sent with commissioning brief + source pack; expected response date set to `<EXPECTED_DATE>`; follow-up cadence remains every 3 business days.
- Risks: legal gate remains external until signed memo arrives.
- Blockers: Signed counsel memo pending.
- Next step: execute follow-up cadence, then run intake/scaffold/closeout artifacts on memo receipt.

