# Offline Product Launch Readiness Checklist

This checklist is the minimum bar before publishing the Tracebud farmer field app globally.

## 1) Distribution & Store Ops

- [x] Store asset preflight passes: `npm run store:preflight` (`--strict` when Play assets ready)
- [ ] Store ops checklist reviewed: `STORE_OPS_CHECKLIST.md`
- [ ] Production preflight passes: `npm run release:preflight:production` (add `:online` before first store submit to verify OAuth)
- [ ] `eas.json` is configured for `development`, `preview`, and `production`.
- [ ] iOS App Store Connect app exists with final metadata, privacy labels, screenshots, and support URL.
- [ ] Google Play app exists with Data Safety form, content rating, and rollout track.
- [ ] Signing credentials are configured in Expo/EAS for both platforms.
- [ ] App identifiers are finalized:
  - [ ] iOS bundle identifier
  - [ ] Android package name
- [ ] Internal builds are tested on low-end Android and at least one iPhone.

## 2) Production Environment & Auth

- [ ] `EXPO_PUBLIC_API_URL` points to production API (never localhost).
- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are production values.
- [ ] Test credential defaults are disabled for production.
- [x] Farmer sign-in flow is explicit and role-scoped (email + OAuth via `syncAuthSession`; unified API token).
- [ ] Tenant isolation is verified end-to-end for mobile API calls.

## 3) Security Hardening

- [x] Credentials/tokens are stored with secure platform storage (`syncAuthStorage` + SecureStore; `security:preflight`).
- [ ] Sensitive local data at rest is encrypted where required (SQLite OS sandbox; full SQLCipher out of MVP scope).
- [ ] TLS/certificate hardening is enabled for production API calls (HTTPS enforced in `release-preflight`; no cert pinning in v1).
- [x] PII is never written to debug logs (`sanitizeLogContext` in `logError`; `security:preflight`).
- [x] Non-validation errors reported to Sentry when `EXPO_PUBLIC_SENTRY_DSN` is set (`logError` bridge).
- [x] GDPR erasure request path exists (Data sharing → `requestGdprErasure`; backend `/v1/me/gdpr-erasure-request`).

## 4) Offline Sync Reliability

- [x] Failed harvest submissions queue locally for retry (`submitHarvestRecord` + pending sync).
- [x] Plot uploads use stable `clientPlotId` (local plot UUID) for server matching.
- [x] Retry with exponential backoff implemented for failed sync actions (`processPendingSyncQueue` + Settings queue UI).
- [x] Queue limits and retention policy are enforced (`MAX_PENDING_SYNC_ACTIONS` = 1000).
- [x] Conflict handling is deterministic and idempotent (`clientEventId` on harvest/photo sync; HLC queue ordering).
- [ ] Offline-to-online recovery tested with flaky network scenarios (see `DEVICE_SMOKE_CHECKLIST.md`).
- [x] Sync status is visible and understandable to farmers (Settings backup card + queue diagnostics).

## 5) Compliance Gates (Tracebud Core)

- [x] Location permission denial shows farmer-friendly copy with Settings shortcut (`perm_location_*`, walk + declaration flows).
- [x] Push permission deny path tracked (`push_permission_denied`) with optional farmer alert helper (`perm_push_*`); Settings → Backup & sync → Enable notifications.
- [ ] Permissions are explicit and role-scoped in mobile flows.
- [ ] Canonical state transitions are enforced (no bypasses).
- [ ] Exception handling and recovery paths are tested.
- [x] Analytics events exist for key transitions and failures (harvest submit, sync queue drain).
- [ ] Acceptance criteria are documented and signed off.
- [ ] Spatial correctness checks verified (`GEOGRAPHY`, `ST_MakeValid`, area variance guard).
- [ ] Lineage traversal remains O(1) at runtime via materialized fields.
- [ ] Offline conflict integrity verified with HLC ordering (unit tests in `hlc.test.ts`; device soak pending).
- [ ] TRACES payload chunking/reconciliation paths tested.
- [ ] GDPR erasure behavior validated (cryptographic shredding + audit retention).

## 6) Quality & Verification

- [x] CI passes lint and unit tests (`npm run lint`, `npm run test` in `.github/workflows/ci.yml` `app` job).
- [x] Automated device QA wiring preflight: `npm run qa:preflight` (harvest queue, client id, Sentry, mutex).
- [x] Full type-check gate in CI (`npm run typecheck` in `app` job and `qa:full`).
- [ ] Rollout SLO gate passes: `npm run release:slo:gate -- --report=release-health-report.json`
- [ ] Device E2E manual soak documented (`npm run qa:device` → `DEVICE_SMOKE_CHECKLIST.md` — OAuth, permissions, tenant, flaky network)
- [ ] Device E2E executed and sign-off row completed in checklist:
  - [ ] farmer onboarding
  - [ ] plot capture
  - [ ] evidence capture
  - [ ] harvest submission (including offline queue → sync now)
  - [ ] offline sync recovery
- [ ] Crash-free session target defined and monitored.
- [ ] Staging sign-off completed by product + QA + engineering.

## 7) Worldwide Rollout Readiness

- [ ] Language pack scope confirmed for launch countries.
- [x] In-app help and support escalation path is available (Settings → Need help + `help_farmer_body`).
- [x] Incident runbook exists for API/auth/sync failures (`INCIDENT_RUNBOOK.md`).
- [ ] Country rollout plan uses phased release tracks.

- [x] Safe release scripts run full QA before EAS (`release:production:safe` / `release:preview:safe` → `qa:full` + preflight).

## Suggested release sequence

1. Internal build (`preview`) to staff/testers.
2. Closed beta in 1-2 pilot countries.
3. Staged production rollout (5%, 20%, 50%, 100%).
4. Expand countries after stability and support KPIs are met.
