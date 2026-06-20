# Tracebud Dashboard (unified SaaS)

Multi-tenant web dashboard for exporters, importers, cooperatives, sponsors, reviewers, and admins. Deployed at `dashboard.tracebud.com`.

## Prerequisites

- Node.js 20+
- Running Tracebud backend (see [`tracebud-backend/README.md`](../../tracebud-backend/README.md))
- Supabase project (same as backend) with dashboard env vars

## Environment

Copy patterns from sibling apps. Typical `.env.local` keys include Supabase URL/keys, backend API URL, and auth/session secrets used by Next.js middleware. See existing route handlers under `app/api/` for required variables.

## Local development

From the **repo root** (npm workspaces — install once with `npm install` at root):

```bash
npm run dev:dashboard
```

Or from this directory after root install:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Architecture notes

- **Single app, multiple roles** — Importer, exporter, cooperative, and other segments are role/tenant views inside this app (see [`../STRUCTURE.md`](../STRUCTURE.md)).
- **API boundary** — Browser calls Next.js route handlers; server components and API routes proxy to NestJS where needed.
- **RBAC** — Tenant isolation and role gates are enforced in middleware and API routes; see `lib/rbac.ts` and `middleware.ts`.

## Related docs

- Repo overview: [`../../README.md`](../../README.md)
- Product OS: [`../../product-os/README.md`](../../product-os/README.md)
- Dashboard feature notes: [`../../product-os/02-features/FEAT-008-dashboards.md`](../../product-os/02-features/FEAT-008-dashboards.md)
