/**
 * STATE MANAGEMENT REFACTORING - MIGRATION GUIDE
 *
 * We've split AppStateContext into three focused contexts:
 * 1. FarmerContext - Farmer profile & auth state
 * 2. PlotsContext - Plot operations & data
 * 3. AppStateContext - Backward-compatible wrapper (deprecated)
 *
 * This migration reduces unnecessary re-renders and improves performance.
 */

## Quick Migration Reference

### Before (AppStateContext)
```tsx
import { useAppState } from '@/features/state/AppStateContext';

function MyComponent() {
  const { farmer, plots, setFarmer, addPlot } = useAppState();
  // ANY farmer or plot change causes re-render!
  return <Text>{farmer?.name}, {plots.length} plots</Text>;
}
```

### After (Split Contexts)
```tsx
import { useFarmer } from '@/features/state/FarmerContext';
import { usePlots } from '@/features/state/PlotsContext';

function MyComponent() {
  // Only re-renders when farmer changes
  const { farmer, setFarmer } = useFarmer();
  // Only re-renders when plots change
  const { plots, addPlot } = usePlots();
  return <Text>{farmer?.name}, {plots.length} plots</Text>;
}
```

## Setup Instructions

### 1. Update Root Layout (_layout.tsx)
```tsx
// OLD
import { AppStateProvider } from '@/features/state/AppStateContext';

export default function RootLayout() {
  return (
    <AppStateProvider>
      {/* app content */}
    </AppStateProvider>
  );
}

// NEW
import { FarmerProvider } from '@/features/state/FarmerContext';
import { PlotsProvider } from '@/features/state/PlotsContext';
import { AppStateProvider } from '@/features/state/AppStateContext'; // Optional, for backward compat

export default function RootLayout() {
  return (
    <FarmerProvider>
      <PlotsProvider>
        <AppStateProvider>
          {/* app content */}
        </AppStateProvider>
      </PlotsProvider>
    </FarmerProvider>
  );
}
```

### 2. Update Components

#### Component using farmer data only
```tsx
// BEFORE
function ProfileScreen() {
  const { farmer, setFarmer } = useAppState();
  // ...
}

// AFTER
function ProfileScreen() {
  const { farmer, setFarmer } = useFarmer();
  // ...
}
```

#### Component using plots only
```tsx
// BEFORE
function PlotListScreen() {
  const { plots, addPlot, renamePlot } = useAppState();
  // ...
}

// AFTER
function PlotListScreen() {
  const { plots, addPlot, renamePlot } = usePlots();
  // ...
}
```

#### Component using both (minimal changes)
```tsx
// BEFORE
function DashboardScreen() {
  const { farmer, plots, addPlot } = useAppState();
  // ...
}

// AFTER
function DashboardScreen() {
  const { farmer } = useFarmer();
  const { plots, addPlot } = usePlots();
  // ...
}
```

## API Changes

### FarmerContext
```tsx
// New methods
farmer: FarmerProfile | undefined
setFarmer(farmer: FarmerProfile): void
updateFarmer(patch: Partial<FarmerProfile>): void     // NEW - patch update
updateFarmerProfilePhoto(uri: string | null): void

// Removed (use updateFarmer instead)
// - setFarmerState (no longer exposed)
```

### PlotsContext
```tsx
// Existing methods (same as before)
plots: Plot[]
addPlot(input, farmerId): string | undefined
renamePlot(plotId, newName): void
updatePlot(plotId, patch, farmerId?): void
removePlot(plotId, farmerId?): void

// New methods (performance helpers)
setPlots(plots: Plot[]): void                          // Direct set (for batch updates)
getPlot(plotId): Plot | undefined                      // Query single plot
getPlotsForFarmer(farmerId): Plot[]                    // Query plots by farmer
```

## Migration Checklist

- [ ] Update root layout to nest FarmerProvider -> PlotsProvider -> AppStateProvider
- [ ] Replace `useAppState()` with `useFarmer()` in profile/settings screens
- [ ] Replace `useAppState()` with `usePlots()` in plot listing/editing screens
- [ ] Replace `useAppState()` with both in screens that need farmer AND plots
- [ ] Test screens to verify they re-render only when their respective state changes
- [ ] Remove direct imports of AppStateContext in new code (OK to keep for backward compat in existing code)
- [ ] Update type imports: import { FarmerProfile, PlotPoint, Plot } from FarmerContext and PlotsContext
- [ ] Run tests: npm test

## Performance Benefits

| Scenario | Before (AppStateContext) | After (Split Contexts) |
|----------|--------------------------|----------------------|
| Edit farmer name | Entire app re-renders | Plot components skip re-render |
| Add new plot | Entire app re-renders | Farmer components skip re-render |
| Farmer + Plot tab | Both change -> full re-render | Independent re-renders |

## Backward Compatibility

For now, `AppStateContext` still exists and wraps both FarmerContext and PlotsContext:
```tsx
import { useAppState } from '@/features/state/AppStateContext';

// This still works, but causes unnecessary re-renders
const { farmer, plots, setFarmer, addPlot } = useAppState();
```

Plan to deprecate AppStateContext in next release. Start migrating immediately.

## Error Handling

All context mutations now use `logError()` for proper error tracking:
```tsx
// Before
persistFarmer(farmer).catch(() => undefined);

// After
persistFarmer(farmer).catch((err) => {
  logError(err, { context: 'set_farmer', action: 'persist' });
});
```

## Type Safety

New contexts maintain strict TypeScript support:
```tsx
const { farmer } = useFarmer();
// farmer is FarmerProfile | undefined ✓

const { plots } = usePlots();
// plots is Plot[] ✓

// Mismatched usage now caught at compile time
const { plots } = useFarmer(); // ❌ TypeScript Error
```
