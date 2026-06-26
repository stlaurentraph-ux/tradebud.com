# Dashboard legal workflow registry

Code mirror: `apps/dashboard-product/lib/dashboardLegalWorkflowRegistry.ts`  
Canonical types: `types/index.ts`  
Runtime: `lib/rbac.ts` (`LEGAL_ROLE_PERMISSION_MATRIX`, `getWorkflowTypeForRole`, `canProceedWithWorkflow`)

## Legal workflow roles

| Role | Workflow type |
|------|----------------|
| `OUT_OF_SCOPE` | `OUT_OF_SCOPE_WORKFLOW` |
| `OPERATOR` | `DDS_WORKFLOW` |
| `MICRO_SMALL_PRIMARY_OPERATOR` | `SIMPLIFIED_DECLARATION_WORKFLOW` |
| `DOWNSTREAM_OPERATOR_FIRST` | `DOWNSTREAM_REFERENCE_WORKFLOW` |
| `DOWNSTREAM_OPERATOR_SUBSEQUENT` | `DOWNSTREAM_REFERENCE_WORKFLOW` |
| `TRADER` | `TRADER_RETENTION_WORKFLOW` |
| `PENDING_MANUAL_CLASSIFICATION` | `MANUAL_HOLD_WORKFLOW` |

Blocked from proceeding: `PENDING_MANUAL_CLASSIFICATION`, `OUT_OF_SCOPE`.

## DDS statuses

`DRAFT`, `READY_TO_SUBMIT`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, `PENDING_CONFIRMATION`, `AMENDMENT_DRAFT`, `AMENDED_SUBMITTED`, `WITHDRAWAL_REQUESTED`, `WITHDRAWN`, `SUPERSEDED`.

## Package compliance statuses

`PENDING`, `PASSED`, `WARNINGS`, `BLOCKED`.

## When changing filing/legal UI

1. Update `types/index.ts` + registry mirror.
2. Wire `getWorkflowTypeForRole` / legal permission matrix if role behavior changes.
3. Run `npm run qa:structural`.
