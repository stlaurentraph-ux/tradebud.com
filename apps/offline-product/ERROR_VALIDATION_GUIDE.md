# Quick Reference: New Error Handling & Validation System

## Error Logging

### Basic Usage
```typescript
import { logError } from '@/features/errors/ErrorLogger';
import { getUserMessage } from '@/features/errors/ErrorLogger';

try {
  // risky operation
} catch (error) {
  const classified = logError(error, { context: 'operation_name', userId: '123' });
  
  // Show user-friendly message
  setErrorMessage(getUserMessage(classified));
  
  // User sees: "Network connection issue. Changes will be saved locally and synced when online."
}
```

### Error Categories
- `network` → User sees: "Network connection issue..."
- `auth` → User sees: "Authentication failed. Please check credentials..."
- `validation` → User sees: "Invalid input. Please check your data..."
- `server` → User sees: "Server error. Please try again later..."
- `unknown` → User sees: "An unexpected error occurred..."

### Accessing Error Log
```typescript
import { getErrorLog, exportErrorLog } from '@/features/errors/ErrorLogger';

// Get last 10 errors
const recentErrors = getErrorLog(10);

// Export as JSON for debugging
const logJson = exportErrorLog();
console.log(logJson);
```

---

## Input Validation

### Harvest Weight
```typescript
import { validateHarvestKg } from '@/features/validation/validators';

const result = validateHarvestKg(userInput);
if (!result.ok) {
  setError(result.error); // "Harvest weight must be greater than 0"
  return;
}
// result.value is the validated, rounded number
await postHarvestToBackend({ kg: result.value, ... });
```

### GPS Coordinates
```typescript
import { validateGpsCoordinates } from '@/features/validation/validators';

const result = validateGpsCoordinates(latitude, longitude);
if (!result.ok) {
  console.error(result.error);
  return;
}
// result.value has { latitude, longitude }
```

### Other Validators
```typescript
// Postal address (5-500 chars)
validatePostalAddress('123 Main St, City')

// Email
validateEmail('user@example.com')

// Commodity code
validateCommodityCode('070111')

// Plot area (0-10,000 ha)
validatePlotAreaHa(2.5)

// Boolean consent
validateConsent(true)

// Required string field
validateRequired(value, 'Field Name')
```

All validators return `{ ok: true, value: T }` or `{ ok: false, error: string }`.

---

## API Modules

### Auth Module
```typescript
import {
  getAccessTokenFromSupabase,
  hydrateSyncAuthFromSettings,
  saveAndApplySyncAuth,
  clearPersistedSyncAuth,
  testBackendLogin,
} from '@/features/api/auth';

// On app start
await hydrateSyncAuthFromSettings();

// User signs in
await saveAndApplySyncAuth('user@example.com', 'password');

// Verify connection
const result = await testBackendLogin();
if (!result.ok) console.error(result.message);

// User signs out
await clearPersistedSyncAuth();
```

### Plots Module
```typescript
import {
  postPlotToBackend,
  fetchPlotsForFarmer,
  syncPlotPhotosToBackend,
  runComplianceCheckForPlot,
} from '@/features/api/plots';

// Create plot
const result = await postPlotToBackend({
  farmerId: '123',
  clientPlotId: 'local-123',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  declaredAreaHa: 2.5,
});

// Fetch server plots
const plots = await fetchPlotsForFarmer('farmer-id');

// Sync photos
await syncPlotPhotosToBackend({
  plotId: 'plot-123',
  kind: 'ground_truth',
  photos: [...],
});
```

### Harvest Module
```typescript
import {
  postHarvestToBackend,
  fetchVouchersForFarmer,
  createDdsPackageForFarmer,
} from '@/features/api/harvest';

// Record harvest (with automatic validation)
await postHarvestToBackend({
  farmerId: '123',
  plotId: 'plot-123',
  kg: 100, // validated at module boundary
});

// Get vouchers
const vouchers = await fetchVouchersForFarmer('farmer-id');

// Create DDS package
const pkg = await createDdsPackageForFarmer({
  farmerId: '123',
  voucherIds: ['v1', 'v2', 'v3'],
});
```

### Audit Module
```typescript
import { logAuditEvent, postAuditEventToBackend } from '@/features/api/audit';

// Log farmer profile change
const success = await logAuditEvent(
  'farmer_profile_updated',
  { farmerId: '123', fieldsChanged: ['name', 'email'] },
  'device-id-optional'
);

// Or use raw API
const result = await postAuditEventToBackend({
  eventType: 'declaration_submitted',
  payload: { bundleId: 'b123', status: 'pending' },
});
if (result.ok) console.log('Event logged:', result.id);
```

---

## Testing

### Running Tests
```bash
cd apps/offline-product
npm test -- --testPathPattern="testing"
```

### Writing Tests
```typescript
import { createMockFarmer, createMockPlot, createMockHarvest } from '@/features/testing/testUtils';

// Generate test data
const farmer = createMockFarmer({ name: 'Alice' });
const plot = createMockPlot({ farmerId: farmer.id });
const harvest = createMockHarvest({ plotId: plot.id, kg: 50 });
```

---

## Common Patterns

### Handle All Error Cases
```typescript
import { logError, getUserMessage } from '@/features/errors/ErrorLogger';

try {
  await riskyOperation();
} catch (error) {
  const classified = logError(error, { context: 'operation' });
  setUserError(getUserMessage(classified));
  
  // For debugging, check category
  if (classified.category === 'network') {
    // Queue for retry
  } else if (classified.category === 'auth') {
    // Force re-login
    router.push('/settings');
  }
}
```

### Validate Before Sending
```typescript
import { validateHarvestKg } from '@/features/validation/validators';
import { logError } from '@/features/errors/ErrorLogger';
import { postHarvestToBackend } from '@/features/api/harvest';

const validation = validateHarvestKg(userInput);
if (!validation.ok) {
  setError(validation.error);
  return;
}

try {
  await postHarvestToBackend({ kg: validation.value, ... });
} catch (error) {
  logError(error, { context: 'harvest' });
}
```

---

## Migration Checklist

- [ ] Review all `try-catch` blocks for silent `.catch(() => undefined)` patterns
- [ ] Replace with `logError()` calls
- [ ] Add input validation before data submission
- [ ] Update error message handling to use `getUserMessage()`
- [ ] Import from specific domain modules (auth, plots, harvest, audit)
- [ ] Add error context when logging for better debugging
- [ ] Run tests: `npm test`

---

For more details, see `IMPLEMENTATION_SUMMARY.md`
