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

### 2026-06-26 (Lane 2 fix — dashboard CI: en-copy parity + lint debt on `main`)
- **Context**: `main`'s dashboard checks were latently red (path-filtered CI had hidden them). An `eslint-config-next` bump surfaced 112 lint problems and the new `en-copy-parity` test failed; vitest was also collecting Playwright e2e specs. Fixing all of it for real, no config weakening.
- **Tests / collection**:
  - `locales/en.json` — added 50 missing copy keys from the workflow-copy manifest fallbacks and aligned 11 mismatched values to canonical strings (`en-copy-parity.test.ts` green).
  - `vitest.config.ts` — excluded `e2e/**` so Playwright's `test()` is not invoked under the vitest runner (golden-paths run in their own CI step).
- **Lint (0 problems, config unchanged except restoring a convention)**:
  - `no-require-imports` (16) — `lib/i18n/index.ts` now uses ESM `import` for locale JSON instead of `require()`.
  - `no-empty-object-type` (1) — `app/harvests/page.tsx` `interface Harvest extends … {}` → `type Harvest = …`.
  - `no-img-element` (2) — justified disables for the test `next/image` mock and the dynamic XYZ tile grid in `plot-satellite-map.tsx`.
  - `no-unused-vars` (44) — restored `^_` arg/var/caught ignore pattern in `packages/eslint-config/nextjs.mjs` (repo-wide convention) and deleted ~25 genuinely dead imports/vars.
  - `exhaustive-deps` (9) + `preserve-manual-memoization` (3) — added missing deps / `useMemo` / `useCallback` wrappers and hoisted nested object props to locals.
  - `set-state-in-effect` (36) — `demo-data-context.tsx` refactored to `useSyncExternalStore`; remaining 35 effect-driven async-load / hydration resets carry a justified `eslint-disable-next-line` (React Compiler adoption tracked separately).
- **Verify**: `npx eslint .` → 0 problems; `npx tsc --noEmit` → 0 errors; `npx vitest run` → 584/584.
- **Status**: branch `fix/dashboard-ci-en-parity-and-react-hooks`.
