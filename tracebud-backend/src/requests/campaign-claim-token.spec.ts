import {
  buildCampaignClaimUrl,
  generateCampaignClaimToken,
  hashCampaignClaimToken,
  verifyCampaignClaimToken,
} from './campaign-claim-token';

describe('campaign-claim-token', () => {
  it('hashes and verifies opaque claim tokens', () => {
    const { token, tokenHash } = generateCampaignClaimToken();
    expect(verifyCampaignClaimToken(token, tokenHash)).toBe(true);
    expect(verifyCampaignClaimToken(`${token}x`, tokenHash)).toBe(false);
  });

  it('builds field-auth claim URLs', () => {
    const { token } = generateCampaignClaimToken();
    expect(buildCampaignClaimUrl('https://auth.tracebud.com', 'camp_1', token)).toBe(
      `https://auth.tracebud.com/campaign?campaign=camp_1&token=${encodeURIComponent(token)}`,
    );
    expect(hashCampaignClaimToken(token)).toHaveLength(64);
  });
});
