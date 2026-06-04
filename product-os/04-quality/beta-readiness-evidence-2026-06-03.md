# Beta Readiness Evidence — 2026-06-03

## Infrastructure (Supabase)

| Check | Result | Evidence |
|-------|--------|----------|
| RLS phase-3 apply | **PASS** | Migration `tb_v16_030_rls_phase3_launch_admin_and_integrations` on project `uzsktajlnofosxeqwdwl` |
| RLS phase-3 verify | **PASS** | `phase3_table_rls_status=pass`, `tables_hardened_count=14/14` |
| PostGIS relocate (`tb_v16_031`) | See daily log | Owner-run if not yet executed in SQL Editor |

## Test baselines

| Suite | Result | Command / notes |
|-------|--------|-----------------|
| Dashboard product | **PASS** 225/225 | `cd apps/dashboard-product && npm run -s test` (2026-06-03) |
| Backend unit (non-int) | **PASS** 237/237 | `cd tracebud-backend && npm run -s test` (2026-06-03) |
| Backend ownership integration | **PASS** 54/54 | `cd tracebud-backend && npm run test:integration:ownership` after Test project `atisrfxsjjvjekwqcbjk` reached `ACTIVE_HEALTHY` |

### Fixes applied this session

- `src/testing/launch-service.mock.ts`, `src/testing/supabase-user.mock.ts` + controller/integration specs updated for `LaunchService` injection and canonical `app_metadata.role` claims (email alone no longer implies role).

## Beta ops artifacts

- Scope: `beta-scope-matrix.md`
- Cohort template: `beta-cohort-template.md`
- Cross-tenant runbook: `beta-cross-tenant-deny-runbook.md`

## Decision

| Field | Value |
|-------|-------|
| Window | 2026-06-03 |
| Environment | Staging / pre-cohort |
| RLS | pass |
| Dashboard tests | pass |
| Backend ownership integration | pass (54/54) |
| Cohort enabled | none yet |
| Decision | **hold_beta** until staging cross-tenant deny runbook + cohort A approval |

## Next actions (operator)

1. Set `TEST_DATABASE_URL` in repo root `.env.local` to current Supabase pooler (session mode).
2. Re-run `npm run test:integration:ownership` in `tracebud-backend`.
3. Execute `beta-cross-tenant-deny-runbook.md` in staging; attach HAR/screenshots.
4. Fill `beta-cohort-template.md` for dogfood tenant; run Day 3 smoke.
5. Track P0-02 / P0-03 in parallel (official launch, not beta-blocking if waived).
