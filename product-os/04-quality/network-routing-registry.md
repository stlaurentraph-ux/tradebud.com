# Network routing registry (field app ↔ dashboard)

Cross-surface handoffs where contact email or tenant id must land on the correct workspace or field producer.

**Code mirror:** `tracebud-backend/src/network/networkRoutingRegistry.ts`  
**Email resolver:** `tracebud-backend/src/network/email-to-tenant-resolution.ts`  
**CI guard:** `backend-network-routing-guard.mjs` (bundled in `npm run qa:structural`)

## Email → tenant resolution (shared)

Both **farmer delivery routing** and **campaign inbox fan-out** use the same resolver:

| Source table | When used |
|--------------|-----------|
| `tenant_signup_contacts` | Primary lookup for workspace signup emails |
| `admin_users` | Fallback for invited operators not yet in signup contacts |

Module: `resolveTenantIdsByEmails` / `resolveTenantIdForContactEmail`.

## Flows

### `field_delivery_to_buyer_tenant`

Farmer records harvest with buyer picker, email, or QR-only.

| Step | Surface | Requirement |
|------|---------|-------------|
| 1 | Field app `DeliveryRecipientFields` | Active `consent_grants` for buyer tenant |
| 2 | Backend `resolveVoucherDeliveryRecipient` | Email → tenant via shared resolver |
| 3 | Backend harvest create | Sets `voucher.intended_recipient_tenant_id` |
| 4 | Buyer dashboard vouchers | Farmer in tenant scope **and** intended recipient match |

**Tenant farmer scope** (`resolveFarmerIdsForTenant`) includes farmers with **active consent** even when not yet in CRM contacts.

**Integration test:** `src/network/network-routing-delivery.int.spec.ts`

### `dashboard_consent_to_field_app`

Organisation requests data access from `/farmers/[id]`.

| Step | Surface | Requirement |
|------|---------|-------------|
| 1 | Dashboard | `POST /v1/farmers/:id/consent-requests` |
| 2 | Backend | `consent_grants` row `pending` + optional Expo push |
| 3 | Field app `/data-sharing` | Farmer approve/deny/revoke (offline queue supported) |

**Integration test:** `src/consent/consent-lineage-revoke.int.spec.ts`

### `dashboard_campaign_inbox_fanout`

Bulk outreach from importer/exporter/cooperative to contact emails.

| Step | Surface | Requirement |
|------|---------|-------------|
| 1 | Dashboard send campaign | `POST /v1/requests/campaigns/:id/send` |
| 2 | Backend inbox fan-out | Email → tenant; skip self-tenant and unresolved |
| 3 | Recipient dashboard `/inbox` | `inbox_requests` row per distinct recipient tenant |

**Note:** Field producers without a workspace tenant receive campaign **email/CTA only** — not dashboard inbox rows.

## Guards

- `backend-network-routing-guard.mjs` — resolver wired in delivery + inbox; consent in tenant scope; registry modules exist
- `voucher-delivery-routing.spec.ts` — unit tests for consent gate + email resolution
- `test:integration:network-routing` — consent → delivery → buyer voucher list

## When changing routing

1. Update resolver, registry mirror, and this doc together.
2. Extend integration test if preconditions change.
3. Run `cd tracebud-backend && npm run qa:structural`.
