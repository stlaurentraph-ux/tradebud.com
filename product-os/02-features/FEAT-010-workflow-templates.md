# Workflow templates

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for workflow templates aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Template-based stages, assignments, approvals, and SLAs.

## Non-goals

Anything outside v1 boundaries in `MVP_PRD.md`.

## Dependencies

See `product-os/01-roadmap/dependency-map.md`.

## Key entities

Use entity model in `MVP_PRD.md` and `PRODUCT_PRD.md`.

## UX / operational notes

Use journey and JTBD constraints from `JTBD_PRD.md` and `BUILD_READINESS_ARTIFACTS.md`.

## Tasks checklist

- [x] Confirm permissions and tenant boundaries
- [x] Confirm state transitions
- [x] Confirm exception handling and recovery
- [x] Confirm analytics event coverage
- [x] Confirm acceptance criteria mapping
- [x] Confirm v1.6 architecture constraints for touched areas (spatial, HLC sync, lineage, TRACES chunking, GDPR shredding)
- [x] Update status docs

## First execution slice (S1)

Scope: workflow template execution matrix bootstrap for tenant-safe stage orchestration, assignment lifecycle, approvals, and SLA-aware escalations.

### Permission and tenant boundary matrix

- **Exporter role:** can create/activate workflow templates, manage stage ownership rules, and approve/reject stage transitions for tenant-owned workflows.
- **Agent role:** can execute assigned workflow tasks/stages and submit evidence or completion intents, but cannot mutate template definitions or SLA policy.
- **Farmer role:** can view and complete only farmer-scoped workflow actions explicitly assigned through canonical stage policies; no cross-tenant template visibility.
- **Missing tenant claim:** all workflow template/stage read-write operations fail closed before template metadata, assignment state, or approval history is returned.

### State transition matrix

- `template_draft -> template_active` when required stages/owners/SLA fields pass validation and activation is approved.
- `template_active -> instance_stage_pending` when a workflow instance is initialized from template with stage ordering materialized.
- `instance_stage_pending -> instance_stage_in_progress` when assignee accepts or starts the stage task.
- `instance_stage_in_progress -> instance_stage_completed` when required evidence/checklist gates pass canonical validation.
- `instance_stage_completed -> instance_stage_approved|instance_stage_rejected` based on reviewer decision, with rejection returning to deterministic remediation state.

### Exception handling and recovery

- Invalid template definitions (missing stage owner, cyclic stage dependency, invalid SLA bounds) return deterministic validation errors with no partial template activation.
- Tenant/role authorization failures return explicit deny semantics and never leak stage approvals, assignment comments, or cross-tenant template metadata.
- Stage completion conflicts (duplicate completion, stale reviewer action, out-of-order approval) fail with canonical transition errors and idempotency-safe recovery prompts.
- SLA timeout breaches transition stages into escalation-ready state with explicit audit evidence and operator-visible recovery actions.

### Analytics/event coverage

- Workflow lifecycle analytics baseline includes:
  - template created / activated / archived
  - stage assigned / started / completed / approved / rejected
  - SLA warning / breached / escalated
- Event payload baseline: tenantId, templateId, instanceId, stageId, actor role/id, assignee/reviewer ids, transition outcome, SLA timer context, timestamp.

### Acceptance mapping (v1)

- Workflow templates and runtime stage actions remain tenant-scoped and role-constrained across create/assign/approve paths.
- Stage transitions remain deterministic and idempotent for repeated completion or approval submissions.
- SLA warning/escalation behavior is auditable with immutable transition evidence and explicit recovery guidance.
- Workflow diagnostics provide sufficient assignment/approval/SLA evidence for operational handoff and compliance review.

### v1.6 architecture constraints (S1 applicability)

- **Spatial correctness:** workflow stages referencing geospatial checks must consume canonical `GEOGRAPHY`-validated upstream outputs and avoid non-canonical area recomputation.
- **Offline conflict integrity:** workflow stage ordering and approvals must follow persisted HLC/audit ordering, not client wall-clock assumptions.
- **Lineage performance:** workflow evidence lookups that require lineage must use materialized lineage fields and avoid runtime recursive traversal.
- **TRACES chunking resilience:** workflow stages linked to filing/submission actions must tolerate chunked payload references without stage-state drift.
- **GDPR shredding safety:** workflow history must retain immutable audit references while preventing rehydration of shredded personal identifiers.

## Execution slices

### S1 code slice 1 - workflow template execution matrix bootstrap

- Documented FEAT-010 S1 execution matrix for permissions, transition states, exception recovery, analytics baseline, acceptance mapping, and v1.6 architecture constraints.
- Established implementation-ready baseline for next FEAT-010 slices (template contract baseline, stage lifecycle telemetry, and SLA escalation guardrails).

Verification commands:

- `n/a (documentation slice)`

### S1 code slice 2 - tenant-safe workflow template/stage contract baseline

- Added backend module/controller for workflow templates with tenant-claim fail-closed policy and explicit role-scoped behavior:
  - `POST /v1/workflow-templates` (exporter-only create)
  - `GET /v1/workflow-templates` (exporter/agent list)
  - `POST /v1/workflow-templates/{id}/stages/{stageId}/transitions` (deterministic stage transitions with role checks)
- Enforced deterministic transition matrix in runtime contract:
  - `pending -> in_progress -> completed -> approved|rejected`
  - `rejected -> in_progress` remediation loop
  - invalid edges fail closed with explicit transition error.
- Added immutable workflow analytics evidence in `audit_log` for:
  - `workflow_template_created`
  - `workflow_stage_transitioned`
- Added unit + DB-backed integration tests for tenant isolation, role boundaries, and transition-state semantics.
- Published OpenAPI path + schema contracts for workflow template create/list/transition payloads and workflow stage status enum.

Verification commands:

- `cd tracebud-backend && npm run test -- workflow-templates.controller.spec.ts workflow-templates.controller.int.spec.ts`

### S1 code slice 3 - workflow diagnostics read surface + dashboard evidence visibility

- Added tenant-scoped workflow diagnostics read endpoint:
  - `GET /v1/audit/gated-entry/workflow-activity`
  - supports `phase` (`template_created|stage_transitioned|sla_warning|sla_breached|sla_escalated`) and `slaState` filters.
- Extended dashboard analytics proxy (`eventKind=workflow_activity`) and frontend hook surface (`useWorkflowActivityEvents`) for workflow diagnostics retrieval with pagination/filtering.
- Added admin diagnostics workflow activity panel with operator-facing phase/SLA filters and paginated evidence table (`templateId`, `stageId`, transition/SLA context).
- Added unit + DB-backed integration tests for workflow diagnostics tenant-scope filtering and phase/SLA filter semantics.
- Published OpenAPI contract updates for workflow activity endpoint and typed telemetry response/event schemas.

Verification commands:

- `cd tracebud-backend && npm run test -- audit.controller.spec.ts audit.gated-entry.int.spec.ts`
- `cd apps/dashboard-product && npm run test -- app/api/analytics/gated-entry/route.test.ts`

### S1 code slice 4 - SLA warning/breach/escalation write-path + deterministic recovery guards

- Added workflow stage SLA transition write endpoint:
  - `POST /v1/workflow-templates/{id}/stages/{stageId}/sla-transitions`
  - payload: `toState` (`on_track|warning|breached|escalated`) + optional reason.
- Enforced deterministic SLA-state machine with explicit recovery path:
  - `on_track -> warning`
  - `warning -> breached|on_track`
  - `breached -> escalated|on_track`
  - `escalated -> on_track`
  - invalid edges fail closed with canonical transition errors.
- Enforced role guardrails:
  - warning/breached/recovery: exporter or agent only
  - escalated: exporter only
  - farmer blocked from SLA writes.
- Added immutable SLA telemetry events in `audit_log`:
  - `workflow_stage_sla_warning`
  - `workflow_stage_sla_breached`
  - `workflow_stage_sla_escalated`
  - `workflow_stage_sla_recovered` (recovery to `on_track`)
- Extended workflow diagnostics schema/filtering to include SLA recovery events across backend/OpenAPI/dashboard type contracts.
- Added unit + DB-backed integration tests proving deterministic SLA write semantics and recovery behavior.

Verification commands:

- `cd tracebud-backend && npm run test -- workflow-templates.controller.spec.ts workflow-templates.controller.int.spec.ts`
- `cd tracebud-backend && npm run test -- audit.controller.spec.ts audit.gated-entry.int.spec.ts`

### S1 code slice 5 - closeout acceptance reconciliation

- Reconciled FEAT-010 acceptance mapping against delivered S1 slices:
  - tenant/role boundaries are enforced on create/list/stage transition/SLA transition/write paths
  - deterministic stage and SLA transition state machines are implemented and tested
  - immutable workflow telemetry and workflow diagnostics evidence surfaces are implemented and test-covered.
- Confirmed v1.6 architecture constraints applicability remains documented and unchanged for touched scope (spatial correctness, offline conflict integrity, lineage performance, TRACES chunking resilience, GDPR shredding safety).
- Closed the feature open question for S1 scope:
  - provider/protocol decision is resolved to internal API + audit-log evidence protocol for workflow templates diagnostics and SLA lifecycle telemetry.
- Marked FEAT-010 as done for current roadmap scope with closeout traceability in status logs.

Verification commands:

- `n/a (closeout reconciliation/documentation slice)`

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [x] Provider/protocol choices finalized where needed

## Status

Done (TB-V16-010 / FEAT-010)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated
