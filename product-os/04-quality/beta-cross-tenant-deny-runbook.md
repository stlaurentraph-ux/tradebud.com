# Beta — Cross-Tenant Deny-Path Runbook

Run in **staging** (or pre-cohort production) with two tenants: `tenant_a`, `tenant_b`.

## Preconditions

- Valid JWTs for user A (tenant A) and user B (tenant B).
- RLS phase-3 applied (`tb_v16_030`) and verified (`phase3_table_rls_status=pass`).

## API deny matrix (expect 401/403, never 200 with other tenant data)

| Surface | Method | Path | Token | Expected |
|---------|--------|------|-------|----------|
| Launch onboarding | GET | `/v1/launch/onboarding` | A | 200 scoped to A |
| Launch onboarding | GET | `/v1/launch/onboarding` | missing tenant claim | 403 |
| Launch entitlements | GET | `/v1/launch/entitlements` | B reading A resource id | 403 or empty |
| Admin orgs | GET | `/v1/admin/organizations` | A | only A orgs |
| Integrations V2 summary | GET | `/v1/integrations/coolfarm-sai/v2/runs/summary` | A | tenant A runs only |
| Harvest package | GET | `/v1/harvest/packages/{id}` | B + package owned by A | 403 |
| Audit gated-entry | GET | `/v1/audit/gated-entry` | missing tenant | 403 |
| Inbox | GET | `/v1/inbox/requests` | missing tenant | 403 |

## Dashboard proxy spot-check

With browser session as tenant A:

1. Open `/admin` — org list must not include tenant B names/ids.
2. Hit `/api/launch/onboarding` — response tenant matches session.
3. Cool Farm V2 `/api/integrations/coolfarm-sai/v2/runs/summary` — no foreign `tenantId` in rows.

## Evidence to attach

- Screenshot or HAR redacted snippet per row (status + no foreign IDs).
- RLS verify query output (`tb_v16_030_*_verify.sql`).
- Date, operator, environment in `beta-go-no-go-checklist.md` sign-off block.

## Automated coverage (when `TEST_DATABASE_URL` is set)

```bash
cd tracebud-backend && npm run test:integration:ownership
```

Uses isolated schemas; requires reachable Supabase **pooler** URL for the active project (not a retired project ref).
