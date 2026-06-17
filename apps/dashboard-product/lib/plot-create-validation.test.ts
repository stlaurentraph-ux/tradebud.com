import { describe, expect, it } from 'vitest';
import { validatePlotCreateInput } from './plot-create-validation';

describe('validatePlotCreateInput', () => {
  const valid = {
    farmerId: 'a3f2c8b1-9d4e-4f7a-b6c5-2e8d1f0a4b9c',
    linkedContactId: 'contact_123',
    clientPlotId: 'PLOT-001',
    declaredAreaHa: '2.5',
    latitude: '14.6349',
    longitude: '-87.8494',
  };

  it('accepts valid exporter point plot input', () => {
    expect(validatePlotCreateInput(valid)).toBeNull();
  });

  it('rejects out-of-range latitude', () => {
    expect(validatePlotCreateInput({ ...valid, latitude: '1234' })).toContain('Latitude must be between');
  });

  it('rejects plots at or above 4 ha for point capture', () => {
    expect(validatePlotCreateInput({ ...valid, declaredAreaHa: '4' })).toContain('walked polygon');
  });

  it('rejects invalid producer UUID', () => {
    expect(validatePlotCreateInput({ ...valid, farmerId: 'not-a-uuid' })).toContain('invalid');
  });

  it('requires a producer from the directory', () => {
    expect(validatePlotCreateInput({ ...valid, linkedContactId: '' })).toContain('Select a producer');
  });
});
