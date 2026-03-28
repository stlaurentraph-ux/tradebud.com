# Cooperative Demo App

Public demo-track cooperative dashboard for visitors and sales.

- Audience: visitors and sales demos (cooperatives aggregating member compliance)
- Domain target: `https://cooperative-demo.tracebud.com`
- Vercel root directory: `apps/demos/cooperative` (deploy from monorepo root; avoid doubling the path in project settings)
- Vercel project: **Framework Preset = Next.js**; leave **Output Directory** empty (not `public`). This repo includes `vercel.json` with `"framework": "nextjs"`.

Status: Next.js app implemented — multi-section dashboard (overview, members, plots & GIS, coop batches, member review, evidence vault, exporter buyers, reports & TRACES, settings). Mock data only; no backend.
