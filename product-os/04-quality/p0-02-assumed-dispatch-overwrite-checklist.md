# P0-02 Assumed Dispatch Overwrite Checklist

## Purpose

Replace provisional `assumed:*` dispatch metadata with confirmed values across all P0-02 tracking artifacts.

## Required Confirmed Inputs

- Recipient (name/email)
- Sent timestamp (UTC)
- Expected response date
- Thread ID or channel
- Escalation owner

## Overwrite Targets

1. `product-os/04-quality/p0-02-counsel-response-tracker.md`
   - `Request status`: `sent_assumed` -> `sent`
   - Replace all `assumed:*` fields
   - Add/adjust follow-up row dates
2. `product-os/06-status/current-focus.md`
   - Replace assumed-dispatch note with confirmed dispatch note
3. `product-os/06-status/daily-log.md`
   - Add dispatch-confirmed entry with exact metadata
4. `product-os/06-status/done-log.md`
   - Add overwrite-complete trace entry

## Validation

- [ ] No `assumed:*` token remains in P0-02 artifacts.
- [ ] Tracker status is `sent`.
- [ ] Confirmed thread/channel reference is recorded.
- [ ] Next follow-up date is concrete and owner-assigned.

## Completion Stamp

- Overwrite completed at:
- Completed by:
- Source confirmation reference:

