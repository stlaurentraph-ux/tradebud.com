# Event Tracking

## Canonical source

- `BUILD_READINESS_ARTIFACTS.md` (Event plan)

## Rule

Use canonical event names and required properties. No alias names.

## Mandatory event families

- Auth and tenant switching
- Supplier onboarding lifecycle
- Field assignment/capture/sync lifecycle
- Shipment validation lifecycle
- Risk screening lifecycle
- Filing generation/submission/response lifecycle
- Issue/thread lifecycle
- Audit export and dashboard usage
- Geometry ingestion/validation lifecycle (`ST_MakeValid` outcomes and variance rejection)
- Offline HLC lifecycle (generated, accepted, rejected, fallback-applied)
- Lineage materialization lifecycle (`root_plot_ids` generated/refreshed/failed)
- TRACES chunking lifecycle (chunk-plan, chunk-submit, chunk-accept/reject, reconciliation)
- GDPR shredding lifecycle (request-received, anonymized, retention-exception, completed)
- Launch lifecycle (signup_started, signup_completed, trial_started, trial_expired, upgrade_clicked, upgrade_completed)
- Onboarding lifecycle (onboarding_step_completed with tenant, role, step key, and completion timestamp)
- Onboarding CTA gate fallback lifecycle (`onboarding_cta_gated_redirect` with tenant, role, gate, and blocked target path)
- Account creation conversion lifecycle (`create_workspace_value_viewed`, `create_workspace_cta_clicked`, optional-step `onboarding_skipped`) with required context (`tenant`, `role`, `stepKey`, `source`, `campaign`)
