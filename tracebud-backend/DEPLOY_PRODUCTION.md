# Deploy Tracebud API (Nest) — Railway + Namecheap DNS

**Fast path:** [RAILWAY_QUICKSTART.md](./RAILWAY_QUICKSTART.md)

Use **Namecheap (or Cheapname) for DNS only**. The Nest API does not run on typical shared hosting (PHP/cPanel). Run the container on **Railway** (recommended) or a **VPS**, then point **`api.tracebud.com`** at it.

## Architecture

```text
Farmers (Expo app)  ──HTTPS──►  api.tracebud.com  ──►  Railway (Docker)
Dashboard (Vercel)  ──proxy──►  TRACEBUD_BACKEND_URL (same API)
Supabase            ◄──────────  DATABASE_URL + JWT (SUPABASE_URL / ANON_KEY)
```

Mobile builds use:

```bash
EXPO_PUBLIC_API_URL=https://api.tracebud.com/api
```

(path includes `/api` because Nest `setGlobalPrefix('api')`).

---

## Part A — Railway (≈15 minutes)

### 1. Create project

1. Sign in at [railway.app](https://railway.app).
2. **New Project** → **Deploy from GitHub repo** (this monorepo) or **Empty** + CLI.
3. If monorepo: set **Root Directory** to `tracebud-backend`.
4. Railway detects `Dockerfile` + `railway.toml` (health check `/api/health`).

### 2. Environment variables

In Railway → **Variables**, add (from `tracebud-backend/.env.production.example`):

| Variable | Source |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase → Settings → Database → **Connection string** (pooler, same as local) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `GFW_API_KEY` | [GFW Data API](https://data-api.globalforestwatch.org/user/login) → API keys |
| `GFW_BASE_URL` | `https://data-api.globalforestwatch.org` |
| `GFW_DATASET` | `gfw_integrated_alerts` |
| `GFW_RADD_DATASET` | `umd_glad_dist_alerts` |
| `PORT` | Railway injects this automatically; optional `4001` |

After deploy, confirm deforestation screening is configured:

```bash
npm run check:deploy-health -- "https://api.tracebud.com"
# Health JSON should NOT include a GFW_API_KEY warning.

npm run check:gfw   # local key smoke test (uses tracebud-backend/.env)
```

From a machine with Railway CLI (login once, then link the API service):

```bash
cd tracebud-backend
npx @railway/cli login
npx @railway/cli link -p dynamic-perception -s tradebud.com
npm run railway:sync:gfw
```

Add optional vars when you enable email / integrations (see `.env.production.example`).

### 2b. Apply farmer consent migration (sovereignty v1)

Before enabling dashboard **Request data access** / field-app **Data sharing**, apply `consent_grants` on the Supabase DB used by `DATABASE_URL`:

```bash
cd tracebud-backend
# Put the real Supabase pooler URL in tracebud-backend/.env.local as DATABASE_URL=
# (Dashboard → Settings → Database → Connection string). Do NOT paste the docs placeholder.
npm run db:apply:consent-grants
npm run db:verify:consent-grants
```

Supabase CLI alternative: apply `supabase/migrations/202606120001_consent_grants.sql` on the linked project.

After deploy, smoke consent API paths (cooperative JWT required):

```bash
TRACEBUD_API_BASE=https://api.tracebud.com/api \
TRACEBUD_COOP_TOKEN="<coop-jwt>" \
TRACEBUD_FARMER_PROFILE_ID="<farmer_profile-uuid>" \
TRACEBUD_FARMER_EMAIL="farmer@example.com" \
npm run smoke:consent
```

Manual E2E: dashboard `/farmers/[id]` → **Request data access** → field app **Data sharing** → approve → coop lists plots → farmer **Revoke future access** → unsold plots blocked, sold-batch lineage still readable.

Integration test (CI / local with `TEST_DATABASE_URL`):

```bash
npm run test:integration:consent
```

### 3. Deploy and smoke test

After first deploy, open the Railway **public URL** (e.g. `https://tracebud-backend-production.up.railway.app`):

```bash
curl -sS "https://YOUR-RAILWAY-URL.up.railway.app/api/health"
```

Expect JSON with `"status":"ok"`.

From repo:

```bash
cd tracebud-backend
npm run check:deploy-health -- "https://YOUR-RAILWAY-URL.up.railway.app"
```

### 4. Custom domain on Railway

1. Railway → service → **Settings** → **Networking** → **Custom Domain**.
2. Add `api.tracebud.com`.
3. Railway shows a **CNAME target** (e.g. `something.up.railway.app`).

---

## Part B — Namecheap DNS

1. Namecheap → **Domain List** → **Manage** → **Advanced DNS**.
2. Add record:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **CNAME** | `api` | Railway CNAME target from step A.4 | Automatic |

3. Remove conflicting **A** record on `api` if present.
4. Wait 5–60 minutes for DNS + Railway TLS (HTTPS).

Verify:

```bash
npm run check:deploy-health -- "https://api.tracebud.com"
```

Swagger (optional): `https://api.tracebud.com/api/docs`

---

## Part C — Wire clients

### Offline farmer app (`apps/offline-product/.env.local`)

```bash
EXPO_PUBLIC_API_URL=https://api.tracebud.com/api
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Then:

```bash
cd apps/offline-product
npm run release:preflight:production
```

Set the same vars in **EAS** → project → **Environment variables** → `production` profile.

### Dashboard (`apps/dashboard-product`)

```bash
TRACEBUD_BACKEND_URL=https://api.tracebud.com/api
```

Set in Vercel project env for production.

---

## Alternative — Namecheap VPS (Docker)

If you have a **VPS** (not shared hosting):

```bash
# On the VPS, clone repo, create tracebud-backend/.env from .env.production.example
cd tracebud-backend
docker build -t tracebud-api .
docker run -d --restart unless-stopped -p 4001:4001 --env-file .env tracebud-api
```

Namecheap DNS: **A record** `api` → VPS public IP. Put **Caddy** or **nginx** in front for HTTPS on port 443.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Could not resolve host api.tracebud.com` | DNS not propagated; check CNAME at Namecheap |
| Health 502 / crash loop | Check Railway logs; usually bad `DATABASE_URL` |
| Auth works locally, fails in app | `SUPABASE_URL` / `SUPABASE_ANON_KEY` mismatch with mobile app |
| Browser dashboard CORS error | Add preview URL to `TRACEBUD_CORS_ORIGINS` on Railway |
| Mobile “network” but URL works in curl | `EXPO_PUBLIC_API_URL` must be HTTPS and end with `/api` |

---

## Security checklist

- [ ] No `EXPO_PUBLIC_ALLOW_TEST_AUTH` in production mobile env
- [ ] `DATABASE_URL` uses pooler; migrations use direct URL separately if needed
- [ ] Scheduler/integration secrets only on Railway, not in the mobile app
- [ ] RLS phase-3 + PostGIS remediation already applied on Supabase (you did this)

---

## Cost note

- **Namecheap**: domain + DNS (you already have this).
- **Railway**: small always-on service (~$5–20/mo depending on usage).
- **Supabase**: separate bill; DB stays on Supabase, not on Namecheap.

Shared Namecheap web hosting alone cannot host this API; keep it for marketing static sites or DNS only.
