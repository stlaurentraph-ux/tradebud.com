# Cool Farm + SAI V2 Parallel Execution Pack

Purpose: run a V2-ready implementation track in parallel without changing V1 runtime behavior.

## Decision guardrails

- Keep V2 isolated behind feature flags (`coolfarm_sai_v2_enabled=false` by default).
- No production-path external Cool Farm calls in V1 flows.
- Persist all V2 artifacts in dedicated integration tables.
- Enforce explicit tenant isolation, role-scoped permissions, and auditable state transitions.
- Keep canonical transitions for V2 questionnaires (`draft -> submitted -> validated -> scored -> reviewed`) with immutable audit evidence.

## Parallel tracks

### Track A: product + compliance contract

- Define canonical questionnaire schema (`farmQuestionnaireV1`) with conditional logic and evidence requirements.
- Publish mapping registry:
  - `question_id -> coolfarm.pathway.field`
  - `question_id -> sai.indicator`
- Define acceptance criteria for permissions, transitions, exceptions/recovery, analytics coverage.

Deliverables:

- `product-os/02-features/FEAT-009-integrations.md` V2 section updates.
- Mapping register artifact (path to be finalized in implementation slice).

### Track B: backend foundation

- Create isolated V2 persistence surfaces:
  - `integration_questionnaire_v2`
  - `integration_runs_v2`
  - `integration_evidence_v2`
  - `integration_audit_v2`
- Build save/submit/read APIs with idempotent submit semantics.
- Add validation engine (range/consistency/unit/anti-double-count checks).

Deliverables:

- SQL migration artifacts (new V2 tables).
- API contract and validation test coverage.

### Track C: adapter + transform lane (shadow mode)

- Implement adapter interfaces only:
  - `CoolFarmAdapter` (stub first)
  - `SaiScoringAdapter` (rules engine first)
- Build transform layer (`canonical -> Cool Farm payload`) for `annuals` and `rice` first.
- Run async shadow scoring jobs for pilot tenants only.

Deliverables:

- Stub adapters and deterministic fixture outputs.
- Contract tests for transform and adapter boundaries.

### Track D: frontend pilot surface

- Build schema-driven form renderer and evidence uploader.
- Add pathway-first conditional rendering (`annuals`, `rice` first).
- Provide internal-only result page (hidden from default V1 UX).

Deliverables:

- Feature-flagged dashboard UI path for V2 pilot users.
- Client-side validation parity with backend errors/warnings.

### Track E: QA + observability

- Add event taxonomy for V2 lifecycle and diagnostics.
- Build fixture packs for happy/edge/failure pathways.
- Add CI gate for schema/mapping drift.

Deliverables:

- Test matrix for transitions, permission denials, exception recovery.
- Dashboard metrics for completion, evidence coverage, warning density.

## Sequenced execution (non-Jira backlog IDs)

- `TB-CFSAI-V2-001`: canonical questionnaire schema + versioning.
- `TB-CFSAI-V2-002`: Cool Farm/SAI mapping registry.
- `TB-CFSAI-V2-003`: V2 state machine + transition guardrails.
- `TB-CFSAI-V2-004`: feature-flag and tenant rollout policy.
- `TB-CFSAI-V2-010`: isolated persistence + migrations.
- `TB-CFSAI-V2-011`: questionnaire save/submit/read endpoints.
- `TB-CFSAI-V2-012`: validation engine + anti-double-count checks.
- `TB-CFSAI-V2-020`: adapter interfaces + deterministic stubs.
- `TB-CFSAI-V2-021`: transform layer (`annuals`, `rice`).
- `TB-CFSAI-V2-030`: schema-driven UI + conditional logic.
- `TB-CFSAI-V2-040`: analytics events + observability views.
- `TB-CFSAI-V2-050`: E2E shadow flow + readiness gates.

## Readiness gates before real integration enablement

- Functional:
  - Required Cool Farm sections complete for enabled pathways.
  - SAI scoring rules return deterministic outputs for fixture packs.
- Reliability:
  - Shadow run failure rate below agreed threshold for 2 consecutive weeks.
  - Retries, dead-letter handling, and idempotency verified.
- Governance:
  - Permission matrix and tenant isolation test evidence green.
  - Audit/event evidence present for every state transition.
- Rollout:
  - Kill switch tested at API and UI boundaries.
  - Pilot tenant sign-off captured before enabling real provider calls.
