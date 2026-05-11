import { describe, expect, it } from 'vitest';
import { deriveInterventionCounts, mapBackendStatus } from './sponsor-dashboard-mappers';

describe('sponsor dashboard mappers', () => {
  it('maps backend campaign statuses to programme statuses', () => {
    expect(mapBackendStatus('DRAFT')).toBe('Draft');
    expect(mapBackendStatus('COMPLETED')).toBe('Completed');
    expect(mapBackendStatus('CANCELLED')).toBe('Archived');
    expect(mapBackendStatus('RUNNING')).toBe('Sent');
    expect(mapBackendStatus('QUEUED')).toBe('Sent');
    expect(mapBackendStatus('UNKNOWN')).toBe('Sent');
  });

  it('derives intervention queue counts from organisations and campaigns', () => {
    const counts = deriveInterventionCounts(
      [
        { onboardingCompleteness: 72, fundingCoverage: 'Pass-through' },
        { onboardingCompleteness: 91, fundingCoverage: 'Sponsored' },
        { onboardingCompleteness: 65, fundingCoverage: 'pass-through' },
      ],
      [{ status: 'DRAFT' }, { status: 'RUNNING' }, { status: 'draft' }]
    );

    expect(counts.pendingApprovals).toBe(2);
    expect(counts.uncoveredCoverage).toBe(2);
    expect(counts.belowReadiness).toBe(2);
  });
});
