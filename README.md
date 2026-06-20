# Tracebud

Multi-tenant EUDR compliance platform: offline field app, unified SaaS dashboard, marketing site, and NestJS API.

## Start here

| What you want | Where to go |
| --- | --- |
| Run the field app (Expo) | [`apps/offline-product/README.md`](apps/offline-product/README.md) |
| Run the dashboard (Next.js) | [`apps/dashboard-product/README.md`](apps/dashboard-product/README.md) |
| Run the marketing site | [`apps/marketing/README.md`](apps/marketing/README.md) |
| Run the API (NestJS) | [`tracebud-backend/README.md`](tracebud-backend/README.md) |
| App topology & domains | [`apps/STRUCTURE.md`](apps/STRUCTURE.md) |
| Product specs & delivery status | [`product-os/README.md`](product-os/README.md) |
| Database migrations | [`supabase/README.md`](supabase/README.md) |
| Local setup / branches | [`docs/repo-branches.md`](docs/repo-branches.md) |
| Vercel monorepo deploys | [`docs/vercel-monorepo.md`](docs/vercel-monorepo.md) |

## Repository layout

```
apps/
  marketing/           Public site (tracebud.com)
  offline-product/     Offline-first field app (Expo)
  dashboard-product/   Unified multi-tenant dashboard
  field-auth/          OAuth bridge for field sign-in
  demos/               Public demo deployments
tracebud-backend/      NestJS API (Railway)
supabase/              Supabase SQL migrations + seeds
product-os/            Features, ADRs, quality gates, status logs
docs/openapi/          API contract draft + governance artifacts
```

This is an **npm workspaces monorepo** with **Turborepo** task orchestration. Install once at the repo root:

```bash
npm install
```

Workspace packages: `dashboard-product`, `tracebud-marketing`, `field-auth`, `tracebud-backend`, `packages/tsconfig`. The offline field app installs separately under `apps/offline-product/` (not hoisted into root workspaces).

### Root commands

```bash
npm run dev:backend      # NestJS API
npm run dev:dashboard    # Unified dashboard
npm run dev:marketing    # Public site
npm run dev:offline      # Expo Metro (field app)
npm run lint:workspaces  # turbo run lint (CI-aligned packages)
npm run test:workspaces  # turbo run test (offline + field-auth)
npm run typecheck:dashboard # tsc --noEmit (also in CI)
npm run check:workspaces # lint + test + typecheck via turbo
```

Legacy root Next.js shell (`legacy/root-v0-next-shell/`) and OpenAPI governance scripts remain at the repo root — not deployed.

## Product documentation (read order)

When making product or architecture changes, read in this order:

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`
7. Relevant files under `product-os/`

Canonical sources win on conflict. Current execution focus: `product-os/06-status/current-focus.md` (history: `current-focus-archive.md`).

## Common commands

From repo root (OpenAPI / contract governance):

```bash
npm install
npm run openapi:lint
npm run openapi:governance:check
```

Per-app commands are documented in each app's README. Typical local stack:

1. Backend: `npm run dev:backend`
2. Field app: `npm run dev:offline`
3. Dashboard: `npm run dev:dashboard`

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:

- OpenAPI lint and governance checks
- `tracebud-backend` — lint, build, unit + PostGIS integration tests
- `apps/dashboard-product` — lint + vitest
- `apps/marketing` — lint + build
- `apps/offline-product` — lint, typecheck, vitest, i18n/QA guards

## Vercel deploys (workspaces)

Dashboard and marketing install from the monorepo root. See **[`docs/vercel-monorepo.md`](docs/vercel-monorepo.md)** for the full checklist.

- **Install Command:** `cd ../.. && npm ci` (also in each app's `vercel.json`)
- **Build Command:** `npm run build` (unchanged)

## Design reference (not production code)

`apps/offline-product/design/v0-prototype/` is an archived v0 interactive prototype kept for UI reference. It is excluded from the offline app TypeScript build (`tsconfig.json`). Do not treat it as a deployable app.
