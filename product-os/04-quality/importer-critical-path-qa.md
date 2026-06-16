# Importer critical-path QA

Last updated: 2026-06-16  
Scorecard ref: `product-os/04-quality/dashboard-a-plus-scorecard.md` (Importer section)

## Purpose

Manual acceptance for importer **A+** critical path on a **real tenant**. Complements code gates (north-star inbox priority, inbox fulfillment copy, mini review queue).

## Preconditions

- Importer or `compliance_manager` active role
- Backend reachable; contacts and inbox API available
- Non-virgin workspace preferred for campaign + fulfillment path

## Critical path ★

### 1. Contact → campaign → fulfill request

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1.1 | Add contact (`/contacts`) | Contact saved with supply-chain role + country |
| 1.2 | Launch campaign (`/outreach?new=1`) | Draft campaign created with targets |
| 1.3 | Send campaign | Status moves from draft; recipients targeted |
| 1.4 | Inbound request appears (`/inbox`) | Pending request visible with due date |
| 1.5 | Fulfill via dialog | Notes/plots/evidence attach; request marked fulfilled |

### 2. Shared shipment readiness before declaration ★

| Step | Action | Pass criteria |
|------|--------|---------------|
| 2.1 | Open shared shipment (`/packages`, shared scope) | Importer sees upstream sealed/shared shipments |
| 2.2 | Package detail preflight | TRACES filing blockers title (not exporter handoff wording) |
| 2.3 | Compliance queue (`/compliance`) | Declaration checks framed for importer role |
| 2.4 | North star with `READY`/`ON_HOLD` | **Awaiting your review** when no pending inbox |

### 3. Overview attention

| Step | Action | Pass criteria |
|------|--------|---------------|
| 3.1 | `incoming_requests_pending > 0` | North-star shows **Inbound requests pending**; CTA → `/inbox` |
| 3.2 | Upstream blockers in summary | Attention strip shows upstream blocker card (if applicable) |
| 3.3 | Mini review queue | Shared shipments needing review listed below north star |

### 4. Reporting from overview

| Step | Action | Pass criteria |
|------|--------|---------------|
| 4.1 | Navigate to `/reports` from nav or quick action | Reporting page loads with tenant snapshot |
| 4.2 | Overview quick actions (virgin/mature) | Reporting destination reachable in ≤3 clicks from home |

## Regression smoke (5 min)

- [ ] Virgin importer shows virgin-state panel + add-contact CTA
- [ ] Inbox fulfillment dialog strings use locale helpers (English fallbacks OK)
- [ ] Exporter-only language (seal/handoff) not shown on importer package submit CTA

## Sign-off

| Field | Value |
|-------|-------|
| Tenant ID | |
| Tester | |
| Date | |
| Result | Pass / Fail |
| Notes | |

When all ★ rows pass, update importer **Overview ★** to `2` and check critical-path boxes in `dashboard-a-plus-scorecard.md`.
