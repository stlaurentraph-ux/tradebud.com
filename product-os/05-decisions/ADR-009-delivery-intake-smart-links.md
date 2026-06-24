# ADR-009: Delivery intake smart links and desk receive UX

**Status:** Accepted (2026-06-24)  
**Scope:** Field delivery receipts, buyer desk intake (cooperative / exporter), public QR resolution

## Context

Delivery receipts encode a voucher reference (`V-XXXXXXXX`) as a QR code. Today the QR payload is **plain text**, so phone cameras show a code without a next action. The dashboard **Receive delivery** panel supports paste/type only while copy promises “scan.” Buyers only discover directed deliveries by browsing; eligibility failures surface at claim time on the buyer desk, not on the farmer device.

Cooperatives intake **trips** (multi-plot deliveries) but must scan or paste one code per plot.

## Decision

### 1. Smart-link QR payload (layered)

| Layer | Payload | Consumer |
|-------|---------|----------|
| **QR encode** | `https://tracebud.com/d/{qrRef}` (override via `EXPO_PUBLIC_DELIVERY_QR_BASE_URL`) | Any camera / share sheet |
| **Public resolve** | `GET /v1/public/harvest/delivery-preview/{qrRef}` | Marketing `/d/[ref]`, unauthenticated preview |
| **Authenticated intake** | Dashboard `/harvests?claim={qrRef}` → auto-stage after claim | Signed-in cooperative / exporter |

Human-readable `V-…` remains visible on the receipt and works in the desk text field (backward compatible).

### 2. Public preview is summary-only

Public endpoint returns **non-sensitive** fields: kg, harvest date, plot label (name), plot compliance tier, intake eligibility, whether a buyer was pre-selected (boolean only), package linkage status. No farmer PII, geo, or tenant names.

### 3. Desk UX priority: inbox → scan → browse

On `/harvests#register-delivery`:

1. **Directed inbox** — vouchers with `intended_recipient_tenant_id = current tenant`, not yet staged
2. **Scan / paste** — camera (`BarcodeDetector` when available) + text field; parser accepts URL or raw code
3. **Browse** — existing searchable list (unchanged)

Claim semantics unchanged: consent + directed-recipient guard + `voucher_buyer_claims`.

### 4. Fail early on farmer device

Before recording delivery, assess plot compliance against buyer intake rules (`verified` / `deforestation_clear` / legacy `compliant`). Show advisory banner; do not block save (offline-first).

### 5. Explicit non-goals (Phase A)

- Trip-level single QR (multi-plot token) — Phase B in `FEAT-011`
- Handoff weight confirmation — Phase B
- Field-app buyer receive mode — out of scope
- Weakening consent or directed-recipient checks for faster scan

## Consequences

- Existing plain-text QRs remain valid via `parseDeliveryQrRef()`.
- Marketing hosts canonical short URL; dashboard hosts authenticated claim deep link.
- New analytics events on scan, claim, and auto-claim funnel (dashboard + field advisory).

## References

- `FEAT-011-delivery-intake-qr.md`
- `product-os/04-quality/cooperative-voucher-intake-qa.md`
- `tracebud-backend/src/harvest/voucher-delivery-routing.ts`
