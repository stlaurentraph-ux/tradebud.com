# Backend structural contracts

Code mirrors:
- `tracebud-backend/src/auth/backendRoleRegistry.ts`
- `tracebud-backend/src/auth/backendApiAccessRegistry.ts`
- `tracebud-backend/src/audit/backendAuditEventRegistry.ts`
- `tracebud-backend/src/harvest/backendFilingStateRegistry.ts`
- `tracebud-backend/src/compliance/backendPlotComplianceRegistry.ts`

Guards: `npm run qa:structural` in tracebud-backend (`--ci` strict audit scan)

## App roles

| Role | Surface |
|------|---------|
| `farmer`, `agent` | Field app (JWT `app_metadata.role`) |
| `exporter`, `cooperative`, `compliance_manager`, `country_reviewer`, `admin` | Dashboard workspace |

Field roles must stay aligned with offline `fieldRolePermissionRegistry.ts`.

See also: `backend-api-access-registry.md`, `backend-plot-compliance-registry.md`.

## Field cloud audit events

Must match offline `farmerArtifactRegistry.ts` `FIELD_CLOUD_AUDIT_EVENT_TYPES`:

- `producer_attestations_updated`
- `plot_compliance_declared`
- `plot_photos_synced`
- `plot_legal_synced`
- `field_device_preferences_updated`
- `farmer_profile_photo_synced`
- `plot_mapping_draft_saved`
- `plot_mapping_draft_cleared`

## Platform audit events

Full categorized list in `backendAuditEventRegistry.ts` (dashboard, DDS filing, plot, chat, workflow, integrations, consent, inbox, launch, benchmarks). CI strict mode fails on unregistered `audit_log` emit literals in `src/`.

## Filing state transitions

| Domain | States |
|--------|--------|
| DDS preflight | `preflight_blocked`, `preflight_ready` |
| Readiness | `blocked`, `warning_review`, `ready_to_submit` |
| Submission | `submitted` |
| Generation | `package_generated` |

DDS audit phases expand to `dds_package_*_{phase}` events — see `backendFilingStateRegistry.ts`.

## Bundled guards

| Guard | Purpose |
|-------|---------|
| `backend-role-guard` | roles.ts ↔ offline field roles |
| `backend-audit-event-guard` | audit registry ↔ offline + src scan |
| `backend-filing-state-guard` | harvest.service ↔ filing registry |
| `backend-plot-compliance-guard` | plot status registry |
| `backend-api-access-guard` | controller role gates |
| `backend-deploy-smoke-guard` | deploy manifest |
| `stripe-webhook-replay-guard` | billing webhook replay |
| `check-tenure-parse-readiness --static-only` | tenure parse static readiness |
| `check-benchmark-admin-claims` | benchmark admin claims (CI required) |

## Tenant isolation

Ownership integration suite (`test:integration:ownership`) is the runtime gate; do not weaken RLS or controller scope checks without ledger update.
