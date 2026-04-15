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
  - `src/harvest/ownership-scope.int.spec.ts`
  - `src/harvest/controller-scope.int.spec.ts`
  - `src/reports/package-report-access.int.spec.ts`
  - `src/inbox/inbox.controller.int.spec.ts`
  - `src/audit/audit.gated-entry.int.spec.ts`

### Latest validated run

- Run URL: https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/24407562162
- Commit SHA: 0836f0a6c3982a21504a87cd1bc49286f2162dc2
- Timestamp (UTC): 2026-04-14T15:25:08Z
- Artifact URL: https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/24407562162/artifacts/6431368794
- Summary snapshot:
  - Test Suites: `4 passed, 4 total`
  - Tests: `10 passed, 10 total`
  - Ran all test suites: `src/harvest/ownership-scope.int.spec.ts, src/harvest/controller-scope.int.spec.ts, src/reports/package-report-access.int.spec.ts, src/inbox/inbox.controller.int.spec.ts`
  - Command: `npm run test:integration:ownership`
- Coverage freshness note:
  - Ownership lane suite set was expanded to include `src/audit/audit.gated-entry.int.spec.ts`; capture a new CI evidence run before release signoff.

### Reviewer signoff

- Reviewer: Raphael Saint-Laurent
- Decision: PASS
- Notes: Ownership/access policy lane executed non-skipped in CI (run `24407562162`), required suite summary matches expected coverage (`4 suites`, `10 tests`), and artifact `backend-ownership-integration-log` (`6431368794`) is available for audit traceability. Node 20 action-runtime deprecation warning remains non-blocking and is intentionally tracked separately.
