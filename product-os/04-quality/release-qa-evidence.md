# Release QA Evidence

Use this file to record hard evidence from required CI lanes before MVP release signoff.

## Ownership / Access Policy Evidence

- CI workflow: `CI`
- Job: `backend`
- Step: `Ownership integration tests (required)`
- Required artifact: `backend-ownership-integration-log`
- Required summary markers:
  - `Test Suites:`
  - `Tests:`
  - `Ran all test suites`
- Required condition: output does **not** contain non-zero `skipped` counts.
- Required suite set:
  - `tracebud-backend/src/harvest/ownership-scope.int.spec.ts`
  - `tracebud-backend/src/harvest/controller-scope.int.spec.ts`
  - `tracebud-backend/src/reports/package-report-access.int.spec.ts`
  - `tracebud-backend/src/inbox/inbox.controller.int.spec.ts`
  - `tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`

### Latest validated run

- Run URL: https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/24445875783
- Commit SHA: 2fa86a90e2ab32399e943955c7e1ac80c0300e5b
- Timestamp (UTC): 2026-04-15T09:02:49Z
- Artifact URL: https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/24445875783/artifacts/6446796613
- Summary snapshot:
  - Test Suites: `5 passed, 5 total`
  - Tests: `13 passed of 13 total`
  - Ran all test suites: `tracebud-backend/src/harvest/ownership-scope.int.spec.ts, tracebud-backend/src/harvest/controller-scope.int.spec.ts, tracebud-backend/src/reports/package-report-access.int.spec.ts, tracebud-backend/src/inbox/inbox.controller.int.spec.ts, tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`
  - Command: `npm run test:integration:ownership`

### Latest local validation snapshot

- Environment: local (via `TEST_DATABASE_URL` auto-load helper)
- Command: `npm run test:integration:ownership`
- Timestamp (UTC): 2026-04-16T16:34:00Z
- Summary snapshot:
  - Test Suites: `5 passed, 5 total`
  - Tests: `19 passed of 19 total`
  - Ran all test suites: `tracebud-backend/src/harvest/ownership-scope.int.spec.ts, tracebud-backend/src/harvest/controller-scope.int.spec.ts, tracebud-backend/src/reports/package-report-access.int.spec.ts, tracebud-backend/src/inbox/inbox.controller.int.spec.ts, tracebud-backend/src/audit/audit.gated-entry.int.spec.ts`
- Notes:
  - Includes newly added controller-scope package submit policy assertions in `tracebud-backend/src/harvest/controller-scope.int.spec.ts`.
  - CI artifact evidence should be refreshed on next CI run to replace the prior 13-of-13 baseline with 19-of-19.

### Reviewer signoff

- Reviewer: Raphael Saint-Laurent
- Decision: PASS
- Notes: Ownership/access policy lane executed non-skipped in CI (run `24445875783`), expanded required suite summary matches expected coverage (`5 suites`, `13 tests`) including audit gated-entry integration, and artifact `backend-ownership-integration-log` (`6446796613`) is available for audit traceability. Node action runtime deprecation warnings remain non-blocking and are tracked separately.

## Telemetry Index Rollout Evidence

- Migration artifact: `tracebud-backend/sql/tb_v16_004_audit_gated_entry_index.sql`
- Apply command: `npm run db:apply:audit-index`
- Verify command: `npm run db:verify:audit-index`
- Verification query: `pg_indexes` lookup for `idx_audit_log_gated_entry_tenant_gate_ts`

### Latest validated run

- Environment: local DB target via `TEST_DATABASE_URL` auto-loaded from root `.env.local`
- Command output snapshot:
  - `Applied and verified audit gated-entry index.`
  - `Verified audit gated-entry index.`
- Timestamp (UTC): 2026-04-15T09:34:18Z

### Rollout note

- Staging/prod execution can set `AUDIT_INDEX_DATABASE_URL` (preferred) and run:
  - `AUDIT_INDEX_DATABASE_URL="<DB_URL>" npm run db:apply:audit-index`
  - `AUDIT_INDEX_DATABASE_URL="<DB_URL>" npm run db:verify:audit-index`
- Attach both command outputs plus index verification query result before release signoff.

## Supabase Advisor Exception Record

### `public.spatial_ref_sys` residual finding

- Finding type: `rls_disabled_in_public` (`ERROR`) from Supabase advisor.
- Exception decision: **Accepted (documented)** for current release window.
- Rationale:
  - `public.spatial_ref_sys` is PostGIS SRID reference metadata, not tenant/business domain data.
  - No direct product workflows rely on user-scoped writes to this table.
  - Core business tables handling tenant-sensitive data are already RLS-hardened.
- Constraint:
  - Current MCP migration role is not owner of extension-managed table objects; owner-level alteration attempt failed with `must be owner of table spatial_ref_sys`.
  - Platform-level extension behavior currently returns `extension "postgis" does not support SET SCHEMA`; extension-schema warning may remain even after table-level hardening.
- Mitigation:
  - Keep API access patterns backend-mediated for business entities.
  - Retain deny-by-default stance on phase-2 app tables until ownership keys are introduced.
  - Execute hardened owner-run runbook `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql` (RLS enable + broad DML revoke for `anon`/`authenticated` + schema-agnostic `spatial_ref_sys` handling) in next privileged infra window and replace this exception note after advisor recheck.

### Remaining operational action

- Enable Supabase Auth leaked-password protection in project settings and record timestamp/owner in this file once applied.

## OpenAPI Governance Branch-Protection Checklist

Use this checklist to verify CODEOWNERS enforcement is active on the default branch and governance-critical OpenAPI changes cannot merge without required owner review.

- Repository settings check:
  - Branch protection (or ruleset) is enabled for default branch (`main`/`master`).
  - Required pull request reviews is enabled.
  - `Require review from Code Owners` is enabled.
- Protected paths in `.github/CODEOWNERS`:
  - Policy source of truth: `docs/openapi/governance-codeowners-policy.json`
  - `docs/openapi/lint-baseline.json`
  - `.github/workflows/openapi-baseline-refresh.yml`
  - `.redocly.yaml`
  - `docs/openapi/tracebud-v1-draft.yaml`
- Verification procedure:
  - Confirm generic markdown QA utility is invocable for arbitrary docs (`npm run openapi:governance:markdown:check -- --markdown scripts/openapi-governance/README.md`).
  - Confirm CI contracts lane step `Validate OpenAPI governance README commands` passes (`npm run openapi:governance:readme:check -- --report openapi-governance-readme-report.json`).
  - Confirm CI contracts lane step `Assert OpenAPI governance README report schema` passes (`npm run openapi:governance:readme:report:assert`) before README artifact upload.
  - Confirm CI contracts lane publishes README-governance artifact `contracts-openapi-readme-governance-metrics` from `openapi-governance-readme-report.json`.
  - Confirm CI contracts lane step `Validate release QA doc references (path integrity)` passes (`npm run openapi:governance:markdown:check -- --markdown product-os/04-quality/release-qa-evidence.md --no-commands --report openapi-markdown-reference-report.json`).
  - Confirm CI contracts lane step `Assert markdown reference report schema` passes (`npm run openapi:governance:markdown:report:assert`) before markdown artifact upload.
  - Confirm markdown report schema source-of-truth exists at `docs/openapi/markdown-reference-report.schema.json` and report includes `schemaVersion: 1`.
  - Confirm markdown summary block `Markdown Reference Checks` includes `Schema version: 1` in CI run output.
  - Confirm CI contracts lane publishes markdown-reference artifact `contracts-markdown-reference-metrics` from `openapi-markdown-reference-report.json`.
  - Confirm README check uses shared markdown QA utility `scripts/openapi-governance/markdown-reference-check.mjs`.
  - Confirm README check enforces anchors from policy `docs/openapi/governance-readme-policy.json` validated by `docs/openapi/governance-readme-policy.schema.json`.
  - Confirm README check output validates both command references and referenced file paths.
  - Confirm CI contracts lane step `Validate OpenAPI governance policy` passes (`npm run openapi:governance:policy:validate`).
  - Confirm CI contracts lane step `Verify OpenAPI governance CODEOWNERS` passes (`npm run openapi:governance:check`).
  - Confirm CI contracts lane publishes governance run artifact `contracts-openapi-governance-metrics` and summary block `OpenAPI Governance Checks`.
  - Confirm `openapi-governance-metrics.json` now includes `readmeValidationStatus` and `readmeReport` alongside policy/codeowners governance statuses.
  - Confirm contracts lane uses `npm run openapi:governance:metrics:generate` to produce consolidated governance metrics and summary output.
  - Confirm CI contracts lane step `Smoke test OpenAPI governance metrics generator` passes (`npm run openapi:governance:metrics:smoke`) before artifact assertions.
  - Confirm smoke test validates strict structured metrics fields (per-lane statuses + artifact inventory) while enforcing ordered summary-line presence for README/policy/CODEOWNERS/overall status.
  - Confirm metrics generator and smoke harness share summary templates from `scripts/openapi-governance/metrics-summary-lines.mjs`.
  - Confirm CI contracts lane runs non-blocking `Presentation snapshot check (non-blocking)` (`npm run openapi:governance:metrics:presentation:check`) and surfaces formatting drift without failing the job.
  - Confirm when presentation check fails, CI summary includes `Governance Presentation Drift Warning` block with remediation guidance.
  - Confirm CI contracts lane step `Assert OpenAPI governance artifact JSON shapes` passes (`npm run openapi:governance:artifacts:assert`) and covers both inventory + shape consistency checks.
  - Confirm CI contracts lane uploads raw governance report artifact `contracts-openapi-governance-reports` containing policy/codeowners report JSON files.
  - Confirm governance summary includes direct run link for both governance artifacts.
  - Confirm `openapi-governance-metrics.json` contains `expectedArtifacts` inventory with required artifact names and file lists.
  - Confirm `openapi-governance-metrics.json` includes presentation telemetry fields (`presentationValidationStatus`, `presentationDriftWarningCount`, `presentationValidationRecordedAt`) for trend reporting.
  - Confirm local trend helper `npm run openapi:governance:metrics:trend -- --input .` reports aggregated presentation drift counts from discovered metrics artifacts.
  - Confirm contracts lane publishes `Governance Presentation Drift Trend` summary subsection and artifact `contracts-openapi-governance-presentation-trend` from `openapi:governance:metrics:trend -- --input . --json`.
  - Confirm contracts lane attempts previous-trend artifact retrieval and publishes `FAIL delta vs previous` / `Drift warning delta vs previous` lines when historical artifact is available.
  - Confirm previous-trend baseline selection is branch-aware and skips non-success source runs before publishing delta lines.
  - Confirm previous-trend baseline selection is filtered to matching workflow path (`GITHUB_WORKFLOW_REF`) with fallback to workflow name to prevent unrelated-workflow artifact drift in deltas.
  - Confirm trend-delta output includes baseline metadata fields (`runId`, `workflowPath`, `workflowName`) and summary echoes baseline run/workflow context.
  - Confirm contracts lane assertions `openapi:governance:metrics:trend:report:assert` and `openapi:governance:metrics:trend:delta:report:assert` pass, enforcing trend/delta schema contracts.
  - Confirm contracts lane smoke step `openapi:governance:metrics:trend:assertions:smoke` passes fixture-based valid/invalid assertion scenarios.
  - Confirm CI uploads both `contracts-openapi-governance-presentation-trend` and `contracts-openapi-governance-presentation-trend-delta` artifacts.
  - Confirm governance summary status is sourced from `openapi-governance-policy-report.json` and `openapi-governance-codeowners-report.json` (not log text matching).
  - Confirm check output verifies both path presence and expected owner handles for protected OpenAPI entries.
  - Open a test PR that modifies one protected file above.
  - Confirm GitHub marks CODEOWNERS reviewer (`@stlaurentraph-ux`) as required.
  - Confirm merge is blocked until required CODEOWNERS approval is present.
  - Confirm dismissal/re-request behavior follows branch policy after new commits.
- Evidence to record for release signoff:
  - Settings screenshot or ruleset export reference.
  - Test PR URL.
  - Timestamp (UTC), reviewer handle, and final mergeability state.

### Completed evidence (fill after verification run)

- Settings evidence reference:
  - `<ruleset screenshot URL or internal evidence ID>`
- Test PR details:
  - PR URL: `<https://github.com/<org>/<repo>/pull/<id>>`
  - Protected file touched: `<path>`
  - Opened at (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Required reviewer evidence:
  - CODEOWNERS reviewer requested: `<@handle>`
  - Reviewer approval timestamp (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
  - Approval decision: `<APPROVED|CHANGES_REQUESTED>`
- Mergeability outcome:
  - Blocked before approval: `<YES|NO>`
  - Mergeable after approval: `<YES|NO>`
  - Verified by: `<name>`

## Snapshot Diff Review Template

Use this checklist when a feature introduces snapshot-backed UI tests and snapshot diffs appear in PRs.

- Expected snapshot updates:
  - Intended copy/label wording updates linked to the active feature slice.
  - Deliberate layout/classname updates for the affected component.
  - Planned control additions/removals documented in feature scope.
- Suspicious snapshot updates:
  - Missing loading/error/empty state text after API/error-handling changes.
  - Missing critical controls that were previously rendered (filters, pagination, sort).
  - Unexpected raw backend-only field exposure in UI output.
- Reviewer verification steps:
  - Confirm the snapshot diff is referenced in the relevant `product-os/02-features/*.md` entry.
  - Run the feature-scoped snapshot test command locally and confirm it passes.
  - Ensure at least one behavior-oriented test also passes for the same component route.

### FEAT-003 applied example

- Feature reference: `product-os/02-features/FEAT-003-geospatial-mapping.md`
- Snapshot test command: `npm test -- "components/plots/plot-geometry-history-panel.test.tsx"`
- Companion behavior check: `npm test -- "app/plots/[id]/page.test.tsx"`

## Snapshot-Backed Feature Registry

Track feature slices that rely on snapshot tests so reviewers can quickly locate the right commands and companion behavior checks.

| Feature | Snapshot command | Companion behavior command | Shared template linked in feature doc |
| --- | --- | --- | --- |
| `FEAT-003` | `npm test -- "components/plots/plot-geometry-history-panel.test.tsx"` | `npm test -- "app/plots/[id]/page.test.tsx"` | `Yes` |

### Registry update procedure

When a feature introduces snapshot-backed UI tests:

1. Add (or update) one row in the registry table with:
   - feature id (`FEAT-xxx`)
   - snapshot command
   - companion behavior command
   - whether the feature doc links `Snapshot Diff Review Template`
2. Update that feature doc to include only feature-specific commands and link the shared template.
3. Record the slice in:
   - `product-os/06-status/current-focus.md`
   - `product-os/06-status/done-log.md`
   - `product-os/06-status/daily-log.md`
