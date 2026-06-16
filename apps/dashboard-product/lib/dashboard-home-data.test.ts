import { describe, expect, it } from 'vitest';
import { normalizeSummaryCampaigns } from './dashboard-home-data';

describe('dashboard-home-data', () => {
  it('normalizes campaign records from summary payload', () => {
    const campaigns = normalizeSummaryCampaigns([
      {
        id: 'camp-1',
        title: 'Cocoa outreach',
        status: 'running',
        created_at: '2026-01-01T00:00:00.000Z',
        target_contact_emails: ['ops@coop.test'],
      },
    ]);

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]?.id).toBe('camp-1');
    expect(campaigns[0]?.status).toBe('RUNNING');
    expect(campaigns[0]?.target_contact_emails).toEqual(['ops@coop.test']);
  });
});
