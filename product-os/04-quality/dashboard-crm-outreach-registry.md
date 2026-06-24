# Dashboard CRM + outreach registry

Code mirror: `apps/dashboard-product/lib/dashboardCrmOutreachRegistry.ts`  
Canonical types: `lib/contact-service.ts`, `lib/contact-activity-types.ts`, `types/index.ts`  
Runtime: `app/contacts/*`, `app/farmers/*`, `app/outreach/page.tsx`, `app/inbox/page.tsx`

## Mental model

| UI surface | Route | Data source |
|------------|-------|-------------|
| Network / suppliers / contacts | `/contacts` | CRM `listContacts()` |
| Farmers / producers | `/farmers` | Same CRM API, filtered `contact_type === 'farmer'` |
| Campaigns / outreach | `/outreach` | Request campaigns API |
| Requests / inbox | `/inbox` | Inbox requests API |

## Contact statuses

`new`, `invited`, `engaged`, `submitted`, `inactive`, `blocked`

## Consent statuses

`unknown`, `granted`, `revoked`

## Contact activity types

Mirrors `CONTACT_ACTIVITY_TYPES` in `lib/contact-activity-types.ts` (aligned with backend `ContactType`).

## Farmer reachability (ADR-012 P1)

| Field | Rule |
|-------|------|
| Farmer `email` | Optional when `phone_only` is set and E.164 `phone` is present |
| Non-farmer `email` | Required |
| Duplicate guard | One farmer phone per tenant |
| UI | Add/edit wizard checkbox “No email — use phone only”; CSV import sets `phone_only` when farmer row has phone but no email |

Backend mirror: `tracebud-backend/src/contacts/crm-contact-reachability.ts` · migration TB-V16-063.

## Campaign statuses (backend-aligned)

`DRAFT`, `QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `EXPIRED`, `CANCELLED`

Outreach UI tabs collapse via `DASHBOARD_CAMPAIGN_TO_OUTREACH_UI`:

| Backend | UI tab |
|---------|--------|
| `DRAFT` | Draft |
| `QUEUED`, `RUNNING` | Sent |
| `COMPLETED`, `PARTIAL` | Completed |
| `EXPIRED`, `CANCELLED` | Archived |

## Inbox request statuses

`PENDING`, `RESPONDED` → UI `Pending`, `Fulfilled`

## Request types

`MISSING_PRODUCER_PROFILE`, `MISSING_PLOT_GEOMETRY`, `MISSING_LAND_TITLE`, `MISSING_HARVEST_RECORD`, `YIELD_EVIDENCE`, `CONSENT_GRANT`, `DDS_REFERENCE`, `GENERAL_EVIDENCE`, `OTHER`

## Network page permissions

| Route | Nav permission | Action gates |
|-------|----------------|--------------|
| `/contacts` | `contacts:view` | `contacts:create`, `contacts:edit` |
| `/farmers` | `farmers:view` | `farmers:create` |
| `/outreach` | `outreach:view` | `requests:create`, `requests:send`, `requests:archive` |
| `/programmes` | `outreach:view` | `requests:create`, `requests:send`, `requests:archive` |
| `/inbox` | `inbox:view` | `requests:respond` |

## Backend API parity

Dashboard tenant roles with network permissions must map to backend JWT roles allowed by `backendApiAccessRegistry.ts`:

| Backend entry | Dashboard permissions | Tenant roles |
|---------------|----------------------|--------------|
| `contacts_crm` | `contacts:view`, `contacts:create` | exporter, cooperative, importer, sponsor, country_reviewer |
| `requests_campaigns` | `requests:create`, `requests:send` | exporter, cooperative, importer, sponsor, country_reviewer |
| `inbox_requests` | `inbox:view`, `requests:respond` | all network roles (view); importer, sponsor, country_reviewer (respond) |

JWT mapping: `DASHBOARD_TENANT_BACKEND_JWT_ROLE` in registry (e.g. sponsor → `compliance_manager`).

Outreach table actions (send draft, archive) use `requests:send` and proxy to `/api/requests/campaigns/[id]/send|archive`.

## Analytics events

Campaign/inbox/contact slice events in `lib/observability/analytics.ts`:

- `dashboard_campaign_create_success` / `dashboard_campaign_create_failure`
- `dashboard_campaign_send_success` / `dashboard_campaign_send_failure`
- `dashboard_campaign_archive_success` / `dashboard_campaign_archive_failure`
- `dashboard_inbox_respond_success` / `dashboard_inbox_respond_failure`
- `dashboard_contact_status_changed` / `dashboard_contact_status_change_failure`
- `dashboard_contact_create_success` / `dashboard_contact_create_failure`

## When changing CRM/outreach UI

1. Update registry mirror + source types (`contact-service`, `types/index.ts`).
2. Use `mapCampaignStatusToOutreachUi` / `mapInboxStatusToUi` — do not duplicate mappers in pages.
3. Add `PermissionGate` for new privileged actions.
4. Run `cd apps/dashboard-product && npm run qa:structural`.
