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

### Latest validated run

- Run URL: https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/24401646754
- Commit SHA: dccb36f6e9dc2f9a2e937401d6f8dcf8ce30d27e
- Timestamp (UTC): 2026-04-14T13:27:58Z
- Artifact URL: https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/24401646754/artifacts/6428758408
- Summary snapshot:
  - Test Suites: `3 passed, 3 total`
  - Tests: `7 passed, 7 total`
  - Ran all test suites: `src/harvest/ownership-scope.int.spec.ts, src/harvest/controller-scope.int.spec.ts, src/reports/package-report-access.int.spec.ts`
  - Command: `npm run test:integration:ownership`

### Reviewer signoff

- Reviewer: Raphael Saint-Laurent
- Decision: PASS
- Notes: Ownership/access policy lane executed non-skipped in CI (run `24401646754`), required suite summary matches expected coverage (`3 suites`, `7 tests`), and artifact `backend-ownership-integration-log` (`6428758408`) is available for audit traceability. Follow-up: migrate CI action runtime usage ahead of Node 20 deprecation cutoff.
