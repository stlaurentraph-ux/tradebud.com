# Tenure land-title device QA (golden path)

Validates wrong-document UX + supersede lifecycle on **production API** (`5d1b31d+`).

## 0. Setup (dedicated terminal)

```bash
cd "/Users/raphaelstl/Downloads/Tracebud website/apps/offline-product"
git branch --show-current   # must be feature/offline-tenure
npm run dev:metro:production
```

Open the app on your iPhone from the Metro QR / dev client. Confirm API health:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.tracebud.com/api/health
```

Expected: `200`

## 1. Sign in

- Google sign-in as the Carl kjelsens test farmer
- Plot on server: `686b9ff6-acf7-40ff-9bb0-2d96f060bb78` (or your linked plot)
- Prod DB should show **one** active `plot_tenure_verification` row after prior cleanup

## 2. Golden path A — wrong photo

| Step | You do | Pass if |
|------|--------|---------|
| A1 | Plot detail → **Upload proof** → pick a **selfie or landscape** (not a land paper) | Thumbnail appears locally |
| A2 | Settings → **Sync now** | Upload completes; no 429 burst |
| A3 | Return to plot detail; wait for AI check (~30s, polls every 8s) | Badge **FAILED** or re-upload state |
| A4 | Read the reason box | Says **Upload correct land paper** — **not** “Tap Sync Now” |
| A5 | Tap **Upload correct land paper** (`plot-tenure-replace-land-paper`) | Picker opens |
| A6 | Exporter dashboard / compliance queue | **No** new open alert for wrong document |

## 3. Golden path B — replace with correct doc

| Step | You do | Pass if |
|------|--------|---------|
| B1 | Replace with a readable land title / cadastral photo | Thumbnail updates |
| B2 | **Sync now** again | Parse runs |
| B3 | Plot detail tenure section | Status moves off FAILED (COMPLETED or MANUAL_REQUIRED) |
| B4 | Supabase query (optional) | Only **one** non-superseded row for the plot |

```sql
SELECT COUNT(*)::int AS active
FROM public.plot_tenure_verification
WHERE plot_id = '686b9ff6-acf7-40ff-9bb0-2d96f060bb78'
  AND NOT COALESCE((parse_result->>'superseded')::boolean, false);
```

Expected: `1`

## 4. Golden path C — re-sync idempotency

| Step | You do | Pass if |
|------|--------|---------|
| C1 | **Sync now** again (no photo change) | No new verification rows |
| C2 | Supabase active count | Still `1` |

## 5. Automated helpers (simulator)

```bash
cd "/Users/raphaelstl/Downloads/Tracebud website/apps/offline-product"
npm run qa:preflight
npm run test -- plotTenureVerificationReview
npm run test:maestro:land-title   # navigation smoke; photo picker is manual on device
```

## Sign-off

| Tester | Device | Build | Date | A | B | C |
|--------|--------|-------|------|---|---|---|
| | iPhone | Metro prod | | ☐ | ☐ | ☐ |

Log result in `product-os/06-status/daily-log.md` when complete.
