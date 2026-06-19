import { describe, expect, it } from 'vitest';

import type { FarmerProfile } from '@/features/state/AppStateContext';
import {
  applyProducerAttestationsToFarmer,
  hasProducerAttestationsComplete,
  mergeFarmerProfileFromDisk,
  mergeFarmerProfileOnUpdate,
} from './farmerDeclarations';

const baseFarmer: FarmerProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  role: 'farmer',
  selfDeclared: false,
};

const completeFarmer: FarmerProfile = applyProducerAttestationsToFarmer(baseFarmer, {
  fpicConsent: true,
  laborNoChildLabor: true,
  laborNoForcedLabor: true,
});

describe('mergeFarmerProfileOnUpdate', () => {
  it('preserves attestations when a partial farmer patch omits them', () => {
    const merged = mergeFarmerProfileOnUpdate(completeFarmer, {
      id: completeFarmer.id,
      name: 'Maria Santos',
      role: 'farmer',
      selfDeclared: false,
    });
    expect(hasProducerAttestationsComplete(merged)).toBe(true);
    expect(merged.name).toBe('Maria Santos');
  });

  it('allows explicit attestation updates', () => {
    const updated = applyProducerAttestationsToFarmer(baseFarmer, {
      fpicConsent: true,
      laborNoChildLabor: true,
      laborNoForcedLabor: true,
    });
    const merged = mergeFarmerProfileOnUpdate(baseFarmer, updated);
    expect(hasProducerAttestationsComplete(merged)).toBe(true);
  });
});

describe('mergeFarmerProfileFromDisk', () => {
  it('keeps in-memory attestations when disk reload is stale', () => {
    const diskFarmer: FarmerProfile = {
      ...baseFarmer,
      name: 'Maria Santos',
    };
    const merged = mergeFarmerProfileFromDisk(completeFarmer, diskFarmer);
    expect(hasProducerAttestationsComplete(merged)).toBe(true);
    expect(merged?.name).toBe('Maria Santos');
  });

  it('prefers newer disk attestations when both sides are complete', () => {
    const memoryFarmer = {
      ...completeFarmer,
      selfDeclaredAt: 100,
    };
    const diskFarmer = {
      ...completeFarmer,
      selfDeclaredAt: 200,
      name: 'Disk name',
    };
    const merged = mergeFarmerProfileFromDisk(memoryFarmer, diskFarmer);
    expect(merged?.name).toBe('Disk name');
    expect(merged?.selfDeclaredAt).toBe(200);
  });
});
