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

- Run URL: _Local run (no CI URL)_
- Commit SHA: _Local workspace (uncommitted)_
- Timestamp (UTC): _2026-04-13T00:00:00Z (approx)_
- Artifact URL: _N/A (local terminal evidence)_
- Summary snapshot:
  - Test Suites: `3 passed, 3 total`
  - Tests: `7 passed, 7 total`
  - Ran all test suites: `src/harvest/ownership-scope.int.spec.ts|src/harvest/controller-scope.int.spec.ts|src/reports/package-report-access.int.spec.ts`
  - Command: `TEST_DATABASE_URL="$(grep '^TEST_DATABASE_URL=' "../.env.local" | sed 's/^TEST_DATABASE_URL=//')" npm run test:integration:ownership`

### Reviewer signoff

- Reviewer:
- Decision: PASS / FAIL
- Notes:
