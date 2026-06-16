# FEAT: Multi-role organisation setup

## Problem

Real supply chain actors often perform more than one persona in a single legal entity:

- **Cooperative + exporter** — members and export desk in one org
- **Brand + exporter + importer** — origin aggregation and EU filing in one tenant

Previously each tenant mapped to a single `active_role` from signup `primary_role`.

## Model

| Layer | Field | Purpose |
|-------|-------|---------|
| Persistence | `tenant_commercial_profiles.supply_chain_roles[]` | `cooperative`, `exporter`, `importer` |
| Session | `user.roles[]` | Enabled dashboard personas |
| Session | `user.active_role` | Current UI workflow (sidebar switcher) |
| Workflow | `legal_role` per shipment | EUDR legal role remains per workflow, not org label |

## UX

1. **Signup step 2** — multi-select supply chain roles + common presets
2. **Post-login onboarding wizard** (`/create-account`) — same multi-select + presets on workspace step
3. **Settings → Organisation** — `OrgSupplyChainRolesPanel` with one-click presets
4. **Sidebar** — role switcher when `user.roles.length > 1`

## API

- `PATCH /v1/launch/supply-chain-roles` — persist roles array (min 1)
- Dashboard BFF: `PATCH /api/launch/supply-chain-roles`

## Acceptance criteria

- [x] Tenant can enable cooperative + exporter in one org
- [x] Tenant can enable exporter + importer (brand) in one org
- [x] Sidebar switcher reflects saved roles after profile load
- [x] Audit event `supply_chain_roles_updated` on change
- [ ] Per-workflow legal role classification UI (existing role-decisions flow)

## Migration

`tracebud-backend/sql/tb_v16_045_tenant_supply_chain_roles.sql`
