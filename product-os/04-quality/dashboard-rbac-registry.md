# Dashboard RBAC registry

Code mirror: `apps/dashboard-product/lib/dashboardRbacRegistry.ts` + `lib/rbac.ts`  
Guard: `npm run qa:structural` in dashboard-product

## Tenant roles (`TenantRole`)

| Role | Primary use |
|------|-------------|
| `exporter` | Tier-2 aggregation, plots, farmers, compliance |
| `importer` | Downstream approval, TRACES submit |
| `cooperative` | Cooperative plot/farmer management |
| `country_reviewer` | Compliance review + manual classify |
| `sponsor` | Network sponsor (tier-4 permissions) |

Permission strings use **`resource:action`** colon format in `lib/rbac.ts` (`packages:view`, `plots:edit`, `audit:export`, …).

## Backend JWT alignment

| Dashboard `TenantRole` | Backend `AppRole` |
|------------------------|-------------------|
| `exporter` | `exporter` |
| `cooperative` | `cooperative` |
| `country_reviewer` | `country_reviewer` |
| `importer` | dashboard-only persona (no 1:1 JWT role) |
| `sponsor` | dashboard-only persona (tier-4) |

Backend JWT workspace roles also include `admin` and `compliance_manager` (not `TenantRole` values).

Guard: `dashboard-backend-role-parity-guard.mjs`

## Shipment status transitions

Canonical statuses: `DRAFT`, `READY`, `SEALED`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, `ARCHIVED`, `ON_HOLD`.

Enforced in `canTransitionPackage()` in `lib/rbac.ts` — do not bypass in UI.

## Navigation ↔ permissions

Every `NAVIGATION_ITEMS[].permission` must be granted to at least one role in `PERMISSION_MATRIX`.

## Legacy doc note

`PERMISSIONS_MATRIX.md` uses dot-notation keys (`dds.write`) for human planning. **Runtime source of truth is `lib/rbac.ts`.** Update this registry when changing `CommercialPermission` or role matrices.

## Adding a permission

1. Add to `CommercialPermission` union in `lib/rbac.ts`.
2. Grant in `PERMISSION_MATRIX` / tier matrix for affected roles.
3. Wire `NAVIGATION_ITEMS` or page guard with `hasPermission`.
4. Add row here + run `npm run qa:structural`.
