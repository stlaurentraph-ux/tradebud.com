import { describe, expect, it } from 'vitest';
import { isMatureTenantForRole, isVirginTenantForRole } from './dashboard-maturity';

describe('dashboard-maturity', () => {
  it('treats exporter as virgin until producers, plots, and packages exist', () => {
    expect(isVirginTenantForRole('exporter', { total_farmers: 0, total_plots: 0, total_packages: 0 })).toBe(true);
    expect(isVirginTenantForRole('exporter', { total_farmers: 1, total_plots: 0, total_packages: 0 })).toBe(false);
    expect(isVirginTenantForRole('exporter', { total_farmers: 1, total_plots: 2, total_packages: 1 })).toBe(false);
  });

  it('treats importer as virgin until packages or plots exist', () => {
    expect(isVirginTenantForRole('importer', { total_packages: 0, total_plots: 0 })).toBe(true);
    expect(isVirginTenantForRole('importer', { total_packages: 0, total_plots: 3 })).toBe(false);
  });

  it('treats sponsor as mature when network entities exist', () => {
    expect(
      isVirginTenantForRole('sponsor', {
        total_packages: 0,
        total_plots: 0,
        total_farmers: 0,
        organisation_count: 2,
        contact_count: 0,
      }),
    ).toBe(false);
    expect(isMatureTenantForRole('sponsor', { organisation_count: 1 })).toBe(true);
  });
});
