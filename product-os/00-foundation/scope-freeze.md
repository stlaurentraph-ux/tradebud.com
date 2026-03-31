# Scope Freeze

## Source of truth

- `MVP_PRD.md`

## In scope (v1)

- EUDR only
- Multi-tenant RBAC and delegated admin
- Mobile offline field capture and geospatial workflows
- EUDR rules engine and one primary risk provider
- Filing package generation + middleware submission path
- Chat threads and issue remediation
- Operational dashboards (org + sponsor)
- API/webhooks + first 1-2 integrations
- Template-based workflows

## Out of scope (v1)

- Multi-regulation support
- Full no-code workflow builder
- Multi-provider risk engine
- Full BI suite
- Broad integrations marketplace
- Full mobile parity for admin-heavy back-office flows

## Hard boundaries

- No filing without pre-flight pass
- No implicit cross-tenant access
- No uncontrolled override without rationale and audit log
- No state transition that bypasses canonical lifecycle models
