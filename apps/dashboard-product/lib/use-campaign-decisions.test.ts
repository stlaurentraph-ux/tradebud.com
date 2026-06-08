import { describe, expect, it } from 'vitest';
import { formatCampaignDecisionSource } from '@/lib/use-campaign-decisions';

describe('formatCampaignDecisionSource', () => {
  it('maps known backend sources to readable labels', () => {
    expect(formatCampaignDecisionSource('email_cta')).toBe('Email link');
    expect(formatCampaignDecisionSource('inbox_fulfillment')).toBe('Inbox fulfillment');
  });

  it('falls back to humanized unknown sources', () => {
    expect(formatCampaignDecisionSource('manual_override')).toBe('manual override');
  });
});
