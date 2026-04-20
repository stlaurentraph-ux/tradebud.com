# Remaining Execution Scorecard (Recurring)

Last updated: 2026-04-20
Cadence: weekly review (Mon), mid-week checkpoint (Thu)
Owner: product + engineering leads

## Current completion snapshot

- Cooperative inbox / requests hardening: 100%
- CI / test infrastructure depth: 100%
- OpenAPI Section 32.8 style contract depth: 100%
- Execution board P2 spec hardening bundle: 92%
- TB-V16-003 staging migration lane (`GEOGRAPHY`): 100%
- Supabase/PostGIS owner remediation (`spatial_ref_sys`): 85%

## Remaining execution plan (ops-only closeout)

### Ready now (in-repo lanes closed)

1) CI/Test lane - complete
- Ownership lane is stable and non-skipped (`11 suites / 54 tests`).
- No additional in-repo CI depth work is required for this scorecard cycle.

2) OpenAPI lane - complete
- Lint/governance checks are green and warning-free.
- No additional in-repo contract-depth work is required for this scorecard cycle.

3) Inbox/requests lane - complete
- Backend-only fail-closed verification is already captured in latest run evidence.
- No additional in-repo inbox hardening work is required for this scorecard cycle.

4) TB-V16-003 staging migration lane - complete
- `GEOGRAPHY` migration execution and verification evidence are captured (`plot.geography` present, backfill missing `0`, GiST index present).

### Blocked now (external dependency)

1) Supabase/PostGIS owner remediation lane (`spatial_ref_sys`) - pending privileged operator
- Run `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql` with owner/superuser privileges.
- Run `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_verify.sql` and capture PASS/FAIL outputs.
- Update ticket metadata from `pending_ticket / TBD` to real support ticket ID for project `uzsktajlnofosxeqwdwl`.

## Current cycle checkpoint notes (2026-04-20)

- P2 hardening advanced to `92%`: runtime yield benchmark governance contract is now implemented in backend (`/v1/yield-benchmarks` create/update/list/activate) with source-reference validation, dual-control activation, SQL migration baseline, and OpenAPI publication.
- P2 spec hardening advanced to `88%`: Section 37 in `TRACEBUD_V1_2_EUDR_SPEC.md` now replaces provisional benchmark-seed framing with source-verified bootstrap guidance (FAOSTAT primary baseline, USDA FAS cross-check for soy, explicit source-reference derivation rule).
- In-repo CI/test closeout lane is now complete at `100%`: required ownership suite is stable and non-skipped at `11 suites / 54 tests` (`test:integration:ownership`).
- In-repo OpenAPI contract-depth lane is now complete at `100%`: endpoint-level examples were added/refreshed for filing-activity, filing-activity export CSV, chat-threads, workflow-activity, and dashboard-summary, and `openapi:lint` is warning-free again.
- Cooperative inbox/backend verification lane is now complete at `100%` for in-repo evidence: dashboard test suite is green (`31 files / 130 tests`), including inbox route regression coverage.
- TB-V16-003 is now complete at `100%`: staging migration executed successfully after making the script existence-safe for optional `plot_geometry_version` table presence; `plot.geography` is present, backfill missing count is `0`, and `idx_plot_geography_gist` exists on target.
- `spatial_ref_sys` remediation live execution attempt reached `85%`: owner-remediation runbook was executed against reachable target and failed with explicit privilege blocker (`must be owner of table spatial_ref_sys`), confirming privileged operator handoff is the only remaining step.
- Literal overall scorecard `100%` is now blocked only by privileged PostGIS owner remediation execution (`spatial_ref_sys` ownership).
- Supabase support escalation status: `pending_ticket` (project ref `uzsktajlnofosxeqwdwl`; blocker `42501 must be owner of table spatial_ref_sys`; ticket ID: `TBD`).
- Final one-pass operator packet is now prepared at `product-os/04-quality/remaining-lanes-final-execution-pack.md` (strict run order, go/no-go gates, rollback criteria, and evidence template for remaining external-window lanes).
- Added API-level authenticated coverage for `GET /v1/audit/gated-entry/dashboard-summary` (tenant-claim fail-closed + tenant-scoped counters/readiness behavior) and promoted it into the required ownership lane.
- Ownership lane now passes with expanded scope at `11 suites / 54 tests`, closing authenticated API-level parity across targeted audit diagnostics route groups for this cycle.
- Added API-level authenticated coverage for `GET /v1/audit/gated-entry/workflow-activity` (tenant-claim fail-closed, phase-filter pipeline, and `slaState` filtering) and promoted it into the required ownership lane.
- Ownership lane now passes with expanded scope at `10 suites / 51 tests`, materially reducing remaining authenticated diagnostics-route policy risk.
- Added API-level authenticated coverage for `GET /v1/audit/gated-entry/chat-threads` (tenant-claim fail-closed, phase-filter pipeline for `created` and `resolved`) and promoted it into the required ownership lane.
- Ownership lane now passes with expanded scope at `9 suites / 48 tests`, further reducing authenticated-route policy coverage risk.
- Added API-level authenticated coverage for `GET /v1/audit/gated-entry/filing-activity` and `GET /v1/audit/gated-entry/filing-activity/export` (tenant-claim fail-closed, phase-filter pipeline, CSV export metadata/shape) and promoted it into the required ownership lane.
- Ownership lane now passes with further expanded scope at `8 suites / 45 tests`, meeting the week-1 CI/Test closeout target threshold.
- Added API-level authenticated coverage for `GET /v1/audit/gated-entry/actors` (tenant-claim fail-closed + invalid UUID validation + tenant-scoped actor resolution) and promoted it into the required ownership lane.
- Ownership lane now passes with expanded scope at `7 suites / 42 tests`, improving end-to-end tenant-claim evidence for authenticated audit diagnostics routes.
- Ownership lane re-verified locally: `6 suites / 39 tests` passed under `test:integration:ownership` after fixing controller-scope integration regressions, improving CI/test closeout confidence for recurring non-skipped evidence.
- OpenAPI governance lane re-verified locally: lint and governance checks are green (`openapi:lint`, `openapi:governance:check`, metrics/trend generation), confirming governance gates remain stable while example-depth work continues.
- CI ownership and policy evidence is now stable at non-skipped execution across the expanded lane; next risk is coverage parity across all remaining authenticated routes.
- OpenAPI governance enforcement is now substantially hardened (policy, codeowners, markdown/reference, trend + delta artifacts); remaining work is example depth and policy-ambiguity cleanup.
- Cooperative inbox/requests hardening is near closure, but backend-only guarantees must remain fail-closed as new role-path scenarios are added.
- Staging migration and privileged PostGIS owner remediation remain the largest schedule-coupled risks and should be managed as explicit infra windows, not background work.

## Recurring review checklist

- Are CI ownership suites still non-skipped and required in all target lanes?
- Did inbox/requests backend-only paths remain fail-closed after new changes?
- Did OpenAPI warning counts drop and examples/role-scope coverage increase?
- Did staging migration parity checks produce measurable pass/fail evidence?
- Is the privileged PostGIS remediation window scheduled/executed this cycle?

## Evidence links to maintain each week

- Current focus: `product-os/06-status/current-focus.md`
- CI workflow: `.github/workflows/ci.yml`
- OpenAPI draft: `docs/openapi/tracebud-v1-draft.yaml`
- Execution board: `product-os/01-roadmap/v1-6-spec-execution-board.md`
- Migration/infra scripts: `tracebud-backend/sql/` (including owner-remediation runbook)
- Final execution packet: `product-os/04-quality/remaining-lanes-final-execution-pack.md`

## Update rule

When any percentage changes, update:
- this file (`remaining-execution-scorecard.md`)
- `product-os/06-status/current-focus.md` with one bullet linking the latest checkpoint
- `product-os/06-status/daily-log.md` with a short checkpoint note
