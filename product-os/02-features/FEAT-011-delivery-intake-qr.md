# FEAT-011: Delivery intake smart links and desk receive UX

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md` — harvest vouchers, lineage
- `ADR-009-delivery-intake-smart-links.md`
- `ADR-010-network-invite-orchestration.md`
- `FEAT-002-mobile-field-capture.md` — delivery receipts
- `product-os/04-quality/cooperative-voucher-intake-qa.md`

## Goal

Make delivery receipt QRs actionable for buyers (one-tap preview → register) and faster at the cooperative desk, while warning farmers when a plot may not be registrable.

## Users affected

| Role | Change |
|------|--------|
| Farmer (field) | Smart-link QR; pre-submit intake advisory |
| Cooperative / exporter (dashboard) | Directed inbox, camera scan, `?claim=` deep link |
| Public (camera scan) | Marketing preview page at `/d/{qrRef}` |

## Scope — Phase A (this slice)

- Public delivery preview API + marketing page
- Field QR encodes smart URL; share message includes link
- Dashboard: parse URL or code, camera scan dialog, directed inbox, `?claim=` auto-stage
- Field: `assessDeliveryBuyerIntakeEligibility` advisory before submit
- Analytics + tests + registry updates

## Non-goals (Phase A)

- Trip token (`/t/{tripId}`) for multi-plot
- Received-weight confirmation at handoff
- ERP webhooks on claim

## Permissions

- Public preview: no auth; rate-limit at edge (future)
- Claim: existing `DASHBOARD_HARVEST_ROLES` + consent + directed-recipient guard
- Farmer submit: unchanged field actor scope

## State transitions

Unchanged voucher lifecycle. New side effect: `voucher_buyer_claims` on desk claim (existing). Public preview is read-only.

## Exception handling

| Failure | UX |
|---------|-----|
| Unknown QR | Public 404; desk toast `qr_not_found` |
| CONSENT_REQUIRED | Desk toast with consent copy |
| Wrong directed buyer | Desk toast; farmer directed to re-issue |
| Plot ineligible | Desk `ineligible_toast`; field advisory before submit |
| Camera unavailable | Desk falls back to paste/type |

## Analytics events

| Event | Surface |
|-------|---------|
| `delivery_qr_preview_viewed` | Marketing `/d/[ref]` |
| `delivery_desk_scan_started` | Dashboard scanner open |
| `delivery_desk_scan_success` | Dashboard scan decode |
| `delivery_desk_claim_success` | Dashboard stage after lookup/claim |
| `delivery_desk_claim_failure` | Dashboard claim error |
| `delivery_desk_auto_claim` | Dashboard `?claim=` handled |
| `delivery_intake_advisory_shown` | Field pre-submit warning |

## Acceptance criteria — Phase A

- [ ] Farmer receipt QR encodes `https://tracebud.com/d/V-…` (or env override); plain code still shown
- [ ] Opening `/d/{ref}` without auth shows kg, plot name, eligibility badge, CTA to dashboard sign-in
- [ ] Signed-in cooperative pastes full URL or raw code → voucher stages
- [ ] Camera scan on supported browser decodes smart link and stages voucher
- [ ] Directed deliveries appear in inbox section without scan
- [ ] `/harvests?claim=V-…` auto-stages when eligible
- [ ] Farmer sees advisory when plot status is not buyer-intake-ready
- [ ] Unit tests: QR parser, preview service, panel inbox/claim
- [ ] `cooperative-voucher-intake-qa.md` critical path still passes

## Phase B

- Trip token for multi-plot delivery (`/t/{tripId}`) — **shipped 2026-06-24**
- Show buyer full-screen QR — **shipped 2026-06-24**
- Handoff confirmation (received kg + desk note; audit `delivery_handoff_confirmed`) — **shipped 2026-06-24**
- Marketing → signup/login → auto-claim (`?claim=` persisted through onboarding) — **shipped 2026-06-24**
- Bulk scan mode + ZXing fallback when `BarcodeDetector` unavailable — **shipped 2026-06-24**

## Phase C (desk intake polish)

- Collapsed desk scan row (primary Scan QR + paste/add secondary) — **shipped 2026-06-24**
- Scanner viewfinder, success flash, duplicate debounce, bulk toggle inside dialog — **shipped 2026-06-24**
- Handoff variance warning + receipt summary card — **shipped 2026-06-24**
- Marketing/dashboard public preview: status badge, 3-step explainer, trip line chips — **shipped 2026-06-24**
- Auto-claim banner on desk when `?claim=` present — **shipped 2026-06-24**

## Phase D (hardening + field/desk completeness)

- Dashboard `/t/[ref]` trip preview + proxy API — **shipped 2026-06-24**
- Marketing preview read-only QR image — **shipped 2026-06-24**
- Desk coach marks (dismissible) — **shipped 2026-06-24**
- Handoff optional photo (SHA-256 audit metadata only) — **shipped 2026-06-24**
- Field intake advisory warning icon + show-buyer brightness hint — **shipped 2026-06-24**
- Public delivery preview rate limit (45 req/min/IP) — **shipped 2026-06-24**
- Backend `plot-capture-quality-policy` module (package readiness) — **shipped 2026-06-24**

## Dependencies

- `TRACEBUD_BACKEND_URL` on marketing + dashboard
- `EXPO_PUBLIC_DELIVERY_QR_BASE_URL` on field (default `https://tracebud.com/d`)

## Tests

- `delivery-intake-qr.test.ts` (dashboard parser)
- `harvest.service.spec.ts` (preview)
- `harvest-receive-delivery-panel.test.tsx` (inbox + claim param)
- `delivery-intake-redirect.test.ts` (signup auto-claim redirect)
- `assessDeliveryBuyerIntakeEligibility.test.ts` (field)
