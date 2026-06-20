# Repository branches & parallel work

How to run offline product development in parallel with monorepo restructuring.

## Branches

| Branch | Base | Purpose |
| --- | --- | --- |
| `main` | — | Production baseline; hygiene docs, sync fixes |
| `feature/offline-tenure` | `main` | Active offline/tenure/evidence work |
| `chore/npm-workspaces` | `main` | Phase 1 npm workspaces (single root lockfile) |
| `chore/turborepo` | `chore/npm-workspaces` | Phase 2 Turborepo task orchestration |
| `backup/pre-workspaces-2026-06-20` | snapshot | Rollback branch |
| Tag `pre-workspaces-2026-06-20` | `46c44fb` | Last commit before workspaces PR |

## Local setup by branch

### Before workspaces merge (`main`, `feature/offline-tenure`)

```bash
cd tracebud-backend && npm install
cd apps/offline-product && npm install
cd apps/dashboard-product && npm install
# … per app you touch
```

### After workspaces merge (`chore/npm-workspaces` → `main`)

```bash
npm install   # once at repo root
npm run dev:backend
npm run dev:offline
npm run dev:dashboard
npm run lint:workspaces   # turbo run lint
npm run check:workspaces  # lint + test + typecheck
```

## Switching branches safely

```bash
git status          # commit or stash first
git stash push -u -m "describe WIP"
git checkout <branch>
git stash pop       # only on the branch where work belongs
```

## Expected merge conflicts

- **`package-lock.json`** — workspaces introduces a root lockfile; offline branch may still have per-app locks until rebased onto workspaces `main`.
- **`.github/workflows/ci.yml`** — both branches may touch CI; merge manually keeping workspace `-w` scripts and any new offline checks.

## Vercel (after workspaces merge)

For dashboard and marketing Vercel projects whose root directory is `apps/dashboard-product` or `apps/marketing`:

- **Install Command:** `cd ../.. && npm ci` (or set monorepo root as project root if preferred)
- **Build Command:** unchanged (`npm run build` in project directory works via workspace hoisting after root install)

## What is not in the workspace

- `apps/demos/*` — separate deploys, own `package.json`
- `apps/offline-product/design/v0-prototype/` — archived UI reference
- Legacy root `app/` — early v0 shell, not deployed

See also `.cursor/rules/branch-discipline.mdc` for agent session guidance.
