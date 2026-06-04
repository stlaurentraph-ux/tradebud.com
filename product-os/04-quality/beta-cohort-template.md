# Controlled Beta — Cohort Template

Copy one row per tenant. Approve in product + ops before enablement.

| Field | Cohort A (dogfood) | Cohort B (external) |
|-------|-------------------|---------------------|
| Tenant ID | `TBD` | `TBD` |
| Organization name | Internal dogfood | `TBD` |
| Primary role mix | cooperative + exporter | cooperative / exporter / importer |
| Admin contact | `TBD` | `TBD` |
| Support channel | `#tracebud-beta-internal` | `TBD` |
| Beta acknowledgment signed | ☐ | ☐ |
| Entitlements reviewed | ☐ | ☐ |
| Enable date (UTC) | `TBD` | `TBD` |
| Rollback owner | `TBD` | `TBD` |

## Enablement checklist (per tenant)

1. Tenant exists in `admin_organizations` with correct country/role setup.
2. Feature entitlements reviewed (`tenant_feature_entitlements`).
3. At least one cooperative + one exporter (or importer) user invited and onboarded.
4. Smoke paths executed: login → dashboard → plots list → package detail → compliance readiness.
5. Cool Farm V2 ops smoke (if tenant uses integrations): summary load, claim/release on test run.
6. Telemetry spot-check: onboarding + gated-route events visible for tenant.

## Stop / hold triggers

- Cross-tenant data visible in any surface.
- Sustained 5xx on auth or core harvest/plots APIs for the tenant.
- Missing audit row for privileged admin/integration mutation.
