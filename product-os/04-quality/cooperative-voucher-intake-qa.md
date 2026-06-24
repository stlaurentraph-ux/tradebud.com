# Cooperative voucher-first intake QA

Last updated: 2026-06-24  
Related: dashboard cooperative harvest slice (`/harvests#receive-delivery`), mobile multi-plot delivery (`apps/offline-product`), `FEAT-011-delivery-intake-qr.md`

## Purpose

Manual acceptance for **cooperative desk voucher intake** and **member mobile delivery → cooperative batch assembly** on a real tenant (staging preferred).

## Preconditions

- Cooperative tenant with `cooperative` active role (not demo fixtures unless labeled)
- Backend reachable (`TRACEBUD_BACKEND_URL` on dashboard + marketing; mobile `EXPO_PUBLIC_API_URL`)
- At least one member with **synced plot** and ability to record harvest in field app
- Desk user **without** `integrated_harvest_capture` unless testing legacy desk batch path
- Marketing smart links resolve: `https://tracebud.com/d/V-…` and `https://tracebud.com/t/T-…`

## Automated gates (run before staging)

From repo root:

```bash
cd apps/dashboard-product && npm test -- \
  lib/harvest-capture-policy.test.ts \
  lib/harvest-package-scope.test.ts \
  components/plots/plot-detail-history-page-content.test.tsx \
  lib/delivery-intake-qr.test.ts \
  components/harvest/harvest-receive-delivery-panel.test.tsx

cd apps/marketing && npm run e2e:golden-paths:assert
```

Expected: all targeted tests green.

## Critical path ★

### 1. Mobile member → vouchers (source of truth)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1.1 | Member signs in on field app, opens **Record delivery** | Plot list shows backed-up plots with capacity |
| 1.2 | Record single-plot delivery | Voucher QR encodes `tracebud.com/d/V-…`; plain code still visible; intake advisory if plot not buyer-ready |
| 1.3 | **Multi-plot delivery trip** — add 2+ plots with weights | Trip QR `tracebud.com/t/T-…`; each line has voucher QR; caps enforced per plot |
| 1.4 | **Show buyer** full-screen QR sheet | Buyer can scan from phone screen in bright conditions |
| 1.5 | Share voucher / trip code with cooperative desk | Codes searchable / scannable at desk |

### 2. Cooperative receive delivery (primary desk UI)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 2.1 | Sign in as cooperative → `/harvests` | **Receive delivery** panel visible; collapsed scan row (Scan QR primary) |
| 2.2 | **Camera scan** smart link or raw code | Voucher stages; success flash; duplicate scan debounced |
| 2.2b | **Bulk scan** mode (toggle in scanner) | Multiple vouchers stage without closing dialog |
| 2.2c | Paste full URL `tracebud.com/d/V-…` or trip `T-…` | Parser extracts ref; trip claims all lines |
| 2.2d | Open directed inbox (no scan) | Vouchers directed to cooperative appear under **Directed to you** |
| 2.3 | **Handoff confirm** (kg + optional note/photo) | Audit `delivery_handoff_confirmed`; variance warning when kg differs |
| 2.4 | Search by plot / member name | Eligible vouchers list filters correctly |
| 2.5 | Stage 2+ vouchers → **Assemble batch** | Navigates to `/packages/new?voucherIds=...` with vouchers pre-selected |
| 2.6 | Create package | Package ties to staged voucher plot lineage |

### 3. Smart-link funnel (marketing → desk)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 3.1 | Open `/d/V-…` on marketing (no auth) | kg, plot name, status badge, register CTA |
| 3.2 | Tap **Create workspace** | Lands on `/create-account?claim=V-…`; after signup → `/harvests?claim=` auto-stages |
| 3.3 | Signed-out user taps **Sign in** from `/d/` | `/login?next=/harvests?claim=` preserves claim |
| 3.4 | Open `/t/T-…` on marketing | Trip summary + line chips; register trip CTA |

### 4. Desk batch gate (negative test)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 4.1 | Cooperative **without** integrated capture → `/harvests/new` | Redirect or gate — desk cannot type batch weights |
| 4.2 | Enable **integrated harvest capture** in Settings → save | `/harvests/new` becomes available |
| 4.3 | Disable flag again | Desk batch path gated again |

### 5. Navigation & onboarding

| Step | Action | Pass criteria |
|------|--------|---------------|
| 5.1 | Cooperative home dashboard | Primary CTA → `/harvests#receive-delivery` (not `/harvests/new`) |
| 5.2 | Onboarding checklist cooperative step | CTA matches receive-delivery path |

## Regression smoke (5 min)

- [ ] Exporter tenant still voucher-first on `/harvests` (no default desk batch)
- [ ] Plot detail `/plots/[id]` does not load geometry history API until `/plots/[id]/history`
- [ ] Package create rejects ineligible / already-packaged vouchers
- [ ] Public preview rate limit returns 429 after burst (optional load test)

## Staging execution notes

1. Set `DASHBOARD_BASE_URL` to staging dashboard (e.g. `https://dashboard-staging.tracebud.com` per launch smoke scripts).
2. Use a cooperative test tenant with known member farmers and synced plots.
3. Record voucher QR refs from mobile step 1.3 for desk scan in step 2.2.
4. Capture screenshots of staged vouchers + assembled package lineage summary.
5. Verify marketing analytics: `delivery_qr_preview_viewed` and `marketing_cta_clicked` on preview CTAs (cookie consent accepted).

## Sign-off

| Field | Value |
|-------|-------|
| Tenant ID | |
| Staging URL | |
| Tester | |
| Date | |
| Result | Pass / Fail |
| Notes | |

When all ★ rows pass, log result in `product-os/06-status/daily-log.md` and check cooperative harvest intake in `dashboard-a-plus-scorecard.md` if applicable.
