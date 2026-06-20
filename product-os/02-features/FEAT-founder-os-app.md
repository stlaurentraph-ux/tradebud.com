# Founder OS (internal GTM app)

Standalone Next.js app at `apps/founder-os` — deploy as separate Vercel project.

**Status:** PR #141 (`feature/founder-os-app`)  
**Depends on:** `FEAT-founder-os-gtm.md` (GTM tables + migration)

## Routes

| Path | Purpose |
|------|---------|
| `/` | Today — outreach/content operating dashboard |
| `/crm/*` | Pipeline, prospects, daily actions, pilots, partnerships |
| `/content/*` | Calendar, tasks, review |
| `/strategy/*` | Markets registry, intelligence / objections |

## Dashboard redirects

Legacy dashboard paths redirect to this app:

- `/founder-os/*` → ops app (path stripped)
- `/crm/*`, `/content/*` → ops app (same path)

Configured via `NEXT_PUBLIC_FOUNDER_OS_URL` on dashboard (prod) or `http://localhost:3004` in dev.

## Vercel

| Setting | Value |
|---------|--------|
| Root Directory | `apps/founder-os` |
| Install | `cd ../.. && npm ci` |
| Build | `npm run build` |
| Domain | `ops.tracebud.com` (suggested) |

Env: see `apps/founder-os/.env.example`.

## Local dev

```bash
npm run dev -w founder-os   # http://localhost:3004
npm run check:founder-os    # lint + typecheck + build
```

## Recovery

Re-extract from dashboard if needed:

```bash
node scripts/bootstrap-founder-os-app.mjs
```
