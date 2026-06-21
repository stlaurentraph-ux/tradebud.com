# Release health gate (slice 4.7)

Composite **GO/NO-GO** signal for production promote decisions: main CI required jobs, optional live smoke/uptime probes, and optional Sentry clean window.

**Manifest:** `release-health-gate.json`  
**CI guard:** `npm run release:health:assert`  
**Workflow:** `.github/workflows/release-health-gate.yml`

## Verdict rules

| Signal | Required | Skip when |
|--------|----------|-----------|
| `ci_main` | yes | never — fails closed if GitHub API unavailable in workflow |
| `marketing_post_deploy_smoke` | no | `MARKETING_SMOKE_BASE_URL` unset |
| `uptime_probes` | no | `MARKETING_SMOKE_BASE_URL` unset (uses same base URL family as uptime manifest) |
| `sentry_clean_window` | no | `SENTRY_RELEASE_HEALTH_AUTH_TOKEN` unset |

**GO** when every non-skipped signal is `pass`. **NO-GO** when any required signal fails or any executed optional signal fails.

## Local commands

```bash
# Manifest / wiring guard (Contracts CI)
npm run release:health:assert

# Collect live signals → report JSON (needs secrets for optional signals)
npm run release:health:collect -- --report=/tmp/release-health-report.json

# Evaluate report → exit 0 (GO) or 1 (NO-GO)
npm run release:health:gate -- --report=/tmp/release-health-report.json

# Example report (guard uses this in CI)
npm run release:health:gate -- --report=product-os/04-quality/release-health-report.example.json
```

## GitHub secrets (optional live signals)

| Secret | Purpose |
|--------|---------|
| `MARKETING_SMOKE_BASE_URL` | Marketing smoke + uptime marketing probe |
| `UPTIME_DASHBOARD_BASE_URL` | Dashboard uptime probe override |
| `UPTIME_BACKEND_BASE_URL` | Backend uptime probe override |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Deployment Protection bypass for smoke/uptime |
| `SENTRY_RELEASE_HEALTH_AUTH_TOKEN` | Sentry API token with `project:read` |
| `SENTRY_RELEASE_HEALTH_ORG` | Sentry org slug |
| `SENTRY_RELEASE_HEALTH_PROJECT` | Sentry project slug |

Document names only in PRs — never commit token values.

## Workflow usage

1. GitHub Actions → **Release health gate** → **Run workflow** (manual promote check).
2. Scheduled weekly run (Monday 09:00 UTC) when secrets are configured.
3. Download `release-health-report` artifact for audit evidence.

Human promote remains required until this gate is trusted on consecutive green runs (see `automation-ops-plan.md` §13).
