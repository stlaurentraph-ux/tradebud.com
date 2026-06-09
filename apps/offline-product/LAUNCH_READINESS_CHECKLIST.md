# Offline Product Launch Readiness Checklist

This checklist is the minimum bar before publishing the Tracebud farmer field app globally.

## 1) Distribution & Store Ops

- [ ] Production preflight passes: `npm run release:preflight:production`
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
- [ ] Farmer sign-in flow is explicit and role-scoped.
- [ ] Tenant isolation is verified end-to-end for mobile API calls.

## 3) Security Hardening

- [ ] Credentials/tokens are stored with secure platform storage.
- [ ] Sensitive local data at rest is encrypted where required.
- [ ] TLS/certificate hardening is enabled for production API calls.
- [ ] PII is never written to debug logs.
- [ ] Data deletion and account removal flows are validated.

## 4) Offline Sync Reliability

- [ ] Retry with exponential backoff implemented for failed sync actions.
- [ ] Queue limits and retention policy are enforced.
- [ ] Conflict handling is deterministic and idempotent.
- [ ] Offline-to-online recovery tested with flaky network scenarios.
- [ ] Sync status is visible and understandable to farmers.

## 5) Compliance Gates (Tracebud Core)

- [ ] Permissions are explicit and role-scoped in mobile flows.
- [ ] Canonical state transitions are enforced (no bypasses).
- [ ] Exception handling and recovery paths are tested.
- [ ] Analytics events exist for key transitions and failures.
- [ ] Acceptance criteria are documented and signed off.
- [ ] Spatial correctness checks verified (`GEOGRAPHY`, `ST_MakeValid`, area variance guard).
- [ ] Lineage traversal remains O(1) at runtime via materialized fields.
- [ ] Offline conflict integrity verified with HLC ordering.
- [ ] TRACES payload chunking/reconciliation paths tested.
- [ ] GDPR erasure behavior validated (cryptographic shredding + audit retention).

## 6) Quality & Verification

- [ ] CI passes lint, type-check, unit/integration tests.
- [ ] Rollout SLO gate passes: `npm run release:slo:gate -- --report=release-health-report.json`
- [ ] Device E2E tests cover:
  - [ ] farmer onboarding
  - [ ] plot capture
  - [ ] evidence capture
  - [ ] harvest submission
  - [ ] offline sync recovery
- [ ] Crash-free session target defined and monitored.
- [ ] Staging sign-off completed by product + QA + engineering.

## 7) Worldwide Rollout Readiness

- [ ] Language pack scope confirmed for launch countries.
- [ ] In-app help and support escalation path is available.
- [ ] Incident runbook exists for API/auth/sync failures.
- [ ] Country rollout plan uses phased release tracks.

## Suggested release sequence

1. Internal build (`preview`) to staff/testers.
2. Closed beta in 1-2 pilot countries.
3. Staged production rollout (5%, 20%, 50%, 100%).
4. Expand countries after stability and support KPIs are met.
