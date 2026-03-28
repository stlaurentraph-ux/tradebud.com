# Importer Demo App

Public demo-track importer dashboard for visitors and sales.

- Audience: visitors and sales demos
- Domain target: `https://importer-demo.tracebud.com`
- Vercel root directory: `apps/demos/importer` (deploy from monorepo root; avoid doubling the path in project settings)
- Vercel project: **Framework Preset = Next.js**; leave **Output Directory** empty (not `public`). This repo includes `vercel.json` with `"framework": "nextjs"` so Vercel does not treat the app as a static `public/` export.

Status: Next.js app implemented — multi-section dashboard (overview, inbound lots, suppliers, DDS review, evidence, risk, TRACES NT, CSRD/audit, settings). Mock data only; no backend.
