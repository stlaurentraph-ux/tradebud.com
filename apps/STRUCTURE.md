# Apps Structure (Long-Term)

## Documentation map

- **Strategic / commercial source:** [`REQUIREMENTS.md`](../REQUIREMENTS.md)
- **Detailed product PRD:** [`PRODUCT_PRD.md`](../PRODUCT_PRD.md)
- **MVP scope PRD:** [`MVP_PRD.md`](../MVP_PRD.md)
- **JTBD workflow PRD:** [`JTBD_PRD.md`](../JTBD_PRD.md)
- **App topology and deployment map:** this file

Use `REQUIREMENTS.md` for vision, market model, and regulatory positioning.  
Use `MVP_PRD.md` for v1 release scope boundaries and priorities.
Use `PRODUCT_PRD.md` for operational product requirements, workflows, entities, permissions, and implementation planning.
Use `JTBD_PRD.md` for role-based activation, remediation, and cross-tenant request workflows.

Tracebud now follows a two-product + multi-demo model:

- Product 1: offline app
- Product 2: unified multi-tenant SaaS dashboard (all segments in one app)
- Multiple permanent public demos that remain visible for visitors

## Canonical app layout

- `apps/marketing`
- `apps/offline-product`
- `apps/dashboard-product`
- `apps/demos/offline`
- `apps/demos/exporter`
- `apps/demos/importer`
- `apps/demos/cooperative`
- `apps/demos/country`

## Domain mapping

- `tracebud.com` -> `apps/marketing`
- `offline.tracebud.com` -> `apps/offline-product`
- `app.tracebud.com` (or `dashboard.tracebud.com`) -> `apps/dashboard-product`
- `fieldapp-demo.tracebud.com` -> `apps/demos/offline`
- `exporter-demo.tracebud.com` -> `apps/demos/exporter`
- `importer-demo.tracebud.com` -> `apps/demos/importer`
- `cooperative-demo.tracebud.com` -> `apps/demos/cooperative`
- `country-demo.tracebud.com` -> `apps/demos/country`

## Deployment guardrails

1. One Vercel project per app folder.
2. Set each project's Root Directory to its exact app folder (never ambiguous `.`).
3. Keep product and demo domains attached to different projects.
4. Keep demo-specific environment variables isolated from product variables.
5. Enforce tenant-scoped RBAC in `apps/dashboard-product` for all dashboard APIs.

## Migration notes (completed in repo)

- Exporter product renamed to unified dashboard product: `apps/dashboard-product`
- Demo apps grouped under `apps/demos/*`
- Importer product folder removed (importer is now a role/segment inside dashboard product)
- Cooperative and country demo folders scaffolded for future implementation

