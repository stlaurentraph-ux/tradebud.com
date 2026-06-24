// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildCreateAccountHrefFromSearchParams,
  buildHarvestClaimPath,
  clearPendingDeliveryClaimRef,
  extractClaimFromNextPath,
  persistPendingDeliveryClaimRef,
  readPendingDeliveryClaimRef,
  resolvePostAuthIntakeRedirect,
} from './delivery-intake-redirect';

describe('delivery-intake-redirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('builds harvest claim path', () => {
    expect(buildHarvestClaimPath('V-ABC12345')).toBe('/harvests?claim=V-ABC12345');
  });

  it('persists and reads pending claim ref', () => {
    persistPendingDeliveryClaimRef('T-TRIP1234');
    expect(readPendingDeliveryClaimRef()).toBe('T-TRIP1234');
    clearPendingDeliveryClaimRef();
    expect(readPendingDeliveryClaimRef()).toBeNull();
  });

  it('extracts claim from next path', () => {
    expect(extractClaimFromNextPath('/harvests?claim=V-XYZ')).toBe('V-XYZ');
    expect(extractClaimFromNextPath('/packages/new')).toBeNull();
  });

  it('resolves post-auth redirect from query or session', () => {
    persistPendingDeliveryClaimRef('V-STORED');
    expect(resolvePostAuthIntakeRedirect(null, '/?welcome=1')).toBe('/harvests?claim=V-STORED');
    expect(readPendingDeliveryClaimRef()).toBeNull();
    expect(resolvePostAuthIntakeRedirect('T-QUERY', '/?welcome=1')).toBe('/harvests?claim=T-QUERY');
    expect(resolvePostAuthIntakeRedirect(null, '/?welcome=1')).toBe('/?welcome=1');
  });

  it('builds create-account href from search params', () => {
    expect(
      buildCreateAccountHrefFromSearchParams({
        get: (key) => (key === 'claim' ? 'V-ABC' : null),
      }),
    ).toBe('/create-account?claim=V-ABC');
    expect(
      buildCreateAccountHrefFromSearchParams({
        get: (key) => (key === 'next' ? '/harvests?claim=T-TRIP' : null),
      }),
    ).toBe('/create-account?claim=T-TRIP');
    expect(
      buildCreateAccountHrefFromSearchParams({
        get: () => null,
      }),
    ).toBe('/create-account');
  });
});
