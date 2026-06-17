import { describe, expect, it } from 'vitest';
import { countCompletedVirginSteps } from './virgin-state-progress';

describe('virgin-state-progress', () => {
  it('unlocks exporter steps progressively', () => {
    expect(countCompletedVirginSteps('exporter', { total_farmers: 0 })).toBe(0);
    expect(countCompletedVirginSteps('exporter', { total_farmers: 2 })).toBe(1);
    expect(countCompletedVirginSteps('exporter', { total_farmers: 2, total_plots: 3 })).toBe(2);
    expect(
      countCompletedVirginSteps('exporter', {
        total_farmers: 2,
        total_plots: 3,
        total_packages: 1,
      }),
    ).toBe(3);
  });

  it('tracks importer network onboarding flags', () => {
    expect(
      countCompletedVirginSteps('importer', {
        contacts_uploaded: true,
        campaign_created: true,
        total_packages: 1,
      }),
    ).toBe(3);
  });

  it('honours exporter onboarding flags when tenant counts are still zero', () => {
    expect(
      countCompletedVirginSteps('exporter', {
        total_farmers: 0,
        total_plots: 0,
        contacts_uploaded: true,
      }),
    ).toBe(1);
    expect(
      countCompletedVirginSteps('exporter', {
        total_farmers: 0,
        total_plots: 0,
        contacts_uploaded: true,
        first_plot_captured: true,
      }),
    ).toBe(2);
  });
});
