# FEAT: Dashboard compliance issues structural contracts

Status: **shipped (structural slice)**  
Registry: `apps/dashboard-product/lib/dashboardComplianceIssuesRegistry.ts`  
Quality doc: `product-os/04-quality/dashboard-compliance-issues-registry.md`

## Scope

- Canonical operational issue statuses, kinds, severities, transitions
- Page PermissionGate contracts for create + resolve
- Backend `requests_operational_issues` API parity bindings
- Client analytics for status change + local create
- Playwright golden path #5 (`compliance_issues_status`)

## Out of scope

- Full OpenAPI `/v1/compliance-issues` CRUD (create still local-only)
- Backend audit events on PATCH (client analytics only today)
- Importer resolve permissions (view-only by design)

## Acceptance criteria

- [x] `npm run qa:structural -w dashboard-product` passes compliance guards
- [x] Playwright resolves owned issue with mocked PATCH
- [x] Kanban advance + detail status select gated by `compliance:resolve_issue`
