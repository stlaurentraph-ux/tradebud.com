# pick-automation-slice

Lane 1 intake — choose the next **safe** automation slice and prepare the branch. Do not implement in this step unless the user asked to proceed immediately.

## 1. Read state

1. `product-os/06-status/automation-ops-plan.md` — §16 Bundles, §5 Phase tracker
2. `product-os/06-status/agent-queue.md` — **Ready** under Guardrails
3. `product-os/06-status/current-focus.md` — **In-flight** rows (collision check)
4. `git branch --show-current`

## 2. Pick slice (default rules)

1. Prefer **Bundle A** items first unless `current-focus.md` says otherwise.
2. Within the bundle, lowest slice ID that is **Ready** and not **Blocked**.
3. Skip slices whose app tree conflicts with an **in_progress** In-flight or guardrails row on the same app.

| Slice prefix | App tree | Blocks parallel feature work on |
|--------------|----------|----------------------------------|
| `0.M.*`, `1.M.*`, `2.M.*`, `4.M.*` | `apps/marketing/` | marketing features |
| `0.1–0.5`, `1.5`, `2.5`, `4.5` | `apps/dashboard-product/` | dashboard features |
| `1.O.*`, `3.O.*` | `apps/offline-product/` | offline features |
| `1.D.*`, `2.6`, `2.11` | `supabase/`, `tracebud-backend/sql/` | backend schema work |
| `1.1–1.4`, `3.4` | root / `.github/` | any (short — prefer alone) |

## 3. Collision check

**Stop and report** if:

- Same app already has `in_progress` In-flight row
- Another **In progress** guardrails slice touches the same app tree
- Slice is in **Blocked** (secrets / human gate)

**OK in parallel:**

- `0.M.0` (marketing) + feature on `apps/dashboard-product/`
- `0.1` (dashboard CI) + `1.O.1` (offline) — different apps

## 4. Claim slice

In `agent-queue.md`:

- Move chosen slice to **In progress** with branch name `chore/automation-<short-name>`
- Do not leave two guardrails slices **In progress** on the same app

Optional In-flight row in `current-focus.md` for visibility:

| ID | Branch | Owner | Scope | Status |
|----|--------|-------|-------|--------|
| IF-A01 | `chore/automation-marketing-lint-fix` | cursor | Lane 1 slice **0.M.0** | in_progress |

## 5. Branch (from latest `main`)

```bash
git fetch origin main
git checkout -b chore/automation-<short-name> origin/main
# or worktree:
git worktree add ../tracebud-automation-<short-name> -b chore/automation-<short-name> origin/main
```

Repo install: `npm ci` from root (once per worktree).

## 6. Hand off

Tell the user:

- Slice ID and bundle
- Branch name
- Exact local proof commands (from plan + queue)
- Whether parallel feature work is safe on other apps

Then run **`implement-automation-slice`** to implement.

## 7. Human-only gates (never agent-PR)

- **0.H**, **0.H.2**, **0.H.3** — branch protection, Vercel deployment protection, PR-only `main`
- **3.1**, **3.2**, **3.3** — Cursor Automations editor setup (3.3 runbook: `weekly-health-automation.md`)
- Adding GitHub secrets
