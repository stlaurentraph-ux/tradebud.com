/**
 * OFFLINE-PRODUCT APP: POST-REFACTORING TESTING GUIDE
 *
 * This guide covers all test suites added and how to run them.
 */

## Test Suites Overview

### 1. **Validator Tests** (`validators.test.ts`)
Tests all input validation functions for harvest data, GPS coordinates, addresses, etc.

**Run:**
```bash
npm test -- validators.test.ts
```

**Coverage:**
- validateHarvestKg: 5 test cases
- validateGPSCoordinates: 4 test cases
- validatePostalAddress: 3 test cases
- validateCommodityCode: 2 test cases
- Custom validators: 7 test cases

**Key tests:**
- Boundary values (0, max values, negative)
- Invalid types (null, undefined, strings)
- Out-of-range values

### 2. **Error Logger Tests** (`errorLogger.test.ts`)
Tests error classification, logging, and recovery.

**Run:**
```bash
npm test -- errorLogger.test.ts
```

**Coverage:**
- Error classification: 4 types (network, auth, server, unknown)
- Message formatting for user display
- In-memory log management (FIFO with max 50)
- Error stacking for debugging

**Key tests:**
- Network error detection
- Auth/401 error handling
- Server/5xx error handling
- Log trimming when full

### 3. **API Integration Tests** (`api.integration.test.ts`)
Tests interaction between validators, error handlers, and API calls.

**Run:**
```bash
npm test -- api.integration.test.ts
```

**Coverage:**
- 22 integration test cases
- Validation → API call pipeline
- Error handling across modules
- End-to-end harvest recording flow

**Key tests:**
- Happy path: valid input → successful API call → response parsing
- Sad path: validation failure → no API call
- Mixed: partial validation failure + API fallback
- Error types at each step (validation, network, parsing)

### 4. **State Management Tests** (New PlotsContext & FarmerContext)
Planned tests for split contexts (to be written).

**Scope:**
- FarmerContext mutations (setFarmer, updateFarmer, updateProfilePhoto)
- PlotsContext mutations (addPlot, updatePlot, removePlot)
- Callback memoization
- Error handling on persist failures
- Audit logging integration

## Running All Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific suite
npm test -- validators.test.ts
npm test -- errorLogger.test.ts
npm test -- api.integration.test.ts
```

## Integration Test Examples

### Example 1: Valid Harvest Submission
```typescript
// Input validation passes
validateHarvestKg('500') // ✓ OK
validateGPSCoordinates(-15.78, -47.88) // ✓ OK

// API call succeeds
POST /api/harvests with validated data
// Response: { id: 'harvest-123', kg: 500, ... }
```

### Example 2: Invalid Input Handling
```typescript
// Validation fails early
validateHarvestKg('not-a-number')
// ✗ Validation error returned
// ✓ No API call made
// ✓ User sees error message
```

### Example 3: Network Error Recovery
```typescript
// Validation passes
validateHarvestKg('500') // ✓ OK

// API call fails (network timeout)
safeFetch('/api/harvests', ...) with timeout=50
// ✗ Network error classified
// ✓ Logged with context
// ✓ User-friendly message returned
```

## Manual Testing Checklist

### Harvest Recording Flow
- [ ] Open Harvests tab
- [ ] Enter valid weight (e.g., 500 kg)
- [ ] Submit → Should succeed
- [ ] Enter invalid weight (e.g., "abc")
- [ ] Submit → Should show validation error
- [ ] Check error message is clear to user

### Farmer Profile Updates
- [ ] Edit farmer profile
- [ ] Change name, address, commodity
- [ ] Submit → Should persist
- [ ] Reload app → Changes preserved
- [ ] Check audit logs logged errors

### Offline Scenario
- [ ] Disable network (airplane mode)
- [ ] Record harvest → Should queue locally
- [ ] Re-enable network → Should sync
- [ ] Check app handles network errors gracefully

### State Performance (After Migration)
- [ ] Edit farmer name → Plot screens should not re-render
- [ ] Add plot → Profile screens should not re-render
- [ ] Both changes → Only affected screens re-render

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - run: npm test -- --ui  # Optional: Generate HTML report
```

## Test Metrics

| Suite | Test Cases | Coverage |
|-------|-----------|----------|
| validators.test.ts | 21 | ~95% of validators.ts |
| errorLogger.test.ts | 16 | ~90% of ErrorLogger.ts |
| api.integration.test.ts | 22 | ~80% of API flows |
| **Total** | **59** | **~85% of core features** |

## Debugging Failed Tests

### Validator Test Fails
```bash
npm test -- validators.test.ts -- --reporter=verbose

# Check: Does input format match expectation?
# Check: Is boundary value correct?
```

### Error Logger Test Fails
```bash
npm test -- errorLogger.test.ts -- --reporter=verbose

# Check: Was error classified correctly?
# Check: Is log rotation working (max 50)?
```

### API Integration Test Fails
```bash
npm test -- api.integration.test.ts -- --reporter=verbose

# Check: Mock fetch is set up correctly?
# Check: Response format matches expectation?
# Check: Error classification matches error type?
```

## Adding New Tests

To add tests for a new feature:

1. Create `features/testing/feature.test.ts`
2. Import test utilities from `testUtils.ts`
3. Use consistent naming: `describe('Feature X', ...)`
4. Aim for 70%+ coverage of the feature
5. Include both happy and sad paths
6. Test error handling explicitly

Example:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { validateMyFeature } from '../validation/validators';

describe('My Feature Validation', () => {
  it('should validate correct input', () => {
    const result = validateMyFeature('valid-input');
    expect(result.ok).toBe(true);
  });

  it('should reject invalid input', () => {
    const result = validateMyFeature('invalid-input');
    expect(result.ok).toBe(false);
  });
});
```

## Coverage Goals

- **Validators**: 95%+ (critical path)
- **Error Handling**: 90%+ (user experience)
- **API Integration**: 80%+ (complex flows)
- **State Management**: 85%+ (after migration)
- **Overall**: 75%+ (maintainability threshold)

## Resources

- **Vitest Docs**: https://vitest.dev
- **Testing Library**: https://testing-library.com
- **Mock API Responses**: See `testUtils.ts` for helpers
- **Error Scenarios**: See `api.integration.test.ts` for examples
