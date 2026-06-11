# FEAT: Split shipment billing + monthly invoicing

**Status:** MVP implemented (metering + invoice rollups + subscription resolver + optional Stripe charge)

## Commercial model

- **€1** `SHIPMENT_FEE_ORIGIN_SEAL` — exporter/cooperative at shipment seal
- **€1** `SHIPMENT_FEE_DESTINATION_SUBMIT` — importer at DDS TRACES submit
- **Monthly invoice** — subscription + usage counts at calendar month end

Canonical spec: [TRACEBUD_PRICING_SPEC.md](../../TRACEBUD_PRICING_SPEC.md) §26.

## Data model

| Table | Role |
| --- | --- |
| `billing_usage_meters` | Idempotent per-leg usage rows (`METERED` → `INVOICED`) |
| `billing_invoices` | Monthly rollup per tenant |
| `shipment_billing_legs` | Links `shipment_header` ↔ meter ↔ billing tenant |
| `shipment_headers` | Canonical export shipment (seal triggers origin meter) |
| `shipment_header_packages` | Batches included in shipment |

Migrations: `tb_v16_035_billing_usage_metering.sql`, `tb_v16_036_shipment_headers.sql`, `tb_v16_039_tenant_billing_subscription.sql`.

## API

- `GET /v1/billing/events`, `GET /v1/billing/usage-summary`, `GET /v1/billing/subscription-band`
- `POST /v1/billing/usage-meters/origin-seal`, `POST /v1/billing/usage-meters/destination-submit`
- `POST /v1/billing/invoices/finalize`, `POST /v1/billing/invoices/finalize-period`
- `POST /v1/billing/invoices/finalize-period-cron` (scheduler token; previous month)
- `POST /v1/billing/stripe/webhook` (`invoice.paid`, `invoice.payment_failed`)
- `GET/POST /v1/shipment-headers`, `POST /v1/shipment-headers/:id/seal`

## Dashboard

- Settings → **Billing** tab (`BillingUsagePanel`)
- Shipment create → canonical `shipment_headers` record
- Shipment seal → backend seal + origin meter
- Importer package submit → destination meter (requires sealed shipment link)

## Gates

- Failed prior invoice blocks new seal (origin) or DDS submit (destination)
- Weight guardrail must pass before seal/create

## Adoption promise (new orgs)

- **3 months** subscription-free (`subscription_free_until`) — only while no free shipment leg was redeemed
- **First origin seal** waived (€0 meter, `ADOPTION_FIRST_ORIGIN_SEAL`)
- **First destination DDS submit** waived (`ADOPTION_FIRST_DESTINATION_SUBMIT`)
- **Mutual exclusivity:** first waived leg sets `subscription_promo_forfeited_at` and caps `subscription_free_until` to end of waiver month; subscription billing starts next calendar month
- Platform trial extended to **90 days** (`tenant_trial_state`)

Migration: `tb_v16_037_tenant_billing_adoption_promo.sql`, `tb_v16_038_adoption_promo_forfeit.sql`

## Subscription resolution

- `tenant_billing_subscription` stores band + bundle/modules (MVP default: Compliance Starter @ Starter band)
- `BillingSubscriptionResolverService` maps `TRACEBUD_PRICING_SPEC.md` tables to `subscription_amount_eur`
- `BillingManagedContactsService` counts managed CRM contacts (`new`, `invited`, `engaged`, `submitted`)
- `BillingSubscriptionBandService` exposes contracted vs required band + green/amber/red/enterprise zones
- Dashboard: Settings → Billing band card; amber/red banners on Contacts + Billing
- Phase 2: `POST /v1/billing/accept-band-upgrade` + contact create/status gates; consent modal in dashboard
- Month-end finalize includes tenants with usage **or** active trial/paid lifecycle **or** subscription billing enabled

## Stripe (optional — **deferred activation**)

Implementation is in-repo; **production env vars are intentionally unset until paid invoicing is needed.** Tracker: `product-os/06-status/current-focus.md` → *Deferred — billing production activation*.

When enabled:

- When `STRIPE_SECRET_KEY` and `tenant_billing_subscription.stripe_customer_id` are set, finalize creates Stripe invoice line items and finalizes the invoice
- `POST /v1/billing/stripe/webhook` reconciles `invoice.paid` → `billing_invoices.invoice_status = PAID` and `invoice.payment_failed` → `FAILED` (blocks new seal/submit via billing gate)
- Configure `STRIPE_WEBHOOK_SECRET`; endpoint `https://api.tracebud.com/api/v1/billing/stripe/webhook`
- Month-end cron: `npm run billing:finalize-period-cron` (`TRACEBUD_API_BASE` + `BILLING_SCHEDULER_TOKEN`) — see `DEPLOY_PRODUCTION.md` §2d

## Pending (Release 2+)

- Dunning automation beyond FAILED gate
- Sponsor leg coverage policy UI
