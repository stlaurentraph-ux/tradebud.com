# OpenAPI Governance Scripts

This folder contains governance guard scripts used by CI and local verification flows.

## Commands

- `npm run openapi:governance:markdown:check -- --markdown <path>`
  - Runs shared markdown QA utility directly against any markdown file.
  - Optional flags: `--package-json <path>`, `--no-commands`, `--no-paths`, `--report <path>`.
- `npm run openapi:governance:readme:check`
  - Validates that `npm run ...` commands referenced in this README exist in `package.json`.
  - Uses shared markdown QA utility `scripts/openapi-governance/markdown-reference-check.mjs`.
  - Validates that referenced repository file paths in this README also exist.
  - Validates required README runbook anchors from policy `docs/openapi/governance-readme-policy.json`.
  - Optional report output: `-- --report <path>`
- `npm run openapi:governance:readme:report:assert`
  - Validates README governance report (`openapi-governance-readme-report.json`) against schema `docs/openapi/governance-readme-report.schema.json`.
  - Enforces PASS/FAIL consistency and required field invariants before README artifact publication.
- `npm run openapi:governance:policy:validate`
  - Validates `docs/openapi/governance-codeowners-policy.json` against expected schema/constraints.
  - Optional report output: `-- --report <path>`
- `npm run openapi:governance:check`
  - Validates `.github/CODEOWNERS` against required protected paths and owner handles from governance policy.
  - Optional report output: `-- --report <path>`
- `npm run openapi:governance:evidence-doc:parity:check`
  - Validates backend/OpenAPI parity for `DdsPackageEvidenceDocument` across required field set, field-level `type/format/nullable/enum` semantics, and response example key+enum validity.
  - Uses parser-backed extraction (`typescript` AST + YAML parser) to reduce formatting-coupled false positives from text-shape changes.
  - Emits stable machine-readable error codes (for example `EVIDENCE_DOC_PARITY_FIELD_MISMATCH`) alongside human-readable diagnostics for CI/smoke assertion stability.
  - Optional flags: `--dto <path>`, `--openapi <path>`, `--json` (JSON pass/fail payload for machine consumers).
  - Fails closed if implementation and contract drift.
- `npm run openapi:governance:evidence-doc:parity:smoke`
  - Runs fixture-based smoke scenarios for evidence-doc parity checker behavior across pass + targeted failure classes (enum drift, required-field drift, nullable drift, example-key drift, format drift, and non-nullable example-null drift).
  - Guards checker behavior independently from live repository contract files.
- `npm run openapi:governance:evidence-doc:parity:report:assert`
  - Validates `--json` parity output contract against schema `docs/openapi/evidence-doc-parity-report.schema.json`.
  - Asserts both PASS and FAIL JSON payload envelopes (`status`, `schemaVersion`, and required typed fields).
  - Contracts CI also snapshots PASS/FAIL JSON payloads and uploads artifact `contracts-openapi-evidence-doc-parity-contract` for review traceability.
  - Contracts CI publishes an `Evidence-Doc Parity JSON Contract` summary block with schema version and fail-code highlights for quick reviewer triage.
- `npm run openapi:governance:evidence-doc:parity:metrics:generate`
  - Generates `openapi-evidence-doc-parity-metrics.json` from parity PASS/FAIL JSON snapshots for lightweight trend ingestion.
  - Includes schema version, fail code, check counters, and CI run metadata when available.
- `npm run openapi:governance:artifacts:assert`
  - Validates generated governance artifacts (`openapi-governance-metrics.json`, README report, policy report, codeowners report) for file presence + JSON shape consistency.
- `npm run openapi:governance:markdown:report:assert`
  - Validates markdown reference report (`openapi-markdown-reference-report.json`) against versioned schema `docs/openapi/markdown-reference-report.schema.json`.
  - Enforces PASS/FAIL consistency and schema-version compatibility before artifact publication.
- `npm run openapi:governance:snapshot:registry:check`
  - Validates snapshot-backed feature registry structure and command fields in `product-os/04-quality/release-qa-evidence.md`.
  - Optional report output: `-- --report openapi-snapshot-registry-report.json`
- `npm run openapi:governance:snapshot:registry:report:assert`
  - Validates snapshot-registry report (`openapi-snapshot-registry-report.json`) against `docs/openapi/snapshot-registry-report.schema.json`.
  - Enforces PASS/FAIL consistency before snapshot-registry artifact publication.
- `npm run openapi:governance:metrics:generate`
  - Generates `openapi-governance-metrics.json` and appends the consolidated governance summary block in CI.
  - Optional flag: `-- --no-summary` to refresh metrics JSON without appending summary text.
  - Metrics include presentation-lane telemetry (`presentationValidationStatus`, `presentationDriftWarningCount`, `presentationValidationRecordedAt`) and snapshot-registry telemetry (`snapshotRegistryStatus`, `snapshotRegistryRowCount`) for artifact trend queries.
- `npm run openapi:governance:metrics:smoke`
  - Runs fixture-based smoke scenarios for metrics generator output shape and pass/fail status folding.
- `npm run openapi:governance:metrics:trend -- --input <path>`
  - Aggregates presentation drift and snapshot-registry telemetry from one or more `openapi-governance-metrics.json` files.
  - Input can be a single metrics file or any directory (recursively searched for metrics files).
  - Optional flag: `--json` to emit machine-readable summary payload.
- `npm run openapi:governance:metrics:trend:delta -- --current <path> --previous <path>`
  - Computes current-vs-previous deltas for FAIL count, total presentation drift warnings, snapshot-registry FAIL count, and total snapshot-registry rows.
  - Optional flag: `--json` to emit machine-readable delta payload.
- `npm run openapi:governance:metrics:trend:report:assert`
  - Validates `openapi-governance-presentation-trend.json` against `docs/openapi/governance-presentation-trend.schema.json` and invariants.
- `npm run openapi:governance:metrics:trend:delta:report:assert`
  - Validates `openapi-governance-presentation-trend-delta.json` against `docs/openapi/governance-presentation-trend-delta.schema.json` and invariants.
- `npm run openapi:governance:metrics:trend:assertions:smoke`
  - Runs fixture-based smoke checks for trend and delta assertion scripts (valid + invalid cases).
- `npm run openapi:governance:metrics:presentation:check`
  - Validates governance summary block presentation against shared template.
  - Intended as non-blocking CI warning signal for formatting drift.

## CI usage order

1. `openapi:governance:readme:check -- --report openapi-governance-readme-report.json`
2. `openapi:governance:readme:report:assert`
3. `openapi:governance:markdown:check -- --markdown product-os/04-quality/release-qa-evidence.md --no-commands --report openapi-markdown-reference-report.json`
4. `openapi:governance:markdown:report:assert`
5. `openapi:governance:policy:validate -- --report openapi-governance-policy-report.json`
6. `openapi:governance:check -- --report openapi-governance-codeowners-report.json`
7. `openapi:governance:evidence-doc:parity:check`
8. `openapi:governance:evidence-doc:parity:smoke`
9. `openapi:governance:evidence-doc:parity:report:assert`
10. `openapi:governance:evidence-doc:parity:metrics:generate`
11. `openapi:governance:metrics:generate`
12. `openapi:governance:metrics:smoke`
13. `openapi:governance:metrics:presentation:check` (non-blocking)
14. `openapi:governance:metrics:generate -- --no-summary` (with presentation status env)
15. `openapi:governance:artifacts:assert`
16. `openapi:governance:metrics:trend -- --input . --json` (publish trend summary/artifact)
17. `openapi:governance:metrics:trend:delta -- --current openapi-governance-presentation-trend.json --previous openapi-governance-presentation-trend-previous.json --baseline-metadata openapi-governance-presentation-trend-baseline.json --json` (publish delta lines when previous artifact exists)
    - Contracts lane baseline retrieval prefers same-branch artifacts and skips non-success source runs to reduce noisy delta comparisons.
    - Contracts lane filters by workflow file path resolved from `GITHUB_WORKFLOW_REF` (fallback to `GITHUB_WORKFLOW` name) to avoid baseline pickup from unrelated workflows.
    - Delta report includes baseline metadata fields (`runId`, `workflowPath`, `workflowName`) when available.
18. `openapi:governance:metrics:trend:report:assert`
19. `openapi:governance:metrics:trend:delta:report:assert`
20. `openapi:governance:snapshot:registry:check -- --report openapi-snapshot-registry-report.json`
21. `openapi:governance:snapshot:registry:report:assert`
22. `openapi:governance:metrics:trend:assertions:smoke`

## Source-of-truth inputs

- Policy config: `docs/openapi/governance-codeowners-policy.json`
- Policy schema: `docs/openapi/governance-codeowners-policy.schema.json`
- README policy config: `docs/openapi/governance-readme-policy.json`
- README policy schema: `docs/openapi/governance-readme-policy.schema.json`
- README report schema: `docs/openapi/governance-readme-report.schema.json`
- Markdown report schema: `docs/openapi/markdown-reference-report.schema.json`
- Snapshot registry report schema: `docs/openapi/snapshot-registry-report.schema.json`
- Evidence-doc parity report schema: `docs/openapi/evidence-doc-parity-report.schema.json`
- CODEOWNERS: `.github/CODEOWNERS`

## Markdown Schema Bump Procedure

1. Update `docs/openapi/markdown-reference-report.schema.json`:
   - Increment `schemaVersion` const (for example `1 -> 2`).
   - Add migration notes in PR description and release evidence.
2. Update report producer `scripts/openapi-governance/markdown-reference-check.mjs`:
   - Emit the new `schemaVersion`.
   - Ensure new required fields are populated.
3. Update validator `scripts/openapi-governance/markdown-report-assert.mjs`:
   - Accept only the new version.
   - Keep status/error invariants aligned with schema constraints.
4. Validate locally:
   - `npm run openapi:governance:markdown:check -- --markdown product-os/04-quality/release-qa-evidence.md --no-commands --report openapi-markdown-reference-report.json`
   - `npm run openapi:governance:markdown:report:assert`
5. Confirm CI summary shows expected `Schema version` and markdown artifact upload remains green.
