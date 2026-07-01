# FEAT: Field farmer Activity feed (v1 slice)

## Status

**In progress** — `feature/offline-farmer-activity-v1`

## Goal

Dedicated **Updates / Activity** screen: durable timeline of compliance and account events. Push = ping; Activity = history.

## Design principles

| Principle | v1 behavior |
|-----------|-------------|
| Push vs history | Push unchanged; in-app list is the record farmers can revisit |
| Farmer-readable copy | Plain language i18n keys — no `MANUAL_REQUIRED` in UI |
| Action vs info | `action` rows get accent badge; `info` rows (e.g. screening passed) are informational |
| Offline-friendly | Last feed cached in SQLite settings; show “Last updated …” when stale/offline |
| Plot detail stays canonical | Activity links to plot/screen; does not duplicate full plot status cards |

## v1 slice scope

| Source | Included |
|--------|----------|
| Deforestation screening | Passed, pending (incl. sync-to-run), under review, at risk, alert |
| Land / tenure documents | Needs clearer photo, reviewing, upload needed, verified |
| Plot setup | Missing ground-truth photos |
| Boundary | Local geometry block (overlap / fix boundary) |
| Consent | Pending data-access requests |
| Sync / backup | Optional global row when queue or unsynced plots pending |

## Out of scope (v1)

- Backend `GET /v1/me/field-activity` (client derives from plot + consent + readiness)
- Read/unread persistence per row (action count = open action rows)
- Password security email (see `FEAT-field-farmer-notifications-v2.md` V2.1)

## Permissions

- Signed-in farmer only; feed empty with sign-in prompt when logged out
- Consent rows only for grants returned by `GET /v1/me/consent-grants`

## State transitions

- Feed rebuilt on Activity screen focus, after sync, and from cached snapshot on Home badge
- Cache key `farmerActivityFeedV1` in device settings store

## Exception handling

- Network/consent fetch failure: show cached feed + offline banner
- Empty feed: friendly empty state (not an error)

## Analytics

- `activity_feed_viewed` — screen open
- `activity_row_opened` — tap row (`category`, `severity`)

## Acceptance criteria

- [ ] Home tile opens Activity when signed in
- [ ] Action rows navigate to plot, Documents, Data sharing, or Backup as appropriate
- [ ] Offline: last cached feed visible with last-updated timestamp
- [ ] Deforestation passed shows plot name + date; pending unsynced plot prompts sync
- [ ] Pending consent grant appears with org name
- [ ] No internal parse_status codes in farmer-visible strings

## References

- `apps/offline-product/features/activity/*`
- `apps/offline-product/app/activity.tsx`
- P2-11 (`v1-6-spec-execution-board.md`) — future server-backed feed
