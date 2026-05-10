# Known Issues and TODOs

This document tracks TODO comments found in the codebase that should be converted to tracked issues.

## Integration-Related TODOs

### 1. Mock Data Replacement (lib/integrations-mock-data.ts:4)
- **File**: `lib/integrations-mock-data.ts`
- **Type**: Mock Data Replacement
- **Priority**: Medium
- **Description**: Replace all mock integration data with actual API calls when backend is ready
- **Action**: Replace mock data generation functions with real API endpoints

### 2. Scheduler Section TODOs (components/integrations/scheduler-section.tsx:141, 163)
- **File**: `components/integrations/scheduler-section.tsx`
- **Type**: Feature Implementation
- **Priority**: High
- **Description**: Multiple TODOs related to scheduler UI and token configuration
  - Line 141: Implement token configuration UI
  - Line 163: Implement trigger result display
- **Action**: Complete scheduler configuration panel implementation

### 3. Run Queue Section TODOs (components/integrations/run-queue-section.tsx:56, 134, 185)
- **File**: `components/integrations/run-queue-section.tsx`
- **Type**: Feature Implementation & API Integration
- **Priority**: High
- **Description**: Multiple TODOs for run queue management
  - Line 56: Implement queue filtering
  - Line 134: Implement run details fetching
  - Line 185: Implement claim/release actions
- **Action**: Complete run queue operations

### 4. Run Details Drawer (components/integrations/run-details-drawer.tsx:159)
- **File**: `components/integrations/run-details-drawer.tsx`
- **Type**: API Integration
- **Priority**: Medium
- **Description**: Replace mock timeline with actual audit events from API
- **Action**: Fetch real timeline events from `/api/audit-events`

## Package Creation TODOs

### 5. Package Form Validation (app/packages/new/page.tsx:168)
- **File**: `app/packages/new/page.tsx`
- **Type**: Form Validation
- **Priority**: Medium
- **Description**: Implement advanced package validation and error handling
- **Action**: Add comprehensive form validation rules

## Summary

- **Total TODOs**: 7
- **High Priority**: 2
- **Medium Priority**: 4
- **Critical Path**: Integration API calls and mock data replacement

## Recommended Next Steps

1. Prioritize API integration for scheduler and run queue operations
2. Replace all mock data functions with API calls
3. Implement comprehensive form validation in package creation
4. Add audit event timeline to run details
