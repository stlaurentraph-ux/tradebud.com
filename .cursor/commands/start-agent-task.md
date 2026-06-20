# start-agent-task

Begin a scoped **Lane 3 feature** slice safely.

- **Guardrails / CI** → stop; run `pick-automation-slice` → `implement-automation-slice`.
- **Regression fix** → `fix-regression`.

## 0. Lane check

| Work type | Command |
|-----------|---------|
| CI, guards, hooks, queue | `pick-automation-slice` → `implement-automation-slice` |
| Sentry / CI red / prod bug | `fix-regression` |
| Product feature | continue below |

## 1. Orient

1. Read `AGENTS.md` and `.cursor/rules/agent-operations.mdc`
2. Read `product-os/06-status/agent-queue.md` — **no guardrails PR In progress** for your target app:
   - marketing: no `0.M.*` / `1.M.*` in progress
   - dashboard: no `0.1–0.5` / `1.5` in progress
   - offline: no `1.O.*` in progress
3. Read `product-os/06-status/current-focus.md` — claim **In-flight** row
4. App-specific runbook if offline: `offline-automation-runbook.md`
5. Relevant `product-os/02-features/FEAT-*.md`

## 2. Claim work

Add or update **In-flight** in `current-focus.md`:

| Column | Example |
|--------|---------|
| ID | `IF-003` |
| Branch | `feature/marketing-pricing-v2` |
| Owner | cursor |
| Scope | `apps/marketing/app/[locale]/pricing` |
| Feature doc | `FEAT-*.md` or `SITE_ARCHITECTURE.md` |
| Blocked by | — |
| Status | `in_progress` |

If scope overlaps another `in_progress` row on the **same app**, **stop** — pick another slice or wait.

## 3. Branch / worktree

```bash
git branch --show-current
git fetch origin main
git worktree add ../tracebud-<short-name> -b feature/<app>-<short-name> origin/main
cd ../tracebud-<short-name>
npm ci
```

Branch prefixes: `feature/marketing-*`, `feature/dashboard-*`, `feature/offline-*`, `feature/backend-*`.

## 4. Implement

Follow `build-feature.md` — only files in In-flight scope.

Offline sync/persist/auth: read `field-app-regression-ledger.md` first.

## 5. Verify (before PR)

**offline:**

```bash
cd apps/offline-product
npm run qa:regression
npm run qa:automation:phase1
```

**marketing:**

```bash
npm run lint -w tracebud-marketing
npm run build -w tracebud-marketing
```

**dashboard:**

```bash
npm run lint -w dashboard-product
npm test -w dashboard-product
```

**backend:**

```bash
npm run lint -w tracebud-backend
npm test -w tracebud-backend
```

Do not use `DEVICE_SMOKE_SIGNOFF_SKIP`. Do not weaken CI to pass.

## 6. PR

- Use `.github/pull_request_template.md` — **Lane 3** section
- Link FEAT doc + In-flight ID
- CI must pass; **human merges**

## 7. Close

Run `session-close.md` — In-flight → `done` or `blocked`.
