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

This is a **multi-package repo**, not a Turborepo/pnpm workspace. Each app has its own `package.json`; install dependencies in the app directory you are working on (CI does the same).

## Legacy root Next app

The repo root still contains an early v0 shell:

- `app/page.tsx` — large interactive prototype (~5k lines), **not deployed**
- Root `package.json` — OpenAPI governance scripts + legacy deps; **not the product dashboard**

Production apps live under `apps/*`. CI lints the root app only when `app/**` changes (see `.github/workflows/ci.yml`).

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

1. Backend: `cd tracebud-backend && npm install && npm run start:dev`
2. Field app: `cd apps/offline-product && npm install && npm run dev:metro`
3. Dashboard: `cd apps/dashboard-product && npm install && npm run dev`

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:

- OpenAPI lint and governance checks
- `tracebud-backend` — lint, build, unit + PostGIS integration tests
- `apps/dashboard-product` — lint + vitest
- `apps/marketing` — lint + build
- `apps/offline-product` — lint, typecheck, vitest, i18n/QA guards

## Design reference (not production code)

`apps/offline-product/design/v0-prototype/` is an archived v0 interactive prototype kept for UI reference. It is excluded from the offline app TypeScript build (`tsconfig.json`). Do not treat it as a deployable app.
