# Tracebud Pricing Specification

**Status:** Canonical commercial pricing for Dashboard modules and usage fees  
**Currency:** EUR  
**Supersedes:** Single €2.00 shipment fee charged to one actor; legacy Tier 2/3 persona-band tables in `REQUIREMENTS.md` §XI  
**Related:** [TRACEBUD_DEFINITION_JUNE_2026.md](./TRACEBUD_DEFINITION_JUNE_2026.md) (modular solutions), [TRACEBUD_V1_2_EUDR_SPEC.md](./TRACEBUD_V1_2_EUDR_SPEC.md) §26 (billing events)

---

## Model overview

Dashboard pricing is **modular subscription + metered usage, invoiced monthly**:

1. **Monthly subscription** — select standalone modules or discounted bundles at a **Starter**, **Growth**, or **Scale** band.
2. **Split shipment usage** — **€1.00** when the **origin** actor seals an export shipment; **€1.00** when the **destination** actor submits the linked DDS to TRACES. Total **€2.00** per completed cross-border compliance workflow, shared across supply-chain actors.
3. **Monthly invoice** — at **calendar month end**, each customer is charged **subscription + usage** for that period (count of origin seals and destination DDS submissions metered during the month). Usage is **not** charged per card tap at seal/submit time in MVP; events are metered immediately and settled on the monthly invoice.
4. **Marketplace** — always separate: **2.5%** transaction fee on direct-trade marketplace volume (not included in any bundle).

**Field App (Tier 1 — farmers & micro-producers):** free forever. No Dashboard module subscription or shipment fees on farmer wallet capture.

**Network sponsors (Tier 4):** custom sponsorship; may cover member-org module subscriptions and/or one or both shipment usage legs per sponsor policy.

---

## Subscription bands (by managed contacts per org)

Band selection is driven by the number of **managed users/contacts** in the organisation’s tenant — producers, farmers, suppliers, or other roster contacts the org actively manages for traceability (not internal staff seats).

| Band | Managed contacts (inclusive) | Monthly module/bundle price column |
| --- | --- | --- |
| **Starter** | 1–50 | Starter column |
| **Growth** | 51–500 | Growth column |
| **Scale** | 501–3,000 | Scale column |
| **Enterprise** | 3,001+ | Custom quote — sales-led pricing |

**Band rules:**

- Count is evaluated at **organisation** scope (one tenant), across all commodities and modules.
- Crossing an upper bound requires **upgrade** to the next band (or Enterprise sales) before adding contacts above the limit.
- Dashboard users must **accept the band upgrade** (consent modal) before adding contacts above their current limit; subscription price changes apply from the **next calendar month**, while contact headroom expands immediately after acceptance.
- Module and bundle **EUR amounts** in the tables below apply to Starter / Growth / Scale only; Enterprise is negotiated per contract.
- Downgrade review may apply when managed contact count sustainably drops below the current band floor (billing policy config).

**Engineering reference:** `billing_subtier` on `organisations` must reflect the active band; contact count source is defined in `TRACEBUD_V1_2_EUDR_SPEC.md` §3.2.

---

## Standalone modules (EUR / month)

| Module | Starter | Growth | Scale | Maps to solution |
| --- | ---: | ---: | ---: | --- |
| **Foundation** | 10 | 15 | 20 | Dashboard core — tenant, roles, collaboration, exports |
| **EUDR** | 20 | 30 | 50 | `/solutions/eudr-compliance` |
| **ESG Carbon** | 10 | 20 | 30 | `/solutions/esg-carbon-reporting` |
| **Regenerative Ag** | 10 | 15 | 20 | `/solutions/regenerative-agriculture` |
| **Child Labor** | 10 | 15 | 25 | `/solutions/child-labor-monitoring` |
| **Open Chain** | 20 | 40 | 70 | `/solutions/open-chain-model` |

Modules are toggleable per organisation. **Foundation** is required for any paid Dashboard subscription. Field App remains free for producers.

---

## Bundles (EUR / month)

Bundles are priced below the sum of included standalone modules.

| Bundle | Includes | Starter | Growth | Scale |
| --- | --- | ---: | ---: | ---: |
| **Compliance Starter** | Foundation + EUDR | 19 | 49 | 99 |
| **Climate Starter** | Foundation + ESG Carbon | 15 | 25 | 45 |
| **Sustainability Bundle** | Foundation + ESG Carbon + Regenerative Ag | 20 | 35 | 60 |
| **Due Diligence Bundle** | Foundation + EUDR + Child Labor | 30 | 50 | 85 |
| **Open Chain Bundle** | Foundation + EUDR + ESG Carbon + Open Chain | 50 | 85 | 150 |

An organisation holds either individual module entitlements or one bundle entitlement — not double-billed for overlapping modules.

---

## Usage fees — split shipment compliance (EUR / event, invoiced monthly)

| Leg | Event | Amount | Who meters | When metered |
| --- | --- | ---: | --- | --- |
| **Origin** | `SHIPMENT_FEE_ORIGIN_SEAL` | **€1.00** | Exporter or cooperative tenant that **seals** the export `shipment_header` | Successful seal transition |
| **Destination** | `SHIPMENT_FEE_DESTINATION_SUBMIT` | **€1.00** | Importer tenant that **submits** the linked DDS to TRACES | Successful `dds_records` submit transition |

**Total per completed workflow:** **€2.00** across both legs (€1 + €1), unless sponsor coverage or waiver applies to one or both legs.

**Idempotency:** one meter per leg per `shipment_header` (`{shipment_header_id}:origin_seal`, `{shipment_header_id}:destination_submit`). Retries and duplicate seal/submit attempts must not double-meter.

**Who pays:** the **billing owner** tenant for the actor that triggered the metered event, unless **Tier 4 sponsor coverage** explicitly covers that leg for that network relationship.

**Vertically integrated org (same tenant is origin and destination):** both legs meter to the same customer (€1 + €1 = €2 on the monthly invoice).

**Off-platform counterparty:** only the on-platform leg is metered; the other leg is `WAIVED` or `EXTERNAL` per policy.

**What the €2 covers (combined):** DDS packaging, satellite/deforestation checks, yield-cap validation, TRACES NT submission path, pre-flight checks, and **5-year audit retention** for that shipment — cost-shared between origin and destination actors.

---

## Monthly billing cycle

| Component | When assessed | When charged |
| --- | --- | --- |
| **Module / bundle subscription** | Active entitlements during the calendar month | End of month (same invoice) |
| **Origin seal usage** | Count of `SHIPMENT_FEE_ORIGIN_SEAL` meters in the month | End of month: `count × €1.00` |
| **Destination submit usage** | Count of `SHIPMENT_FEE_DESTINATION_SUBMIT` meters in the month | End of month: `count × €1.00` |

**Invoice formula (per tenant, per month):**

```text
total = subscription_eur
      + (origin_seal_count × 1.00)
      + (destination_submit_count × 1.00)
      + marketplace_fees_eur   -- if applicable, separate line
```

**Operational rules:**

- Usage meters are recorded **at seal/submit time** (immediate audit trail).
- Card charge runs on **month-end invoice finalization** (Stripe subscription + usage line items).
- Failed month-end payment blocks **new** seals (origin) or **new** DDS submissions (destination) per leg, but does not remove historical compliance records.
- Credits (if enabled) apply to the monthly invoice before card charge.

**Adoption promise (new Dashboard orgs):**

| Benefit | Duration / limit | Billing effect |
| --- | --- | --- |
| **Subscription free** | First **3 calendar months** from org adoption start — **only if no free shipment was redeemed** | `subscription_amount_eur = 0` on month-end invoices while `subscription_free_until` is active |
| **First origin seal free** | Once per tenant | First `SHIPMENT_FEE_ORIGIN_SEAL` meter recorded as **€0 WAIVED** |
| **First destination submit free** | Once per tenant | First `SHIPMENT_FEE_DESTINATION_SUBMIT` meter recorded as **€0 WAIVED** |

**Mutual exclusivity (important):** redeeming a **free first shipment** leg (origin seal and/or destination submit) **ends the 3-month subscription-free window** at the **end of that calendar month**. Subscription billing then starts on the **first day of the following month**.

Example: org joins in **September**, seals first shipment in **September** → September month-end invoice has **€0 subscription** and **€0 first seal**; **October** month-end invoice is the first billable subscription month (no remaining 3-month free).

Orgs that never redeem a free shipment leg keep the full **3-month subscription-free** window.

Promo rows live in `tenant_billing_adoption_promo` (`subscription_promo_forfeited_at` set on first free shipment). Waived meters remain auditable but are excluded from billable usage totals. Platform trial access aligns to **90 days** (`tenant_trial_state`).

**Free sub-tier soft cap (post-promo):** 5 **origin seals** and 5 **destination submissions** per rolling 12 months per tenant (independent counters). Exceeding prompts upgrade or sponsor outreach.

---

## Marketplace (separate)

| Fee | Amount |
| --- | --- |
| Direct trade marketplace | **2.5%** transaction fee on settled marketplace volume |

Not included in any module or bundle. Requires separate marketplace enablement. Settled marketplace fees may appear on the same monthly invoice as a separate line.

---

## Billing implementation notes

- **Stripe:** one Product per module/bundle; one Price per band (Starter/Growth/Scale) per month. Usage: metered events aggregated monthly — two usage prices at **€1.00** (`origin_seal`, `destination_submit`) or one meter with `leg` dimension.
- **Tables:** `billing_usage_meters`, `billing_invoices`, `shipment_billing_legs` (see `TRACEBUD_V1_2_EUDR_SPEC.md` §26).
- **Legacy aliases:** `SHIPMENT_FEE_T2` → origin seal €1.00; `SHIPMENT_FEE_T3` → destination submit €1.00; deprecated unified `SHIPMENT_FEE` at €2.00 maps to **both** legs for migration reconciliation only.
- MVP may ship subset of modules (EUDR + Foundation first); unpublished modules must not be sold without `MVP_PRD.md` sign-off.
- Marketing `/pricing` and in-app checkout must match this document before public launch of modular billing.

---

## Related documents

| Doc | Role |
| --- | --- |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Strategic pricing summary |
| [TRACEBUD_V1_2_EUDR_SPEC.md](./TRACEBUD_V1_2_EUDR_SPEC.md) | Normative billing events and invariants |
| [MVP_PRD.md](./MVP_PRD.md) | Which modules bill in v1 |
