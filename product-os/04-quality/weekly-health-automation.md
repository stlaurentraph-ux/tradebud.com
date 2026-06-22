# Weekly health Cursor Automation (slice 3.3)

Monday ops digest: read the latest **Release health gate** run + main CI snapshot → append summary to `daily-log.md` → open a docs PR.

**Manifest:** `weekly-health-automation.json`  
**Agent command:** `.cursor/commands/weekly-health-summary.md`  
**CI guard:** `npm run weekly:health:assert`  
**Upstream gate:** `.github/workflows/release-health-gate.yml` (Monday 09:00 UTC)

## Purpose

Complements:

| Loop | Trigger | Action |
|------|---------|--------|
| **3.1** | CI failed on PR | Fix regression PR |
| **3.2** | Sentry issue (staging) | Triage + fix PR |
| **3.3** | Weekly cron | Ops digest → `daily-log.md` |
| **4.7** | Release health gate | GO/NO-GO machine verdict |

3.3 does **not** fix code. It records promote-readiness evidence for the founder and keeps Product OS status logs current.

## Cursor Automation spec (create in editor)

| Field | Value |
|-------|--------|
| **Name** | Weekly health summary |
| **Description** | Monday ops digest from release health gate + main CI → daily-log PR |
| **Trigger** | Cron — `30 9 * * 1` (Monday **09:30 UTC**, after release-health-gate) |
| **Repo** | `stlaurentraph-ux/tradebud.com` |
| **Branch** | `main` (checkout for read + branch for PR) |
| **Model** | Default cloud agent (Sonnet or equivalent) |
| **Tools** | GitHub CLI access (checks + workflow runs); PR create enabled |
| **Instructions** | Run `.cursor/commands/weekly-health-summary.md` end-to-end |

### Prompt (paste into Automations editor)

```
Weekly health automation (Tracebud slice 3.3).

Follow `.cursor/commands/weekly-health-summary.md` exactly.

Summary:
1. Latest completed Release health gate run on main → verdict + four signals (with run URL).
2. Latest main CI snapshot (Field auth + Marketing required checks).
3. Brief regression scan (production Sentry issue count 7d, open fix-lane PRs).
4. Append `### YYYY-MM-DD (weekly health — automation 3.3)` to product-os/06-status/daily-log.md.
5. If release health NO-GO, add one bullet to product-os/06-status/current-focus.md under Work now.
6. Open PR `[ops] weekly health summary YYYY-MM-DD` — docs only, do not merge.

Constraints: no app code, no workflow edits, no secrets in commits.
```

## Prerequisites

| Prerequisite | Status |
|--------------|--------|
| Release health secrets (4.7) | Required for full gate signals |
| `gh` authenticated in Cloud Agent | Required |
| Release health gate scheduled Mon 09:00 UTC | Runs before this automation |

## Manual validation

After creating the automation in the editor:

- [ ] `npm run weekly:health:assert` passes in CI
- [ ] Run automation once manually (Automations → Run)
- [ ] PR appears with `daily-log.md` entry citing release health run [#27923243984](https://github.com/stlaurentraph-ux/tradebud.com/actions/runs/27923243984) or newer
- [ ] No product code files in the PR diff

## Rollback

Disable or delete the Cursor Automation in the editor. Weekly GitHub **Release health gate** schedule remains independent.
