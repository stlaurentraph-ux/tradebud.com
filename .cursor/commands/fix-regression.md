# fix-regression

Lane 2 maintenance — fix a reported regression only. No feature work.

## When to use

- Sentry issue (staging/production)
- CI failure on `main` or your open PR
- Staging smoke failure
- User-reported production bug with clear repro

## Mandatory read-order

1. `product-os/06-status/automation-ops-plan.md` (Lane 2 section)
2. Relevant app README and quality doc for the affected surface
3. Failing CI log or Sentry issue (use Sentry MCP when available)

## Branch and scope

- Branch: `fix/<short-kebab>` from latest `main`
- **Max ~200 lines** unless user approves escalation
- Touch only files required for the fix
- Do **not** change `.github/workflows` to make unrelated failures pass
- Do **not** refactor, rename, or add features

## Fix checklist

- [ ] Reproduce or confirm failure from log/issue evidence
- [ ] Root cause identified (symptom vs cause documented in PR)
- [ ] Minimal fix applied
- [ ] `npm run lint` + `npm test` (+ `npm run build` if dashboard/marketing/backend touched) pass for affected workspace
- [ ] New test or regression guard if this bug class could recur
- [ ] `product-os/06-status/daily-log.md` updated if user-visible behavior changed

## PR title

`[fix] <surface>: <one-line cause>`

## After merge

If Sentry-sourced: resolve or link issue. If CI-sourced: confirm `main` green on next run.
