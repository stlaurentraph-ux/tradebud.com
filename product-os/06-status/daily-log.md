### 2026-06-26 (Lane 2 fix — backend public campaign decision guard, audit H2)
- **Context**: Public email CTA decision-intent could mutate inactive campaigns (EXPIRED/COMPLETED/DRAFT) because `recordDecisionIntentPublic` lacked the `status IN ('RUNNING','PARTIAL')` guard already present on the authenticated path.
- **Fix**: After token verification, require an active campaign row; UPDATE also scoped to `RUNNING`/`PARTIAL`. Inactive → `400 Decision intent can only be recorded for active campaigns.`
- **Tests**: `requests.service.spec.ts` — active-campaign mocks updated; new rejection case for inactive campaign.
- **Note**: Audit H1 (public campaign preview / `senderTenantId` leak) — no preview endpoint exists on `main` today; field-auth references `/invite?token=` which is not implemented in `RequestsPublicController` yet.
- **Verify**: backend unit tests 423/423.
- **Status**: merged via PR #311.

### 2026-06-26 (Lane 2 fix — dedicated decision-link HMAC secret, audit H6)
- **Context**: Email CTA decision tokens fell back to `RESEND_API_KEY` when `RESEND_DECISION_SECRET` was unset — coupling link signing to the transactional email API key.
- **Fix**: `getDecisionSecret()` now requires `RESEND_DECISION_SECRET` only; fail closed with a clear error. Updated `.env.production.example` comment.
- **Tests**: Replaced API-key fallback acceptance test with rejection when dedicated secret is unset.
- **Verify**: backend unit tests 423/423.
- **Status**: merged via PR #314.

### 2026-06-26 (Lane 2 fix — offline sync data-loss + boot-safety, audit B4/H9/H11–H13)
- **Context**: Offline tier of the 2026-06-26 production-readiness audit. Fixes the data-loss / silent-failure findings that exist on `main` (H10 / push-only mode lives only on the unmerged #264 branch and is deferred to PR #307).
- **Fixes**:
  - **B4** — `syncGroundTruthPhotosWithFiles` now passes `stableKey: photo.id` (deterministic storage path → retries upsert the same object instead of creating duplicate blobs) and throws on partial upload failure so the pending-sync queue row is retained and the remaining photos retry instead of being dropped.
  - **H9** — `processPendingSyncQueue` no longer swallows the local delivery-receipt update after a harvest POST. A failed receipt write now throws so the queue row is retained and retried (the harvest POST is idempotent via `clientEventId`); previously the server had the harvest while the local receipt stayed `pendingSync` forever.
  - **H11** — `runAutoBackup` loads the authoritative persisted farmer (new `loadFarmerProfile()`) instead of a `selfDeclared:false` stub, so background auto-backup can backfill producer declaration audits (`hasProducerAttestationsComplete` could never be satisfied by the stub).
  - **H12** — pending-sync cap eviction (`enqueuePendingSync`) now records a `sync_queue_overflow_evicted` audit event (count + cap + action types) instead of silently dropping the oldest unsynced field work.
  - **H13** — SQLite boot failure (`AppStateContext`) now sets a `bootError` flag and reports to Sentry instead of only a dev `console.warn`; `SplashGate` renders a Retry recovery screen rather than a misleading empty Home that could overwrite real data. (Recovery copy is hardcoded English — localization is a follow-up; no new i18n keys to avoid 16-locale parity churn.)
- **Tests**: `syncGroundTruthPhotosWithFiles.test.ts` (idempotent key + partial-failure throw), `runAutoBackup.test.ts` (persisted farmer threaded through), `persistence.sqlite.test.ts` (H12 eviction + `loadFarmerProfile` round-trip). Extended `expoSqliteMemoryMock` to model `pending_sync` + `audit_log`. H13 has no automated test — `main` has no RN component render harness (no `.test.tsx`).
- **Verify**: `npm run typecheck` (0), `npm run lint` (0 warnings), `npx vitest run` → 488/488, `npm run qa:structural` OK (feature-doc-guard WARN is non-blocking).
- **Status**: branch `fix/offline-sync-correctness`.
