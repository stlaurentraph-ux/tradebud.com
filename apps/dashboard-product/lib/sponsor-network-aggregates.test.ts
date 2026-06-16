import { describe, expect, it } from 'vitest';
import {
  aggregateCommodityCoverage,
  aggregateCountryCoverage,
  aggregateNetworkRoles,
  computeTransparencyMetrics,
} from './sponsor-network-aggregates';

describe('sponsor-network-aggregates', () => {
  const organisations = [
    { id: '1', name: 'Peru Coop', country: 'Peru', type: 'COOPERATIVE', onboardingCompleteness: 92 },
    { id: '2', name: 'Ghana Export', country: 'Ghana', type: 'EXPORTER', onboardingCompleteness: 74 },
  ];

  const campaigns = [
    { id: 'c1', title: 'Cocoa onboarding 2026', status: 'RUNNING', commodity: 'Cocoa' },
    { id: 'c2', title: 'Coffee evidence drive', status: 'DRAFT', commodity: 'Coffee' },
  ];

  const contacts = [
    { contact_type: 'exporter', country: 'Ghana', status: 'engaged' },
    { contact_type: 'cooperative', country: 'Peru', status: 'invited' },
  ];

  it('aggregates country coverage across organisations and contacts', () => {
    const rows = aggregateCountryCoverage(organisations, contacts);
    expect(rows.find((row) => row.country === 'Peru')).toMatchObject({ organisationCount: 1, contactCount: 1 });
    expect(rows.find((row) => row.country === 'Ghana')).toMatchObject({ organisationCount: 1, contactCount: 1 });
  });

  it('aggregates commodity programmes', () => {
    const rows = aggregateCommodityCoverage(campaigns);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.commodity === 'Cocoa')?.activeProgrammeCount).toBe(1);
  });

  it('aggregates network roles from organisations and contacts', () => {
    const rows = aggregateNetworkRoles(organisations, contacts);
    expect(rows.some((row) => row.roleKey === 'cooperative')).toBe(true);
    expect(rows.some((row) => row.roleKey === 'exporter')).toBe(true);
  });

  it('computes transparency metrics', () => {
    const metrics = computeTransparencyMetrics({
      organisations,
      campaigns,
      contacts,
      totalPlots: 100,
      compliantPlots: 85,
    });
    expect(metrics.countriesCovered).toBe(2);
    expect(metrics.commoditiesTracked).toBe(2);
    expect(metrics.activeContacts).toBe(2);
    expect(metrics.complianceHealthPercent).toBe(85);
  });
});
