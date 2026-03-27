# Apps Structure (Long-Term)

This repository keeps **product apps** and **public demos** as separate apps so demos stay visible long-term and do not get overwritten by product releases.

## Canonical app layout

- `apps/marketing`
- `apps/offline-product`
- `apps/offline-demo`
- `apps/exporter-product`
- `apps/exporter-demo`
- `apps/importer-product`
- `apps/importer-demo`

## Domain mapping

- `tracebud.com` -> `apps/marketing`
- `offline.tracebud.com` -> `apps/offline-product`
- `offline-demo.tracebud.com` -> `apps/offline-demo`
- `exporter.tracebud.com` -> `apps/exporter-product`
- `exporter-demo.tracebud.com` -> `apps/exporter-demo`
- `importer.tracebud.com` -> `apps/importer-product`
- `importer-demo.tracebud.com` -> `apps/importer-demo`

## Deployment guardrails

1. One Vercel project per app folder.
2. Set each project's Root Directory to its exact app folder (never ambiguous `.`).
3. Keep production and demo domains attached to different projects.
4. Keep demo-specific environment variables isolated from product variables.

## Migration notes (completed in repo)

- `apps/offline-product` copied from `apps/offline-app/tracebud-offline-app`
- `apps/offline-demo` copied from `design/v0-prototype-updated/apps/offline-app/tracebud-offline-app`
- `apps/exporter-product` copied from `apps/exporter-dashboard`
- `apps/exporter-demo` copied from `design/v0-prototype-updated/apps/exporter-dashboard`
- `apps/importer-product` and `apps/importer-demo` created as scaffolds

Legacy folders are intentionally still present for compatibility during Vercel root-directory remapping.

