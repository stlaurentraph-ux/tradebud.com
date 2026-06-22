import { describe, expect, it } from 'vitest';

import {
  fieldAppBlocksDashboardOAuthSignIn,
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

  it('blocks merged dashboard + Google farmer OAuth sessions', () => {
    expect(
      fieldAppBlocksDashboardOAuthSignIn({
        user: {
          email: 'exporter+demo@tracebud.com',
          app_metadata: { role: 'compliance_manager' },
          identities: [
            {
              provider: 'google',
              identity_data: { email: 'hector@tracebud.com' },
            },
            {
              provider: 'email',
              identity_data: { email: 'exporter+demo@tracebud.com' },
            },
          ],
        },
      } as never),
    ).toBe(true);
  });

  it('allows farmer sessions with matching Google identity', () => {
    expect(
      fieldAppBlocksDashboardOAuthSignIn({
        user: {
          email: 'hector@tracebud.com',
          app_metadata: { role: 'farmer' },
          identities: [
            {
              provider: 'google',
              identity_data: { email: 'hector@tracebud.com' },
            },
          ],
        },
      } as never),
    ).toBe(false);
  });
});
