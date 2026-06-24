# Cooperative field enumeration — operator runbook

**Feature:** `FEAT-012-cooperative-enumeration-mode.md`  
**ADR:** `ADR-011-cooperative-enumeration-and-tile-bootstrap.md`

## Who uses what

| Person | App / surface | Role |
|--------|---------------|------|
| Cooperative desk admin | Dashboard (web) | Publish mapping campaigns, review provisional members, approve geometry |
| Field operator | **Same field app as farmers** | Sign in with `agent` account → enumeration home |
| Farmer | Same field app | Standard home (own plots only) |

## Before the field day (office + Wi‑Fi)

1. Desk admin creates operator accounts with JWT role **`agent`**.
2. Operator installs **Tracebud field app** (App Store / TestFlight / Play).
3. Operator signs in → home shows **Field mapping** (member queue), not the farmer tiles.
4. *(Phase D+)* Prefetch roster from mapping campaign.
5. *(Phase E+)* Confirm cooperative region → download **district satellite map pack**.

## In the field (offline)

1. **Add member** if not on roster: name, village, phone **or** national ID, email optional.
2. Tap member in queue → **Map plot for this member**.
3. Complete capture (geometry + evidence per cooperative policy).
4. Repeat for next member. Plots stay on device with the correct member `farmerId`.

## Duplicate warnings

- If phone, ID, email, or name+village matches an existing member, the app warns before creating a provisional row.
- Choose **Use existing member** or **Create anyway** (desk review on sync).

## After the field day (Wi‑Fi)

1. **Settings → Sync now** uploads all member plots and provisional contacts.
2. Desk merges duplicate provisionals and approves geometry (ADR-008).

## Testing locally

Use a Supabase test user with `app_metadata.role = 'agent'`. Farmer test users still see the standard home.
