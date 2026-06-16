import { describe, expect, it } from 'vitest';
import { getNorthStarForRole } from './dashboard-north-star';

describe('getNorthStarForRole', () => {
  it('prioritizes exporter blockers and yield failures before seal handoff', () => {
    const blockers = getNorthStarForRole('exporter', {
      packages_by_status: { READY: 4, SEALED: 2 },
      blocking_issues_count: 3,
    });
    expect(blockers?.label).toBe('Blocking issues');
    expect(blockers?.value).toBe('3');
    expect(blockers?.ctaHref).toBe('/compliance/issues');

    const yieldFailures = getNorthStarForRole('exporter', {
      packages_by_status: { READY: 4 },
      yield_failures_count: 2,
    });
    expect(yieldFailures?.label).toBe('Yield cap failures');
    expect(yieldFailures?.value).toBe('2');
    expect(yieldFailures?.ctaHref).toBe('/compliance/issues');
  });

  it('frames exporter north star as seal or handoff', () => {
    const ready = getNorthStarForRole('exporter', {
      packages_by_status: { READY: 4, SEALED: 2 },
    });
    expect(ready?.label).toBe('Shipments ready to seal');
    expect(ready?.hint).toContain('importer');

    const sealed = getNorthStarForRole('exporter', {
      packages_by_status: { READY: 0, SEALED: 3 },
    });
    expect(sealed?.label).toBe('Handoff-ready shipments');
  });

  it('frames importer north star as review or TRACES filing', () => {
    const review = getNorthStarForRole('importer', {
      packages_by_status: { READY: 2, ON_HOLD: 1 },
    });
    expect(review?.label).toBe('Awaiting your review');
    expect(review?.hint).toContain('TRACES');

    const filing = getNorthStarForRole('importer', {
      packages_by_status: { READY: 0, ON_HOLD: 0, SEALED: 5 },
    });
    expect(filing?.ctaLabel).toBe('Prepare TRACES submission');
  });

  it('never assigns TRACES CTA to exporter', () => {
    const config = getNorthStarForRole('exporter', {
      packages_by_status: { SEALED: 5 },
    });
    expect(config?.ctaLabel.toLowerCase()).not.toContain('traces');
  });

  it('uses cooperative and reviewer north star label helpers', () => {
    const cooperative = getNorthStarForRole('cooperative', {
      total_plots: 10,
      compliant_plots: 6,
      members_missing_consent: 2,
      incoming_requests_pending: 1,
    });
    expect(cooperative?.label).toBe('Member actions needed');
    expect(cooperative?.ctaHref).toBe('/inbox');

    const reviewer = getNorthStarForRole('country_reviewer', {
      packages_by_status: { READY: 3 },
      blocking_issues_count: 1,
    });
    expect(reviewer?.ctaLabel).toBe('Start reviewing');
  });
});
