# Offline SQLite at-rest decision (H18)

**Status:** Accepted for Tracebud v1.6 EUDR MVP  
**Slice:** H18  
**Date:** 2026-06-26  
**Owner:** Offline field app  

## Decision

**Accept OS-sandboxed SQLite without SQLCipher for v1.6 production**, with credentials and tokens in platform secure storage only.

Full database encryption (SQLCipher or equivalent) is **deferred** to a post-v1 slice when migration UX, key escrow, and perf on low-end Android are scoped.

## Scope of local SQLite (`tracebud_offline.db`)

| Data class | Examples | Storage | v1.6 treatment |
|------------|----------|---------|----------------|
| Compliance field data | Plot names, geometry, hectares, declarations | SQLite | Accepted — required offline-first |
| Farmer profile (non-secret) | Name, role, commodity, postal address | SQLite | Accepted — display/sync identity |
| Evidence metadata | Photo URIs, timestamps, geo tags | SQLite + app sandbox files | Accepted |
| Audit / sync queue | Event payloads, pending actions | SQLite | Accepted — operational |
| **Secrets** | Passwords, OAuth refresh/access tokens | **Expo SecureStore** | **Not in SQLite** (H17) |

## Controls in place (v1.6)

1. **OS app sandbox** — iOS Data Protection / Android app-private storage; DB not world-readable.
2. **SecureStore for auth** — `syncAuthStorage.ts`; boot migration purges legacy plaintext sync password from SQLite (`migrateOrClearLegacySyncAuthOnBoot`).
3. **GDPR erasure path** — in-app request + backend orchestration; local wipe on successful erasure flows.
4. **Analytics/Sentry redaction** — H14 sanitization before telemetry export.
5. **CI guards** — `security-preflight`, `sqlite-at-rest-guard` (this decision + wiring).

## Residual risk (accepted for MVP)

- Rooted/jailbroken devices or physical extraction with unlocked device can read sandbox DB files.
- Farmer name + plot locations are compliance-relevant but not authentication secrets; risk is device loss/theft, not network exfiltration from the DB file alone.

## Triggers to implement SQLCipher (post-v1)

- Enterprise/customer contract requires field DB encryption at rest.
- Regulator or security review mandates encrypting plot/farmer rows on device.
- Evidence of targeted attacks on unlocked field handsets in deployment regions.

## Implementation notes (future)

- Prefer `expo-sqlite` + SQLCipher plugin or successor with background migration and key tied to SecureStore/Keystore.
- Migration must preserve offline queue + idempotent restore; add Maestro slice for upgrade path.

## Acceptance criteria (H18)

- [x] This decision doc published under `product-os/04-quality/`
- [x] Structural guard references doc + SecureStore wiring
- [x] Launch checklist updated
- [x] Audit row H18 marked complete
