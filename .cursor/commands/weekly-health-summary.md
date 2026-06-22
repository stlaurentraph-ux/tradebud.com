# weekly-health-summary

Lane 1 ops — weekly promote-readiness digest (automation slice **3.3**). **No feature work.**

## When to use

- Cursor Automation **Weekly health summary** (Monday cron)
- Manual: founder asks for weekly ops snapshot

## Mandatory read-order

1. `product-os/04-quality/weekly-health-automation.md`
2. `product-os/04-quality/release-health-gate.md`
3. `product-os/06-status/automation-ops-plan.md` (Lane 1 ops)

## Branch and scope

- Branch: `chore/weekly-health-YYYY-MM-DD` from latest `origin/main`
- **Docs only** — edit `product-os/06-status/daily-log.md` and, if needed, one bullet in `product-os/06-status/current-focus.md`
- Do **not** change app code, CI workflows, or secrets
- Max ~80 lines added to `daily-log.md`

## Data collection (in order)

### 1. Release health gate (primary)

Find the latest **completed** GitHub Actions run of workflow **Release health gate** on `main`:

```bash
gh run list --workflow=release-health-gate.yml --branch=main --limit=5
gh run view <run-id> --log | rg '\[(pass|fail|skip)\]|Verdict'
```

Prefer a run from the **last 7 days**. If none completed, note `release health gate: no recent run`.

Record:

- Run URL
- Verdict (`GO` / `NO-GO`)
- Each signal: `ci_main`, `marketing_post_deploy_smoke`, `uptime_probes`, `sentry_clean_window` with status + detail

Optional: download artifact `release-health-report` from that run if logs are truncated.

### 2. Main CI snapshot (secondary)

Latest **completed** `CI` workflow run on `main`:

```bash
gh run list --workflow=ci.yml --branch=main --limit=3
gh pr checks $(gh run view <run-id> --json databaseId -q .databaseId) 2>/dev/null || gh run view <run-id>
```

Summarize required checks: **Field auth**, **Marketing** (and note if dashboard/backend/workspace jobs failed but are non-blocking).

### 3. Open regression signals (tertiary, brief)

- Unresolved **production** Sentry issues in `javascript-nextjs` from the last 7 days (count only; link to Sentry issues search) — skip if Sentry MCP unavailable
- Open PRs labeled `lane:fix` or with failing required checks (count + links)

## Write-up

Append to **`product-os/06-status/daily-log.md`** (newest section at top, after any stray lines):

```markdown
### YYYY-MM-DD (weekly health — automation 3.3)

- **Release health** — [GO|NO-GO] — [run link] — signals: …
- **Main CI** — …
- **Regressions** — …
- **Next ops** — one line (from agent-queue Ready or current-focus)
```

If release health is **NO-GO**, add a single bullet under **Work now** in `current-focus.md` naming the failing signal(s). Do not rewrite the whole file.

## PR

- Title: `[ops] weekly health summary YYYY-MM-DD`
- Body: link release health run + CI run; note docs-only
- Do **not** merge unless user asked — default open PR for founder review

## Acceptance

- [ ] Release health run cited with verdict and four signals
- [ ] Main CI status summarized
- [ ] `daily-log.md` entry appended with date heading
- [ ] PR opened (or user explicitly asked to commit to main)
