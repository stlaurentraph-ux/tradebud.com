// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildCreateAccountHrefFromSearchParams,
  buildInboxCampaignPath,
  clearPendingSupplierCampaignId,
  extractCampaignFromNextPath,
  findInboxRequestForCampaign,
  persistPendingSupplierCampaignId,
  readPendingSupplierCampaignId,
  resolvePostAuthNetworkRedirect,
  resolvePostAuthSupplierCampaignRedirect,
} from './supplier-campaign-redirect';

describe('supplier-campaign-redirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('builds inbox campaign path', () => {
    expect(buildInboxCampaignPath('req_123')).toBe('/inbox?campaign=req_123');
  });

  it('persists and reads pending campaign id', () => {
    persistPendingSupplierCampaignId('req_abc');
    expect(readPendingSupplierCampaignId()).toBe('req_abc');
    clearPendingSupplierCampaignId();
    expect(readPendingSupplierCampaignId()).toBeNull();
  });

  it('extracts campaign from next path', () => {
    expect(extractCampaignFromNextPath('/inbox?campaign=req_1')).toBe('req_1');
    expect(extractCampaignFromNextPath('/harvests?claim=V-1')).toBeNull();
  });

  it('resolves post-auth redirect from query or session', () => {
    persistPendingSupplierCampaignId('req_stored');
    expect(resolvePostAuthSupplierCampaignRedirect(null, '/?welcome=1')).toBe('/inbox?campaign=req_stored');
    expect(readPendingSupplierCampaignId()).toBeNull();
    expect(resolvePostAuthSupplierCampaignRedirect('req_query', '/?welcome=1')).toBe('/inbox?campaign=req_query');
    expect(resolvePostAuthSupplierCampaignRedirect(null, '/?welcome=1')).toBe('/?welcome=1');
  });

  it('prefers delivery claim over campaign in network redirect', () => {
    expect(
      resolvePostAuthNetworkRedirect({
        claimRef: 'V-ABC',
        campaignId: 'req_1',
        fallbackPath: '/',
        resolveClaim: (claim, fallback) => (claim ? `/harvests?claim=${claim}` : fallback),
      }),
    ).toBe('/harvests?claim=V-ABC');
    expect(
      resolvePostAuthNetworkRedirect({
        claimRef: null,
        campaignId: 'req_1',
        fallbackPath: '/?welcome=1',
        resolveClaim: () => '/unused',
      }),
    ).toBe('/inbox?campaign=req_1');
  });

  it('builds create-account href with campaign and claim', () => {
    expect(
      buildCreateAccountHrefFromSearchParams({
        get: (key) => (key === 'campaign' ? 'req_1' : null),
      }),
    ).toBe('/create-account?campaign=req_1');
    expect(
      buildCreateAccountHrefFromSearchParams({
        get: (key) => (key === 'next' ? '/inbox?campaign=req_2' : null),
      }),
    ).toBe('/create-account?campaign=req_2');
  });

  it('finds inbox request by campaign id or composite id', () => {
    const requests = [
      { id: 'req_req_1_tenant_a', campaign_id: 'req_1' },
      { id: 'req_req_2_tenant_a', campaign_id: 'req_2' },
    ];
    expect(findInboxRequestForCampaign(requests, 'req_1', 'tenant_a')?.id).toBe('req_req_1_tenant_a');
    expect(findInboxRequestForCampaign(requests, 'req_missing', 'tenant_a')).toBeUndefined();
  });
});
