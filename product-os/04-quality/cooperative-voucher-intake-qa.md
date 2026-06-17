# Cooperative voucher-first intake QA

Last updated: 2026-06-17  
Related: dashboard cooperative harvest slice (`/harvests#receive-delivery`), mobile multi-plot delivery (`apps/offline-product`)

## Purpose

Manual acceptance for **cooperative desk voucher intake** and **member mobile delivery → cooperative batch assembly** on a real tenant (staging preferred).

## Preconditions

- Cooperative tenant with `cooperative` active role (not demo fixtures unless labeled)
- Backend reachable (`TRACEBUD_BACKEND_URL` on dashboard; mobile `EXPO_PUBLIC_API_URL`)
- At least one member with **synced plot** and ability to record harvest in field app
- Desk user **without** `integrated_harvest_capture` unless testing legacy desk batch path

## Automated gates (run before staging)

From repo root:

```bash
cd apps/dashboard-product && npm test -- \
  lib/harvest-capture-policy.test.ts \
  lib/harvest-package-scope.test.ts \
  components/plots/plot-detail-history-page-content.test.tsx
```

Expected: all targeted tests green.

## Critical path ★

### 1. Mobile member → vouchers (source of truth)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1.1 | Member signs in on field app, opens **Record delivery** | Plot list shows backed-up plots with capacity |
| 1.2 | Record single-plot delivery | Voucher QR/code generated; yield cap enforced per plot |
| 1.3 | **Multi-plot delivery trip** — add 2+ plots with weights | Each line gets its own voucher QR; caps enforced per plot |
| 1.4 | Share voucher code(s) with cooperative desk | Codes searchable / scannable at desk |

### 2. Cooperative receive delivery (primary desk UI)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 2.1 | Sign in as cooperative → `/harvests` | **Receive delivery** panel visible; **Add batch input** hidden or outline-only |
| 2.2 | Paste / scan member voucher QR | Voucher stages; plot-linked weight shown |
| 2.3 | Search by plot / member name | Eligible vouchers list filters correctly |
| 2.4 | Stage 2+ vouchers → **Assemble batch** | Navigates to `/packages/new?voucherIds=...` with vouchers pre-selected |
| 2.5 | Create package | Package ties to staged voucher plot lineage |

### 3. Desk batch gate (negative test)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 3.1 | Cooperative **without** integrated capture → `/harvests/new` | Redirect or gate — desk cannot type batch weights |
| 3.2 | Enable **integrated harvest capture** in Settings → save | `/harvests/new` becomes available |
| 3.3 | Disable flag again | Desk batch path gated again |

### 4. Navigation & onboarding

| Step | Action | Pass criteria |
|------|--------|---------------|
| 4.1 | Cooperative home dashboard | Primary CTA → `/harvests#receive-delivery` (not `/harvests/new`) |
| 4.2 | Onboarding checklist cooperative step | CTA matches receive-delivery path |

## Regression smoke (5 min)

- [ ] Exporter tenant still voucher-first on `/harvests` (no default desk batch)
- [ ] Plot detail `/plots/[id]` does not load geometry history API until `/plots/[id]/history`
- [ ] Package create rejects ineligible / already-packaged vouchers

## Staging execution notes

1. Set `DASHBOARD_BASE_URL` to staging dashboard (e.g. `https://dashboard-staging.tracebud.com` per launch smoke scripts).
2. Use a cooperative test tenant with known member farmers and synced plots.
3. Record voucher QR refs from mobile step 1.3 for desk scan in step 2.2.
4. Capture screenshots of staged vouchers + assembled package lineage summary.

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
