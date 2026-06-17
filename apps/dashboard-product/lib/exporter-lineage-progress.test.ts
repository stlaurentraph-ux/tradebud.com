import { describe, expect, it } from 'vitest';
import {
  buildExporterLineageSteps,
  countExporterLineageCompletedSteps,
  isExporterLineageComplete,
} from './exporter-lineage-progress';

describe('exporter-lineage-progress', () => {
  it('marks steps complete as exporter data accumulates', () => {
    const steps = buildExporterLineageSteps({
      total_farmers: 2,
      total_plots: 3,
      total_packages: 1,
      packages_by_status: { READY: 0, SEALED: 0 },
    });
    expect(steps.map((step) => step.completed)).toEqual([true, true, true, false]);
    expect(countExporterLineageCompletedSteps(steps)).toBe(3);
    expect(isExporterLineageComplete({ total_farmers: 2, total_plots: 3, total_packages: 1, packages_by_status: { SEALED: 1 } })).toBe(true);
  });

  it('exposes CTA hrefs for incomplete steps', () => {
    const steps = buildExporterLineageSteps({});
    expect(steps[0]?.href).toBe('/contacts/add?mode=csv');
    expect(steps[1]?.href).toBe('/outreach?new=1');
    expect(steps[2]?.href).toBe('/harvests');
    expect(steps[3]?.href).toBe('/packages?status=READY');
  });

  it('marks producer and plot steps from onboarding flags', () => {
    const steps = buildExporterLineageSteps({
      contacts_uploaded: true,
      first_plot_captured: true,
    });
    expect(steps[0]?.completed).toBe(true);
    expect(steps[1]?.completed).toBe(true);
    expect(steps[2]?.completed).toBe(false);
  });
});
