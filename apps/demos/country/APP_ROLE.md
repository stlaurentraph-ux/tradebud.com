# Country Demo App

Public demo-track national registry / government console for visitors and sales.

- Audience: visitors and sales demos (ministries, registries, DPI partners)
- Domain target: `https://country-demo.tracebud.com`
- Vercel root directory: `apps/demos/country` (deploy from monorepo root; avoid doubling the path in project settings)
- Vercel project: **Framework Preset = Next.js**; leave **Output Directory** empty (not `public`). This repo includes `vercel.json` with `"framework": "nextjs"`.

Status: Next.js app implemented — multi-section dashboard (overview, plot registry, licensed operators, EU submissions, evidence vault, risk & forest alerts, API & interop, transparency & audit, settings). Mock data only; no backend.
