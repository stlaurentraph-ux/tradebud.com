### 2026-06-26 (Lane 2 fix — backend public campaign decision guard, audit H2)
- **Context**: Public email CTA decision-intent could mutate inactive campaigns (EXPIRED/COMPLETED/DRAFT) because `recordDecisionIntentPublic` lacked the `status IN ('RUNNING','PARTIAL')` guard already present on the authenticated path.
- **Fix**: After token verification, require an active campaign row; UPDATE also scoped to `RUNNING`/`PARTIAL`. Inactive → `400 Decision intent can only be recorded for active campaigns.`
- **Tests**: `requests.service.spec.ts` — active-campaign mocks updated; new rejection case for inactive campaign.
- **Note**: Audit H1 (public campaign preview / `senderTenantId` leak) — no preview endpoint exists on `main` today; field-auth references `/invite?token=` which is not implemented in `RequestsPublicController` yet.
- **Verify**: backend unit tests 423/423.
- **Status**: merged via PR #311.

### 2026-06-26 (Lane 2 fix — offline auth telemetry sanitization, audit H14)
- **Context**: Raw auth/OAuth/sync error text (emails, tokens) could reach Sentry via analytics breadcrumbs and auth failure events.
- **Fixes**:
  - `sanitizeAnalyticsProperties` (alias of `sanitizeLogContext`) applied in `trackEvent`, `reportSyncFailure`, and Sentry client breadcrumbs/signals/error context.
  - `normalizeAuthAnalyticsReason` — stable reason codes for auth failures; raw provider messages → `auth_error_unknown`.
  - `callback.tsx` + `SignInSheetContext` — no raw exception text in analytics payloads.
- **Guards**: `security-preflight.mjs` asserts analytics sanitization wiring.
- **Verify**: typecheck 0, lint 0, targeted vitest 18/18, security preflight OK.
- **Status**: branch `fix/offline-auth-telemetry-sanitize`.

### 2026-06-26 (Lane 2 fix — Sentry EU plugin URL for offline builds, audit H26)
- **Context**: `@sentry/react-native/expo` plugin pointed at `https://sentry.io/` but Tracebud's org is on **de.sentry.io** — source map uploads could fail or land on the wrong region.
- **Fix**: `app.config.js` defaults `SENTRY_PLUGIN.url` to `https://de.sentry.io/` (override via `SENTRY_HOST` for non-EU dev).
- **Guards**: `device-qa-preflight.mjs` asserts EU host and rejects hardcoded US URL.
- **Status**: branch `fix/offline-sentry-eu-h26`.
