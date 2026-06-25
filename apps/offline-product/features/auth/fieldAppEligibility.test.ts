import { describe, expect, it } from 'vitest';

import {
  fieldAppBlocksDashboardOAuthSignIn,
  hasOAuthIdentityEmailMismatch,
  isDashboardWorkspaceRole,
  shouldBootstrapFieldAppProfile,
} from './fieldAppEligibility';

describe('fieldAppEligibility', () => {
  it('detects dashboard workspace roles', () => {
    expect(isDashboardWorkspaceRole('cooperative')).toBe(true);
    expect(isDashboardWorkspaceRole('farmer')).toBe(false);
  });

  it('requires bootstrap for dashboard accounts', () => {
    expect(
      shouldBootstrapFieldAppProfile({
        user: { app_metadata: { role: 'cooperative' } },
      } as never),
    ).toBe(true);
  });

  it('allows cooperative dashboard users with matching OAuth identity', () => {
    expect(
      fieldAppBlocksDashboardOAuthSignIn({
        user: {
          email: 'coop.manager@example.com',
          app_metadata: { role: 'cooperative' },
          identities: [
            { provider: 'google', identity_data: { email: 'coop.manager@example.com' } },
          ],
        },
      } as never),
    ).toBe(false);
  });

  it('blocks identity mismatch', () => {
    expect(
      hasOAuthIdentityEmailMismatch({
        user: {
          email: 'desk@coop.example.com',
          identities: [
            { provider: 'google', identity_data: { email: 'personal@gmail.com' } },
          ],
        },
      } as never),
    ).toBe(true);
  });
});
