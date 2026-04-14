# Dashboard MVP Feature Gates

Single source of truth for deferred dashboard routes and their gate ownership.

## Defaults

- MVP mode default: deferred routes disabled.
- Dev override: set `NEXT_PUBLIC_FEATURE_*` environment variable to `true` (or `1`) to enable.

## Gate registry

| Feature | Env var | Default | Deferred routes | Owner | Reason |
|---|---|---|---|---|---|
| Request Campaigns | `NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS` | `false` | `/requests` | Dashboard + Product Eng | Request campaign workflows are Release 2+.
| Annual Reporting | `NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING` | `false` | `/reports` | Dashboard + Product Eng | Annual reporting snapshots are Release 4 scope.

## Enforcement points

- Navigation-level: `apps/dashboard-product/lib/rbac.ts` filters gated nav items.
- Route-entry-level: `apps/dashboard-product/middleware.ts` blocks deep links to disabled deferred routes.
- Central gate config: `apps/dashboard-product/lib/feature-gates.ts`.

## QA checklist

- `NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS=false` -> `/requests` is hidden in sidebar and deep link redirects to `/`.
- `NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING=false` -> `/reports` is hidden in sidebar and deep link redirects to `/`.
- Enable each flag in dev mode -> route appears in sidebar and deep-link is accessible.
