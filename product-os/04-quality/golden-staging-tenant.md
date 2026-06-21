# Golden staging tenant (slice 2.7)

Canonical staging fixtures for dashboard proxy smoke, Playwright (4.4–4.7), and inbox golden-path bootstrap.

**Manifest:** `golden-staging-tenant.json` (machine-readable contract)  
**Backend constants:** `tracebud-backend/src/testing/golden-staging-tenant.constants.ts`  
**CI guard:** `npm run golden:staging:assert`

---

## Tenant IDs

| Role | Tenant ID | Notes |
|------|-----------|-------|
| Recipient (Rwanda demo exporter) | `tenant_rwanda_001` | JWT `app_metadata.tenant_id` for smoke + bootstrap |
| Sender (Brazil demo org) | `tenant_brazil_001` | Appears on golden inbox requests only |

After `seed_golden_path`, the recipient tenant has two inbox rows:

- `req_inbox_gp_001` — `RESPONDED` (`campaign_gp_001`)
- `req_inbox_gp_002` — `PENDING` (`campaign_gp_002`)

---

## Bootstrap golden inbox state

Requires an **exporter** or **admin** JWT for `tenant_rwanda_001`.

### Via dashboard proxy (staging)

```bash
export DASHBOARD_BASE_URL="https://dashboard-staging.tracebud.com"
export TRACEBUD_SMOKE_BEARER_TOKEN="<exporter-or-admin-jwt>"

node apps/dashboard-product/scripts/golden-staging-bootstrap.mjs
```

### Via backend directly

```bash
curl -sS -X POST "$TRACEBUD_BACKEND_URL/v1/inbox-requests/bootstrap" \
  -H "Authorization: Bearer $TRACEBUD_SMOKE_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"seed_golden_path"}'
```

Expected response: `{"ok":true}`

---

## Onboarding proxy smoke

Uses the same bearer token (role in JWT may differ from smoke role env — smoke calls use `TRACEBUD_SMOKE_ROLE`).

```bash
export DASHBOARD_BASE_URL="https://dashboard-staging.tracebud.com"
export TRACEBUD_SMOKE_BEARER_TOKEN="<jwt-for-tenant_rwanda_001>"
# optional overrides (defaults match manifest):
# export TRACEBUD_SMOKE_ROLE=compliance_manager
# export TRACEBUD_SMOKE_STEP_KEY=create_first_campaign

node apps/dashboard-product/scripts/launch-onboarding-proxy-smoke.mjs
```

---

## GitHub secrets (human setup)

Add in **Settings → Secrets and variables → Actions** (values never committed):

| Secret | Value guidance |
|--------|----------------|
| `DASHBOARD_BASE_URL` | Staging dashboard origin (no trailing slash) |
| `TRACEBUD_SMOKE_BEARER_TOKEN` | Supabase JWT for `tenant_rwanda_001` with `compliance_manager` (onboarding smoke) or exporter (bootstrap) |
| `TRACEBUD_SMOKE_TENANT_ID` | Optional — set to `tenant_rwanda_001` for Playwright assertions |
| `TRACEBUD_SMOKE_ROLE` | Optional — default `compliance_manager` |
| `TRACEBUD_SMOKE_STEP_KEY` | Optional — default `create_first_campaign` |

After secrets are set, move slice **2.5** from Blocked → Ready in `agent-queue.md`.

---

## Minting a smoke JWT (human)

1. Sign in to staging dashboard as the Rwanda demo exporter (`exporter+demo@tracebud.com` or your staging equivalent).
2. Copy the Supabase session access token from browser devtools (Application → Local Storage) or use Supabase dashboard **Authentication → Users → Generate JWT** with `app_metadata`: `{ "tenant_id": "tenant_rwanda_001", "role": "compliance_manager" }`.
3. Store as `TRACEBUD_SMOKE_BEARER_TOKEN` in GitHub — rotate on expiry.

---

## Unblocks

- **2.5** — post-deploy onboarding proxy smoke (needs secrets above)
- **4.4–4.7** — Playwright + release health (manifest + secrets doc; no Vercel deploy required for guard-only slices)
