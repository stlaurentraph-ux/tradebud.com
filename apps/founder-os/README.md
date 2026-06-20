# Founder OS (internal GTM app)

Standalone Next.js app for Tracebud internal GTM ops — outreach queue, pipeline, markets, pilots, content cadence.

**Deploy:** separate Vercel project, Root Directory `apps/founder-os`  
**Suggested domain:** `ops.tracebud.com`  
**PR:** #141 on branch `feature/founder-os-app`

## Vercel project setup

1. Import repo → branch `feature/founder-os-app` (or `main` after merge)
2. **Root Directory:** `apps/founder-os`
3. Install/build auto from `vercel.json`:
   - Install: `cd ../.. && npm ci`
   - Build: `npm run build`
4. **Environment variables** (copy from `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
   - Optional GTM project: `NEXT_PUBLIC_SUPABASE_GTM_URL` + `SUPABASE_GTM_SERVICE_ROLE_KEY`
   - Optional gate: `FOUNDER_OS_ACCESS_TOKEN`
5. Assign domain (e.g. `ops.tracebud.com`)

## Dashboard (after ops deploy)

On the **dashboard-product** Vercel project:

```
NEXT_PUBLIC_FOUNDER_OS_URL=https://ops.tracebud.com
```

Legacy paths `/founder-os`, `/crm`, `/content` then redirect externally.

## Local dev

```bash
npm ci                          # repo root
npm run dev -w founder-os       # http://localhost:3004
npm run check:founder-os        # CI parity
```

Copy Supabase keys from dashboard `.env.local` or GTM project vars.
