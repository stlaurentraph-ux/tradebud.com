# Assessment Workflow Endpoint Map (FEAT-009 V2)

This is the canonical API surface for the dashboard-to-farmer assessment workflow.
Use these routes only; deprecated aliases are intentionally removed.

## Backend Base

- `tracebud-backend` route root: `/api/v1/integrations/assessments/requests`

## Dashboard Proxy Base

- `apps/dashboard-product` proxy root: `/api/integrations/assessments/requests`

## Canonical Endpoints

- `POST /v1/integrations/assessments/requests`
  - Purpose: create/send request to a farmer.
  - Roles: `exporter | admin | compliance_manager`.
  - Notes:
    - accepts optional `questionnaireDraftId`.
    - if missing, backend auto-creates questionnaire draft and links it.

- `GET /v1/integrations/assessments/requests`
  - Purpose: list assessment requests for tenant.
  - Roles: `exporter | admin | compliance_manager | farmer | agent`.
  - Query:
    - `assignedToMe=true` returns actor-assigned requests.

- `GET /v1/integrations/assessments/requests/:id`
  - Purpose: fetch one request by id.
  - Roles: same as list, with tenant/farmer scope enforcement.

- `PATCH /v1/integrations/assessments/requests/:id/status`
  - Purpose: manager status transitions.
  - Roles: `exporter | admin | compliance_manager`.
  - Allowed statuses:
    - `sent | opened | in_progress | submitted | reviewed | needs_changes | cancelled`.

- `PATCH /v1/integrations/assessments/requests/:id/opened`
  - Purpose: farmer marks assignment opened.
  - Roles: `farmer | agent`.

- `PATCH /v1/integrations/assessments/requests/:id/in-progress`
  - Purpose: farmer marks in-progress execution.
  - Roles: `farmer | agent`.

- `PATCH /v1/integrations/assessments/requests/:id/submitted`
  - Purpose: farmer submits workflow back to dashboard review.
  - Roles: `farmer | agent`.
  - Gate:
    - linked questionnaire must be in `submitted | validated | scored | reviewed`.

- `PATCH /v1/integrations/assessments/requests/:id/reviewed`
  - Purpose: dashboard marks review complete.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/needs-changes`
  - Purpose: dashboard requests farmer corrections.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/cancelled`
  - Purpose: manager cancels request.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/sent`
  - Purpose: manager resets request to sent state.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/title`
  - Purpose: update request title/instructions/due date.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/farmer`
  - Purpose: reassign farmer.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/pathway`
  - Purpose: update pathway (`annuals|rice`).
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/metadata`
  - Purpose: replace request metadata object.
  - Roles: `exporter | admin | compliance_manager`.

- `PATCH /v1/integrations/assessments/requests/:id/touch`
  - Purpose: refresh `updated_at` timestamp.
  - Roles: view-allowed roles.

## Related Questionnaire Endpoints

- Schema/drafts/runs are served by `CoolFarmSaiV2Controller`:
  - root: `/api/v1/integrations/coolfarm-sai-v2/*`
  - linkage field on request row: `questionnaire_id`.

## Guardrails

- Tenant isolation is mandatory on all reads/writes.
- Farmer and agent can only move statuses for assigned request rows.
- Dashboard submission completion is blocked until linked questionnaire state is ready.
