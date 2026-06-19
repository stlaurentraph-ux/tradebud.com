import { describe, expect, it } from 'vitest';

import {
  getAppRoleFromSession,
  isDashboardWorkspaceRole,
  isDashboardWorkspaceSession,
  shouldBootstrapFieldAppProfile,
} from './fieldAppEligibility';

describe('fieldAppEligibility', () => {
  it('detects dashboard workspace roles', () => {
    expect(isDashboardWorkspaceRole('exporter')).toBe(true);
    expect(isDashboardWorkspaceRole('farmer')).toBe(false);
    expect(isDashboardWorkspaceRole('agent')).toBe(false);
  });

  it('requires bootstrap for dashboard accounts', () => {
    expect(
      shouldBootstrapFieldAppProfile({
        user: { app_metadata: { role: 'cooperative' } },
      } as never),
    ).toBe(true);
    expect(
      shouldBootstrapFieldAppProfile({
        user: { app_metadata: { role: 'farmer' } },
      } as never),
    ).toBe(false);
    expect(
      shouldBootstrapFieldAppProfile({
        user: { app_metadata: {} },
      } as never),
    ).toBe(false);
  });

  it('reads app role from session metadata', () => {
    expect(
      getAppRoleFromSession({
        user: { app_metadata: { role: 'exporter' } },
      } as never),
    ).toBe('exporter');
  });

  it('detects dashboard workspace sessions', () => {
    expect(
      isDashboardWorkspaceSession({
        user: { app_metadata: { role: 'importer' } },
      } as never),
    ).toBe(true);
    expect(
      isDashboardWorkspaceSession({
        user: { app_metadata: { role: 'farmer' } },
      } as never),
    ).toBe(false);
  });
});
