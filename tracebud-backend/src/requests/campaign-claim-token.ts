import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function hashCampaignClaimToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export function generateCampaignClaimToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashCampaignClaimToken(token),
  };
}

export function verifyCampaignClaimToken(token: string, expectedHash: string): boolean {
  const provided = hashCampaignClaimToken(token);
  const expected = expectedHash.trim().toLowerCase();
  if (provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function buildCampaignClaimUrl(baseUrl: string, campaignId: string, token: string): string {
  const url = new URL('/campaign', baseUrl.replace(/\/$/, ''));
  url.searchParams.set('campaign', campaignId);
  url.searchParams.set('token', token);
  return url.toString();
}

export function defaultCampaignClaimExpiresAt(now = new Date()): string {
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);
  return expires.toISOString();
}
