# Repository branches & local setup

## Current layout (2026-06-20)

`main` uses **npm workspaces** + **Turborepo**. Install once at the repo root:

```bash
npm install          # or npm ci in CI / Vercel
npm run dev:offline
npm run dev:backend
npm run dev:dashboard
npm run lint:workspaces
npm run check:workspaces
```

Workspace packages: `dashboard-product`, `tracebud-marketing`, `tracebud-offline`, `field-auth`, `tracebud-backend`.

**Not in the workspace:** `apps/demos/*`, `design/v0-prototype/`, legacy root `app/`.

## Active branches

| Branch | Purpose |
| --- | --- |
| `main` | Deployable baseline (workspaces + Turbo merged) |
| `feature/offline-tenure` | Offline tenure/evidence/Metro work — rebase onto `main`, root `npm install` |
| `backup/pre-workspaces-2026-06-20` | Rollback snapshot |
| Tag `pre-workspaces-2026-06-20` | Last commit before workspaces (`46c44fb`) |

Merged and safe to delete locally/remotely: `chore/npm-workspaces`, `chore/turborepo`.

## Feature branch workflow

```bash
git checkout main && git pull
git checkout -b feature/my-slice
# … work in apps/* or tracebud-backend …
npm install              # at repo root after pull or package.json changes
npm run test:offline     # etc.
```

Rebase before PR:

```bash
git fetch origin
git rebase origin/main
# resolve package-lock.json conflicts → keep root lockfile, then npm install
```

## Vercel

See [`docs/vercel-monorepo.md`](vercel-monorepo.md) — dashboard and marketing need `cd ../.. && npm ci` as Install Command.

## Agent sessions

See `.cursor/rules/branch-discipline.mdc` — product work in `apps/*`; avoid unrelated root `package.json` / CI edits unless doing repo maintenance.
