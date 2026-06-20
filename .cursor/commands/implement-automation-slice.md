# implement-automation-slice

Lane 1 guardrails — implement one automation-ops plan slice safely.

**Intake:** run `pick-automation-slice` first if slice/branch not yet chosen.

## Before starting

1. Read `product-os/06-status/automation-ops-plan.md` (§5 phases, §16 bundles).
2. Read `product-os/06-status/agent-queue.md` — slice **In progress** with your branch.
3. Read `.cursor/rules/automation-safety.mdc`.
4. Read `product-os/05-decisions/ADR-007-agent-automation-ops.md`.
5. Run `git branch --show-current` — must be `chore/automation-*`.

## Safety protocol (non-negotiable)

### One slice per PR

Exactly one slice ID (e.g. `0.M.0`, `0.1`, `1.D.1`). No drive-by refactors.

### Bundle order

Default: **Bundle A → B → C → D → E** (plan §16). Human override only if documented in `current-focus.md`.

### Local proof before push

```bash
npm ci   # from repo root — never per-app install for workspace members
# Then run EXACT commands the slice adds or changes (copy from CI YAML)
```

**Dashboard build** (slices 0.2, 0.4):

```bash
NEXT_PUBLIC_SENTRY_ENABLED=0 \
TRACEBUD_BACKEND_URL=https://api.example.test/api \
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder \
npm run build -w dashboard-product
```

**Marketing** (slices 0.M.*, 1.M.*):

```bash
npm run lint -w tracebud-marketing
npm run build -w tracebud-marketing
# After 0.M.3:
npm run check:marketing
```

**Offline** (slices 1.O.*):

```bash
cd apps/offline-product
npm run qa:regression
npm run qa:automation:phase1
```

**Backend / root CI** (slices 1.D.*, workflow edits):

```bash
npm run lint -w tracebud-backend
npm test -w tracebud-backend
# If ci.yml changed: run the specific job steps locally where feasible
```

### CI change rules

- **Add** steps; do not remove passing checks unless replacing with equivalent stricter step.
- Do **not** add **required** branch-protection checks until green on a test PR (PR body: `"enable required check after merge"`).
- Do **not** commit secrets; document in `ci-secrets-and-fixtures.md` + plan §12.
- Path filters: skip jobs on PRs only; full run on `push` to `main`.
- Editing `.github/workflows/ci.yml` → read `automation-safety.mdc`.

### Rollback

One slice = one revert commit. Avoid rewriting entire CI workflow in one PR.

## Slice checklist

- [ ] PR title: `[guardrails] <slice-id>: <short description>` (e.g. `[guardrails] 0.M.0: fix marketing lint`)
- [ ] Slice marked **In progress** in `agent-queue.md` at start
- [ ] Local proof commands pass
- [ ] User-facing commands in root `README.md` CI section if added
- [ ] `automation-ops-plan.md` phase tracker row updated (Status → done when merged)
- [ ] `session-close` run before ending

## Forbidden in Lane 1 PRs

- Unrelated product behavior (except guard scripts, baselines, Maestro, testIDs, lint fixes for the slice)
- Weakening eslint `--max-warnings 0`
- Disabling/skipping integration tests
- `ignoreBuildErrors: true` without follow-up slice to remove
- Production deploy or Vercel/Railway/Supabase config without explicit user approval
- Enabling offline guard `--strict` without runbook phase bump (1.O.2)

## Parallel feature work

While this PR is open on `apps/marketing/`, no Lane 3 agent should edit `apps/marketing/`. Other apps are OK.

## Review

CI YAML diff + local command parity. Use `review-feature` only if product behavior changed.
