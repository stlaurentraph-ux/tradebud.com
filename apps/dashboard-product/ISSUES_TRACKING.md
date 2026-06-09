# Known Issues and TODOs

This document tracks TODO comments found in the codebase that should be converted to tracked issues.

## Integration-Related TODOs

### 1. Mock Data Replacement (lib/integrations-mock-data.ts:4)
- **File**: `lib/integrations-mock-data.ts`
- **Type**: Mock Data Replacement
- **Priority**: Medium
- **Status**: Completed
- **Description**: Integration operations UI now uses `lib/integrations-v2-api` and live V2 proxy routes; legacy mock exports are deprecated.
- **Action**: Closed. Keep `lib/mocks/integrations` only for isolated fixtures/tests.

### 2. Scheduler Section TODOs (components/integrations/scheduler-section.tsx:141, 163)
- **File**: `components/integrations/scheduler-section.tsx`
- **Type**: Feature Implementation
- **Priority**: High
- **Status**: Completed
- **Description**: Scheduler section now uses real API routes for config + trigger execution.
- **Action**: Closed via `/api/integrations/coolfarm-sai/v2/scheduler/config` and `/api/integrations/coolfarm-sai/v2/runs/release-stale/trigger`.

### 3. Run Queue Section TODOs (components/integrations/run-queue-section.tsx:56, 134, 185)
- **File**: `components/integrations/run-queue-section.tsx`
- **Type**: Feature Implementation & API Integration
- **Priority**: High
- **Status**: Completed
- **Description**: Run queue now uses backend summary/retry queue and real claim/release/retry/stale-release operations.
- **Action**: Closed via `/api/integrations/coolfarm-sai/v2/runs/*` proxy routes and live action handlers.

### 4. Run Details Drawer (components/integrations/run-details-drawer.tsx:159)
- **File**: `components/integrations/run-details-drawer.tsx`
- **Type**: API Integration
- **Priority**: Medium
- **Status**: Completed
- **Description**: Run details drawer now fetches run history from V2 runs API and renders timeline from real run lifecycle rows.
- **Action**: Closed via `/api/integrations/coolfarm-sai/v2/questionnaire-drafts/[id]/runs`.

## Package Creation TODOs

### 5. Package Form Validation (app/packages/new/page.tsx:168)
- **File**: `app/packages/new/page.tsx`
- **Type**: Form Validation
- **Priority**: Medium
- **Status**: Completed
- **Description**: Package creation form now validates supplier/season/year/notes with inline field errors and submit guardrails via `lib/package-create-validation.ts`.
- **Action**: Closed for client-side validation; backend voucher-backed create wiring remains a separate slice.

## Summary

- **Total TODOs**: 7
- **High Priority**: 0
- **Medium Priority**: 0
- **Critical Path**: Integration API calls and mock data replacement

## Recommended Next Steps

1. Replace remaining medium-priority mocks with contract-backed APIs where available.
2. Implement comprehensive form validation in package creation.
3. Expand run timeline with first-class audit events once API endpoint is available.
