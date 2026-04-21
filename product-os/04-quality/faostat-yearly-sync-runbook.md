# FAOSTAT Yearly Sync Runbook

## Purpose

Run FAOSTAT benchmark refresh once per year, keep import auditable, and preserve dual-control activation.

## Cadence

- **Yearly** (FAOSTAT annual publication cadence).
- Recommended window: January after FAOSTAT annual dataset publication.

## Preconditions

- Active benchmark-admin JWT (`ADMIN` or `COMPLIANCE_MANAGER`) in `TRACEBUD_BENCHMARK_ADMIN_JWT`.
- API base URL set in `TRACEBUD_API_BASE_URL`.
- Second approver account available for activation.

## Execution

1) Run yearly dry-run:

```bash
cd tracebud-backend
TRACEBUD_API_BASE_URL="http://localhost:4000/api" \
TRACEBUD_BENCHMARK_ADMIN_JWT="<admin-jwt>" \
TRACEBUD_FAOSTAT_SYNC_YEAR="2025" \
TRACEBUD_FAOSTAT_SYNC_DRY_RUN="true" \
npm run benchmarks:faostat:yearly-sync
```

2) Human review:
- Validate per-geography import counts and anomalies.
- Confirm no unexpected geography/commodity keys.

3) Write import (non-dry-run):

```bash
TRACEBUD_FAOSTAT_SYNC_DRY_RUN="false" npm run benchmarks:faostat:yearly-sync
```

4) Dual-control activation:
- First admin runs import.
- Second admin activates drafts via `POST /v1/yield-benchmarks/{id}/activate`.

5) Post-run verification:
- `GET /v1/yield-benchmarks?active=true`
- check `import-runs` telemetry and activation audit events.

## Automation

- GitHub workflow: `.github/workflows/faostat-yearly-sync-dry-run.yml`
- Trigger modes:
  - scheduled yearly dry-run
  - manual dispatch with year override

## Rollback and recovery

- Do not activate questionable drafts.
- Re-import corrected rows and activate with second approver.
- If needed, deactivate/replace via controlled benchmark governance workflow.
