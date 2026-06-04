# Railway quickstart (Tracebud API)

Target: **`https://api.tracebud.com/api`** (Namecheap CNAME → Railway).

## 0) Local check (2 min)

```bash
cd tracebud-backend
npm run railway:preflight:local
```

If `DATABASE_URL` is missing, add it to repo root `.env.local` from Supabase (same project as production RLS: `uzsktajlnofosxeqwdwl`):

- Dashboard → **Project Settings** → **Database** → **Connection string** → **URI** (pooler recommended)

Use the **transaction** or **session** pooler URL; not the service role key in `DATABASE_URL`.

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
| `DATABASE_URL` | from Supabase (pooler URI) |
| `SUPABASE_URL` | `https://uzsktajlnofosxeqwdwl.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key |

5. **Deploy** (or push to `main` if auto-deploy is on).
6. **Settings** → **Networking** → generate **Public domain** if none yet.

## 2) Smoke test

Replace with your Railway URL:

```bash
npm run check:deploy-health -- "https://YOUR-SERVICE.up.railway.app"
```

Expect: `OK …/api/health`

## 3) Custom domain + Namecheap

1. Railway → **Settings** → **Networking** → **Custom Domain** → `api.tracebud.com`.
2. Copy the **CNAME** target Railway shows.
3. Namecheap → **Advanced DNS** → **CNAME** Host `api` → that target.
4. Wait for TLS (often 5–30 min), then:

```bash
npm run check:deploy-health -- "https://api.tracebud.com"
```

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
| 502 after deploy | Service crashed on boot; verify all three required env vars |
| `api.tracebud.com` NXDOMAIN | Namecheap CNAME not set or still propagating |

Full runbook: [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)
