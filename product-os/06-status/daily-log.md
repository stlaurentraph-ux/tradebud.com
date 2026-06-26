### 2026-06-26 (Lane 2 fix — backend public campaign decision guard, audit H2)
- **Context**: Public email CTA decision-intent could mutate inactive campaigns (EXPIRED/COMPLETED/DRAFT) because `recordDecisionIntentPublic` lacked the `status IN ('RUNNING','PARTIAL')` guard already present on the authenticated path.
- **Fix**: After token verification, require an active campaign row; UPDATE also scoped to `RUNNING`/`PARTIAL`. Inactive → `400 Decision intent can only be recorded for active campaigns.`
- **Tests**: `requests.service.spec.ts` — active-campaign mocks updated; new rejection case for inactive campaign.
- **Note**: Audit H1 (public campaign preview / `senderTenantId` leak) — no preview endpoint exists on `main` today; field-auth references `/invite?token=` which is not implemented in `RequestsPublicController` yet.
- **Verify**: backend unit tests 423/423.
- **Status**: merged via PR #311.

### 2026-06-26 (Lane 2 fix — offline My Plots tiles + Android harvest back + home readiness, audit B5/B6/H21)
- **Context**: Next offline tier from the 2026-06-26 production-readiness audit (functional blockers + one HIGH UI item).
- **Fixes**:
  - **B5** — `explore.tsx` (My Plots) now reads `getSetting('offlineTilesActivePackId')` instead of the stale `offlineTilesPackId` key used everywhere else → plot list thumbnails resolve the correct offline basemap when offline tiles are enabled.
  - **B6** — `harvests.tsx` wires Android `BackHandler` through `resolveHarvestBackTarget` (same logic as header back) so hardware back steps through multi-plot wizard / record-weight / plot-selector sub-flows instead of exiting the tab.
  - **H21** — Home tab `useFocusEffect` now calls `refreshPlotReadiness()` on focus so compliant/pending stats and the action-required card update after plot work.
- **Guards**: `device-qa-preflight.mjs` asserts explore active-pack key + harvest BackHandler wiring.
- **Verify**: typecheck 0, lint 0, `harvestBackTarget.test.ts` 4/4, device-qa-preflight OK.
- **Status**: branch `fix/offline-b5-b6`.

### 2026-06-26 (Lane 1 guardrails — CI dashboard gate + path-filter gate, audit B7)
- **Context**: Dashboard `lint typecheck test` ran with `continue-on-error: true`, so regressions merged green. Path-filtered jobs that skip entirely can satisfy branch protection without running checks.
- **Fixes**:
  - Removed `continue-on-error` from dashboard-product lint/typecheck/test step (verified green locally: 584 tests).
  - Added `ci-path-filter-gate` PR job: when paths-filter marks an app as changed, the matching CI job must `success` (not `skipped`/`failure`).
- **Note**: Enabling the new gate as a required GitHub check is human gate **0.H** — this PR only adds the job.
- **Status**: branch `chore/automation-ci-dashboard-gate`.
