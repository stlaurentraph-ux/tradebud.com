# Railway quickstart (Tracebud API)

Target: **`https://api.tracebud.com/api`** (Namecheap CNAME → Railway).

## 0) Local check (2 min)

```bash
cd tracebud-backend
npm run railway:preflight:local
```

If `DATABASE_URL` is missing, add it to repo root `.env.local` from Supabase (same project as production RLS: `uzsktajlnofosxeqwdwl`):

- Dashboard → **Project Settings** → **Database** → **Connection string** → **URI** (pooler recommended)

Use the **transaction** pooler URL (`:6543` + `?pgbouncer=true`); not the service role key in `DATABASE_URL`. Never use direct `db.*.supabase.co` for the API (IPv6-only; exhausts Postgres slots).

```bash
npm run check:db-connection   # pooler URL, PG_POOL_MAX, live probe
```

## Connection hygiene (Supabase)

- **One pool per API process** — NestJS uses `pg` with `PG_POOL_MAX` (default **5**). Set on Railway; do not exceed ~8 per replica unless load-tested.
- **Pooler only** — `aws-*-*.pooler.supabase.com:6543`; scripts auto-prefer pooler over direct `db.*` URLs in env files.
- **Separate test DB** — `DATABASE_URL` → prod migrations and tooling; `TEST_DATABASE_URL` → `npm run test:integration` only. Run `npm run db:sync:test-env` once to copy test URL from repo root `.env.local`. Prod/test mix-ups are blocked at startup (API), in migration scripts, and by `backend-db-url-split-guard` in `npm run qa:structural`.
- **Graceful shutdown** — API drains the pool on SIGTERM (Railway deploys).
- **Scale out** — more Railway replicas × `PG_POOL_MAX` = Postgres backend connections; watch Supabase **Database → Observability**.

## 1) Railway project (10 min)

1. [railway.app](https://railway.app) → **Login** (GitHub).
2. **New Project** → **Deploy from GitHub repo** → select this repository.
3. Click the new service → **Settings**:
   - **Root Directory**: `tracebud-backend`
   - **Watch Paths** (optional): `tracebud-backend/**`
4. **Variables** → add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | from Supabase (pooler URI, port **6543** transaction mode) |
| `PG_POOL_MAX` | `5` (per API replica — see §Connection hygiene) |
| `SUPABASE_URL` | `https://uzsktajlnofosxeqwdwl.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `GFW_API_KEY` | GFW Data API key (deforestation screening) |
| `GFW_BASE_URL` | `https://data-api.globalforestwatch.org` |
| `GFW_DATASET` | `gfw_integrated_alerts` |
| `GFW_RADD_DATASET` | `umd_glad_dist_alerts` |

**Campaign outreach emails** (exporter/importer Send Request wizard):

| Key | Value |
|-----|--------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `hello@tracebud.com` |
| `RESEND_FROM_NAME` | `Tracebud` (optional) |
| `TRACEBUD_DASHBOARD_PUBLIC_URL` | `https://dashboard.tracebud.com` |
| `RESEND_DECISION_SECRET` | Long random string for Accept/Refuse email links (optional if `RESEND_API_KEY` is set — API falls back to that key) |

Shortcut after login + link (copies from local `tracebud-backend/.env`):

```bash
cd tracebud-backend   # skip if you are already in this folder
npx @railway/cli login
npx @railway/cli link -p dynamic-perception -s tradebud.com
npm run railway:sync:gfw
```

`-s tradebud.com` selects the API service (`api.tracebud.com`) without the interactive picker.
Do not paste shell comments on the same line as `railway link` — `#` is passed as an argument.

5. **Deploy** (or push to `main` if auto-deploy is on).
6. **Settings** → **Networking** → generate **Public domain** if none yet.

## 2) Smoke test

Replace with your Railway URL:

```bash
npm run check:deploy-health -- "https://YOUR-SERVICE.up.railway.app"
```

Expect: `OK …/api/health` (no `GFW_API_KEY` warning in JSON).

Verify GFW credentials locally before/after Railway sync:

```bash
npm run check:gfw
```

## 3) Custom domain + Namecheap

1. Railway → **Settings** → **Networking** → **Custom Domain** → `api.tracebud.com`.
2. Copy the **CNAME** target Railway shows.
3. Namecheap → **Advanced DNS** → **CNAME** Host `api` → that target.
4. Wait for TLS (often 5–30 min), then:

```bash
npm run check:deploy-health -- "https://api.tracebud.com"

### Onboarding email cron (optional)

Daily resume nudges for users who stopped before workspace setup (wizard step 2):

```bash
curl -sS -X POST "https://api.tracebud.com/api/v1/launch/onboarding/remind-incomplete" \
  -H "x-tracebud-launch-cron-token: YOUR_LAUNCH_ONBOARDING_CRON_TOKEN"
```

Railway **Cron** or external scheduler: run once per day. Requires `RESEND_*`, `LAUNCH_ONBOARDING_CRON_TOKEN`, and `SUPABASE_SERVICE_ROLE_KEY` for magic-link resume URLs.

### Month-end billing cron (optional)

Run on the **1st of each month** (UTC) to finalize the **previous** calendar month:

```bash
curl -sS -X POST "https://api.tracebud.com/api/v1/billing/invoices/finalize-period-cron" \
  -H "x-tracebud-billing-token: YOUR_BILLING_SCHEDULER_TOKEN"
```

Requires `BILLING_SCHEDULER_TOKEN`. Optional `STRIPE_SECRET_KEY` + per-tenant `tenant_billing_subscription.stripe_customer_id` for card charges.

## 4) Clients

**Offline app** (`apps/offline-product/.env.local` + EAS production env):

```bash
EXPO_PUBLIC_API_URL=https://api.tracebud.com/api
```

**Dashboard** (Vercel production):

```bash
TRACEBUD_BACKEND_URL=https://api.tracebud.com/api
```

## CLI (optional)

```bash
npx @railway/cli login
cd tracebud-backend
npx @railway/cli link
npx @railway/cli up
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check Railway build logs; root must be `tracebud-backend` |
| `Cannot find module '@nestjs/config'` | Redeploy after fix: `@nestjs/config` must be in `dependencies` (not `devDependencies`) |
| Health check fails | Logs → often wrong `DATABASE_URL` or Supabase IP allowlist |
| `ENETUNREACH` / plot sync 500 | `DATABASE_URL` must use **pooler** host (`aws-0-REGION.pooler.supabase.com`), not `db.PROJECT_REF.supabase.co` (IPv6-only from Railway) |
| 502 after deploy | Service crashed on boot; verify all three required env vars |
| `api.tracebud.com` NXDOMAIN | Namecheap CNAME not set or still propagating |

Full runbook: [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)
