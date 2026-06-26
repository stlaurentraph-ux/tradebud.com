# Production-Readiness Audit — 2026-06-26

Owner: Engineering
Scope: `apps/offline-product` (React Native/Expo) + `tracebud-backend` (NestJS) + monorepo CI/CD, config, observability.
Method: five read-only audit passes; six headline blockers verified against source. This doc is the tracked remediation checklist.

## Ship stance

**NOT production-ready.** Confirmed cross-tenant data-exposure paths (backend), an offline photo-sync data-loss path, and CI gates that allow regressions to merge green. Close BLOCKERS (B1–B7) before exposing real users; HIGH items before GA.

Severity legend: **BLOCKER** = must fix before any real-user exposure · **HIGH** = before GA · **MEDIUM/LOW** = hardening.

---

## Blockers

| ID | Area | Platform | Issue | Fix | Regression check | Status |
|----|------|----------|-------|-----|------------------|--------|
| B1 | Backend | all tenants | DDS package endpoints (`submit`/`generate`/`traces-json`/`filing-preflight`/`risk-score`) checked role+feature only; passed `id` to service mutating `WHERE id=$1` → cross-tenant filing/export | **DONE** — added `assertPackageTenantScope(id, req)` (via `canReadPackageForTenant`, which covers origin + shared-recipient tenants) to all five endpoints | `harvest.controller.spec.ts` cross-tenant denial cases (scope→false ⇒ `403`, service not called) | [x] |
| B2 | Backend | all tenants | `admin` short-circuit in `enforcePackageReadAccess` → any tenant admin read all packages | **DONE** — removed admin short-circuit; admin now tenant-scoped via `canReadPackageForTenant` | `harvest.controller.spec.ts`: admin in `tenant_2` + scope false → `403` | [x] |
| B3 | Backend | all tenants | Billing finalize trusted `body.tenantId` (`billing.controller.ts:191`) → admin finalize invoices for any tenant | **DONE** — bind to JWT tenant; reject mismatched `body.tenantId` (platform-wide via scheduler-gated `finalize-period`) | `billing.controller.spec.ts`: admin `tenant_1` + `body.tenantId:tenant_2` → `403`; matching/omitted → caller tenant | [x] |
| B4 | Offline sync | iOS/Android | Ground-truth photo sync throws only when `uploadedCount===0`, ignores `failedUploadCount>0` (`syncGroundTruthPhotosWithFiles.ts`); queue row deleted (`processPendingSyncQueue.ts:439`) → photos permanently unsynced. Also no `stableKey`/`storagePath` → duplicate storage blobs on retry | Mirror `assertLandTitlePhotosUploadedForAi` (throw on `failedUploadCount>0`); pass `stableKey: photo.id` + reuse `storagePath`; call `updatePlotGroundPhotoAfterUpload` | Unit: 2 GT photos, 1 storage failure → throw + queue retained; retry does not re-upload the succeeded photo | [x] |
| B5 | Offline | iOS/Android | My Plots reads `getSetting('offlineTilesPackId')` (`explore.tsx:177`) vs `offlineTilesActivePackId` everywhere else → blank/wrong offline basemaps on primary plot list | Change key (and `useState` name) to `offlineTilesActivePackId`; add settings-key parity guard | Integration: offline enabled + active pack → My Plots thumbnails get non-null pack id | [x] |
| B6 | Offline | Android-only | Harvests tab has no `BackHandler` wiring (only an unused `onRegisterBackHandler` ref); `harvestBackTarget.ts` tested but not integrated → Android back exits tab/app mid-wizard | `useFocusEffect` registering `BackHandler` → route via `resolveHarvestBackTarget` to `multiPlotBackRef`/close sub-flows | Maestro Android: in multi-plot wizard, back stays on sub-step; CI grep guard for `BackHandler` in `harvests.tsx` | [x] |
| B7 | Infra/CI | CI | Dashboard `lint typecheck test` is `continue-on-error: true` (`ci.yml:863`); only marketing+field-auth are required checks; path-filter skips report success | Remove `continue-on-error`; add Backend/Dashboard/Expo required checks; skipped path-filter jobs must not satisfy protection | PR with deliberate dashboard type error must fail the job | [x] |

---

## High (before GA)

| ID | Area | Platform | Issue | Fix | Status |
|----|------|----------|-------|-----|--------|
| H1 | Backend | backend | Public campaign `preview` needs no token; leaks `senderTenantId` + UUID enumeration (`requests.public.controller.ts:33`) | Require signed invite token; drop tenant id; generic 404 | [x] preview route removed |
| H2 | Backend | backend | Public decision-intent mutates inactive campaigns (`requests.service.ts:2089`) | Add `status IN ('RUNNING','PARTIAL')` guard | [x] |
| H3 | Backend | backend | In-memory per-process rate limiting (`rate-limit.middleware.ts:11`) → N× budget across replicas | Redis/Upstash sliding window; stricter `/v1/public/*` | [x] PR #331 |
| H4 | Backend | backend | DB TLS `rejectUnauthorized:false` (`pg-pool-config.ts:53`) | Pin CA, verify in prod | [x] PR (H4) |
| H5 | Backend | backend | No global `ValidationPipe`; untyped `@Body()` on public routes | `ValidationPipe({whitelist,forbidNonWhitelisted,transform})` + DTOs | [x] PR (H5) |
| H6 | Backend | backend | Decision-token HMAC falls back to `RESEND_API_KEY` (`requests.service.ts:247`) | Dedicated `RESEND_DECISION_SECRET`, fail closed | [x] |
| H7 | Backend | backend | Stripe webhook lacks `event.id` dedupe ledger (`billing.service.ts:649`) | Persist processed event ids w/ unique constraint | [x] PR (H7) |
| H8 | Backend | backend | `/v1/audit*` exempt from rate limiting (`rate-limit.middleware.ts:41`) | Remove exemption / separate low cap | [x] PR #322 |
| H9 | Offline sync | iOS/Android | Harvest queue row deleted even when receipt update fails (`processPendingSyncQueue.ts:284-288,439`) | Delete row only after receipt update succeeds | [x] |
| H10 | Offline sync | iOS/Android | `resolveFieldSyncMode` returns `push_only` whenever queue>0, skipping inbound restore (`resolveFieldSyncMode.ts:38`) | Return `full` when `cloudDeltaHasInboundChanges` | [x] N/A — module removed; inbound restore handled in sync pipeline |
| H11 | Offline sync | iOS/Android | Auto-backup passes stub farmer → declaration audits never enqueued in background (`runAutoBackup.ts:124`) | Load real farmer from disk before pipeline | [x] |
| H12 | Offline sync | iOS/Android | Pending-sync queue silently FIFO-evicts at 1000 cap (`persistence.native.ts:1074`) | Block enqueue w/ user error + `sync_queue_evicted` event | [x] emits `sync_queue_overflow_evicted` audit on eviction |
| H13 | Offline sync | iOS/Android | SQLite boot failure still sets `isAppReady=true` (`AppStateContext.tsx:173`) | Error/recovery state; don't mark ready | [x] `bootError` + `SplashGate` recovery UI |
| H14 | Offline auth | all | Raw auth/OAuth/sync errors → Sentry unsanitized (`analytics.ts:88`, `callback.tsx:105`, `reportSyncFailure.ts:12`) | `sanitizeAnalyticsProperties`; stable error codes | [x] |
| H15 | Offline auth | iOS/Android | Production OAuth uses custom scheme, not verified App Links (`eas.json:45`) | Enable associatedDomains/App Links for prod; scheme dev-only | [x] PR #330 |
| H16 | Offline auth | all | `fieldRoleHasPermission` defined but never enforced at runtime | `useFieldPermission` gating sync/harvest/evidence; wire blocked-roles | [x] PR #323 |
| H17 | Offline auth | iOS/Android/web | Legacy plaintext sync password fallback in SQLite (`syncAuthStorage.ts:54-69`) | Force migrate-or-clear on boot; remove password fallback | [x] |
| H18 | Offline auth | iOS/Android | Farmer PII unencrypted in SQLite; SQLCipher deferred | Encrypt-at-rest or formally accept + document for v1 | [ ] |
| H19 | Offline UI | all (Android worst) | Live `MapView` per plot row (`explore.tsx:300`, `PlotMapPreview.tsx:70`) → ANR/crash | Static snapshot/SVG thumbnail or `FlatList` virtualization | [ ] |
| H20 | Offline UI | all | Monolithic `AppStateContext` + non-memoized `SignInSheetContext` value → global re-renders | Split contexts / `useMemo` provider value | [ ] |
| H21 | Offline UI | all | Home readiness stats stale after plot work (`index.tsx:60-94`) | `useFocusEffect(refreshPlotReadiness)` | [ ] |
| H22 | Offline UI | Android | `androidMapsConfig` guard unused → blank maps if API key missing | Render config-missing placeholder at map mount | [x] PR #319 |
| H23 | Infra | CI | Post-deploy smokes `exit 0` when secrets unset | Fail on main-deploy when required secrets missing | [x] PR #316 |
| H24 | Infra | iOS/Android | `eas.json` prod omits anon key/Sentry DSN/Google IDs; `release:preflight` not in CI | Add preflight/secret-assertion to CI | [x] PR `fix/offline-release-preflight-h24` |
| H25 | Infra | iOS/Android/CI | Maestro golden path on `push:main` only; no Android E2E | Run on PR; add Android emulator lane | [ ] |
| H26 | Infra | iOS/Android | Sentry mobile plugin points at `sentry.io` but org is EU `de.sentry.io` (`app.config.js:17`) | Set plugin `url: https://de.sentry.io/` | [x] |

---

## Medium / Low (hardening)

Backend: service-role queries with no tenant predicate (add repo-layer guard); QR/delivery preview metadata exposure; SMS/WhatsApp sends lack idempotency keys; cron tokens use `!==` not `timingSafeEqual`; unauthenticated signup (no CAPTCHA); `/health` leaks project ref/model/config; Swagger + inbox `bootstrap` demo-seed live in prod; `root_plot_ids` lineage declared but not materialized; default role `farmer` when claim missing; JWT `sub` decoded unverified for rate-limit bucketing.

Offline: stale-JWT reuse when refresh fails but probe passes; sign-out credential wipe is fire-and-forget (no `await`); SecureStore without `requireAuthentication`; non-atomic `persistPlotServerLinks`; HLC uses client wall clock; `enqueuePendingSync` dedup is check-then-act without a lock; receipt query widens to all-device receipts (shared-phone leak); `initialRegion`-only maps go stale after edits; GPS permission requested on mount; sparse a11y labels + toasts not announced; no `maxFontSizeMultiplier`; Android compass-heading gate can hard-block photo capture; stale sync-lock recovery drops waiters; background sync uses stale in-memory `plots`; consent queue lacks backoff; web persistence is in-memory only.

Infra: workspace/lockfile drift (`founder-os`, offline dual lockfile); offline excluded from lint-staged pre-commit; `qa:structural:monorepo` not in CI; Twilio/WhatsApp/EUDR env vars undocumented; field-auth has no `.env.example`; duplicate keys in `tracebud-backend/package.json`; OpenAPI presentation check soft-fails; release-health gate scheduled-only.

---

## Strengths (do not regress)

Backend: Supabase JWT verification, Stripe raw-body HMAC + timestamp tolerance, `ST_MakeValid` + 5% area-variance guard, `GEOGRAPHY` area math, `randomBytes(32)`+SHA-256 claim tokens, audit idempotency via `clientEventId`, prod CORS locked to `*.tracebud.com`, Sentry `sendDefaultPii:false`.
Offline: trusted-origin deep-link gate, `persistSession:false` + SecureStore, sign-out race latch, fencing-token sync mutex, exclusive transactions on writes, queue dedup/backoff, test-auth bypass gated to a flag.
Infra: `--max-warnings 0`, backend PostGIS integration suite, blocking tenant-isolation smoke, OTA skew guard, no committed live secrets.

---

## Remediation order

1. B1–B3 backend tenant scoping + H1/H2 public campaign lockdown.
2. B4 + H9–H13 offline data-loss & sync correctness.
3. B5/B6 offline functional blockers.
4. B7 + H23/H24 CI gate integrity.
5. H14–H18 auth/telemetry/secrets; H19–H22 perf/platform; H25/H26 E2E + Sentry EU.
