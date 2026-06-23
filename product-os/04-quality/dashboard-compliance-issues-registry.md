# Dashboard compliance issues registry

Code mirror: `apps/dashboard-product/lib/dashboardComplianceIssuesRegistry.ts`  
Runtime: `app/compliance/issues/page.tsx`, `components/compliance/compliance-issues-kanban.tsx`  
Backend: `GET/PATCH /v1/requests/issues` (`requests.service.ts`)

## Operational statuses

`open`, `in_progress`, `resolved`, `closed`

## Severities

`INFO`, `WARNING`, `BLOCKING`

## Issue kinds

| Kind | Source | PATCH allowed |
|------|--------|---------------|
| `canonical` | `compliance_issues` table | Yes (`issue_compliance_*`) |
| `campaign` | `request_campaigns` | No |
| `request` | `inbox_requests` | No |
| `upstream_blocker` | Cross-tenant read model | No |

## Page permissions

| Route | Nav permission | Action gates |
|-------|----------------|--------------|
| `/compliance/issues` | `compliance:view` | `compliance:create_issue`, `compliance:resolve_issue` |
| Kanban advance | — | `compliance:resolve_issue` |

## Backend API parity

| Permission | Backend entry | Tenant roles |
|------------|---------------|--------------|
| `compliance:view` | `requests_operational_issues` | exporter, cooperative, importer, sponsor, country_reviewer |
| `compliance:resolve_issue` | `requests_operational_issues` | exporter, cooperative, sponsor |
| `compliance:create_issue` | `requests_operational_issues` | exporter, cooperative, sponsor |

## Analytics

- `dashboard_issue_status_changed` / `dashboard_issue_status_change_failure`
- `dashboard_issue_create_success` (local dialog until POST API)

## Guards

- `dashboard-compliance-issues-guard.mjs`
- `dashboard-compliance-permission-guard.mjs`
- `dashboard-compliance-backend-parity-guard.mjs`

## Playwright golden path

`e2e/compliance-issues-status.spec.ts` — exporter session, mocked PATCH on owned issue.

## Manual QA still required

Resolve blockers via real compliance runs, upstream blocker remediation across tenants, KPI count parity with backend metrics.
