import { describe, expect, it } from 'vitest';
import { validateEudrDdsStatement } from './eudr-dds-validation';

describe('validateEudrDdsStatement', () => {
  it('passes for minimal valid statement', () => {
    const result = validateEudrDdsStatement({
      declarationType: 'import',
      referenceNumber: 'TB-REF-001',
      operator: { name: 'Tracebud Operator' },
      product: { commodity: 'coffee' },
    });
    expect(result).toEqual({ valid: true });
  });

  it('returns path-specific error for missing nested required field', () => {
    const result = validateEudrDdsStatement({
      declarationType: 'import',
      referenceNumber: 'TB-REF-001',
      operator: {},
      product: { commodity: 'coffee' },
    });
    expect(result).toEqual({
      valid: false,
      error: 'statement.operator.name is required.',
    });
  });
});

