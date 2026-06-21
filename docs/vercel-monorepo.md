# Vercel deploys (npm workspaces monorepo)

After PR #117, workspace apps share a **single root** `package-lock.json`. Vercel projects whose **Root Directory** is an app subdirectory must install from the monorepo root first.

## Projects that need root install

| Vercel project | Root Directory | Install Command | Build Command |
| --- | --- | --- | --- |
| `dashboard-product` | `apps/dashboard-product` | `cd ../.. && npm ci` | `npm run build` |
| `marketing` / `tradebud-com` | `apps/marketing` | `cd ../.. && npm ci` | `npm run build` |
| `field-auth` (if deployed) | `apps/field-auth` | `cd ../.. && npm ci` | `npm run build` |
| `founder-os` (internal ops) | `apps/founder-os` | `cd ../.. && npm ci` | `npm run build` |

**Do not change** Root Directory — only the Install Command.

## Repo config (preferred)

Install commands are also declared in app `vercel.json` files:

- `apps/dashboard-product/vercel.json`
- `apps/marketing/vercel.json`
- `apps/founder-os/vercel.json`
- `apps/demos/*/vercel.json` (demos)

If the Vercel dashboard overrides `vercel.json`, align the dashboard setting with the table above.

## Git auto-deploy (disabled)

All app `vercel.json` files set `"git": { "deploymentEnabled": false }` so **pushes and merges do not trigger Vercel builds** (saves quota on this monorepo where many projects share one GitHub repo).

**Deploy manually** when needed:

- **CLI:** `vercel deploy --prod` from the app root (or with `--cwd apps/<app>`)
- **Deploy Hook:** Project → Settings → Git → Deploy Hooks → POST the hook URL

Existing production URLs keep serving the last successful deployment until you deploy again.

**Note:** Merging the PR that adds `deploymentEnabled: false` may still trigger one final Git-linked build per project before the setting takes effect. After merge, future Git events should not deploy.

## Demos (unchanged)

`apps/demos/*` are **not** npm workspace members. Each demo keeps its own `package.json` and install (`npm install` in the demo directory).

## Verification checklist

After updating install commands, trigger a **Redeploy** on each project and confirm the build log shows:

1. `npm ci` running from repo root (not `npm install` only inside the app dir)
2. `npm run build` succeeding in the app Root Directory
3. No `ENOENT` / missing workspace dependency errors

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot find module` for hoisted deps | Install Command must be `cd ../.. && npm ci` |
| Wrong React/Next version | Root install missing; app-only install pulls stale lock state |
| Build uses old per-app lockfile | Remove any custom override that runs `npm install` in app dir only |

## Local parity

```bash
npm ci                    # repo root — same as Vercel install
npm run build -w dashboard-product
npm run build -w tracebud-marketing
npm run build -w founder-os
```

See also [`docs/repo-branches.md`](repo-branches.md) and root [`README.md`](../README.md).
