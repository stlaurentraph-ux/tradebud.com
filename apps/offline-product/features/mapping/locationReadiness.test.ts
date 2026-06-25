import { describe, expect, it } from 'vitest';

import { evaluateLocationReadiness } from './locationReadiness';

describe('evaluateLocationReadiness', () => {
  it('is ready when permission granted and services enabled', () => {
    expect(evaluateLocationReadiness({ permissionGranted: true, servicesEnabled: true })).toBe('ready');
  });

  it('reports permission_denied when permission is not granted (services irrelevant)', () => {
    expect(evaluateLocationReadiness({ permissionGranted: false, servicesEnabled: true })).toBe(
      'permission_denied',
    );
    expect(evaluateLocationReadiness({ permissionGranted: false, servicesEnabled: false })).toBe(
      'permission_denied',
    );
  });

  it('reports services_off when granted but device Location is disabled (Android hang case)', () => {
    expect(evaluateLocationReadiness({ permissionGranted: true, servicesEnabled: false })).toBe(
      'services_off',
    );
  });
});
