# FEAT: Cross-tenant compliance issue ownership

## Problem

When the same farmer appears in cooperative, exporter, and multiple importer pipelines, duplicate or ambiguous issue ownership created confusion about who gets notified and who must fix data.

## Model

| `issue_kind` | Who owns remediation | Who sees it | Can update status |
|---|---|---|---|
| `canonical` | Owning tenant (`compliance_issues.tenant_id`) | Owning tenant only | Yes |
| `upstream_blocker` | Upstream org (exporter/cooperative) | Downstream tenants with inbox + shared package lineage | No (read-only visibility) |
| `campaign` | Campaign launcher | Launching tenant | No (progress via campaign) |
| `request` | Inbox recipient | Recipient tenant | No (progress via inbox) |

## Owner roles (`owner_role`)

- `cooperative` — field/member plot and farmer data
- `exporter` — tenure confirmation, batch/shipment assembly
- `importer` — declaration prep, upstream evidence requests
- `farmer` — mobile capture at source
- `system` — automated checks

## Backend

- Migration `tb_v16_044`: `compliance_issues.owner_role`
- `GET /v1/requests/issues` returns `issue_kind`, `owner_role`, `owner_organisation_name`, `source_issue_id`, `can_update_status`
- Upstream blockers computed at read time (no duplicate DB rows)
- `PATCH /v1/requests/issues/:id` only for `issue_compliance_*` owned by tenant

## Dashboard

- Issues board badges for ownership kind and remediation owner
- Upstream blocker banner + ownership filter
- Status updates disabled for non-owned issues; remediation CTA routes to inbox/campaign/packages

## Acceptance criteria

- [x] Importer with shared package sees upstream tenure/plot blockers as read-only `upstream_blocker` rows
- [x] Homepage alert surfaces `upstream_blockers_count` with CTA to issues board (`dashboard_upstream_blocker_alert_clicked` analytics)
- [x] Owning exporter can PATCH canonical issue status
- [x] No duplicate notifications implied — one canonical row per source issue
- [x] UI shows remediation owner role and organisation name

## Analytics (future)

- `compliance_issue_upstream_viewed`
- `compliance_issue_escalation_requested`
