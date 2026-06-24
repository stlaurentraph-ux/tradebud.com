# Field role & permission registry (offline MVP)

Code mirror: `apps/offline-product/features/auth/fieldRolePermissionRegistry.ts`  
Backend: `tracebud-backend/src/auth/roles.ts`  
Guard: `role-permission-guard.mjs`

## Field app roles

| Role | Scope | Sign-in |
|------|-------|---------|
| `farmer` | Own plots, harvests, evidence | Default field app |
| `agent` | Field capture on behalf of farmers | Allowed when JWT role is agent |

## Dual-use (dashboard + field app)

Cooperative, exporter, and other dashboard workspace roles **may** sign into the field app with the same OAuth identity. First sign-in sets `field_app_linked` via `ensureFarmerOAuthProfile`. Enforced in `fieldAppEligibility.ts`.

## Blocked at field app sign-in

- Sandbox demo emails and OAuth identity mismatch (see `hasOAuthIdentityEmailMismatch`).

## Permissions (MVP)

| Permission | Farmer | Agent |
|------------|--------|-------|
| plot:map | ✓ | ✓ |
| plot:edit | ✓ | ✓ |
| plot:sync | ✓ | ✓ |
| harvest:log | ✓ | ✓ |
| evidence:upload | ✓ | ✓ |
| declaration:submit | ✓ | ✓ |
| sync:manual | ✓ | ✓ |
| settings:profile | ✓ | ✓ |
| consent:respond | ✓ | ✓ |

## Adding a permission

1. Add to `FIELD_APP_PERMISSIONS` and role matrix in `fieldRolePermissionRegistry.ts`.
2. Enforce in UI/API call site (explicit check or documented waiver).
3. Update this doc + `npm run qa:structural`.
