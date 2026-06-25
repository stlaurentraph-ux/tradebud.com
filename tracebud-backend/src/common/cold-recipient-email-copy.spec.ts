import {
  buildCampaignWhyRespondBullets,
  normalizeCampaignRecipientAudience,
  normalizeCampaignSenderRole,
  recipientAudienceLabel,
} from './cold-recipient-email-copy';

describe('cold-recipient-email-copy', () => {
  it('normalizes contact activity aliases', () => {
    expect(normalizeCampaignRecipientAudience('coop')).toBe('cooperative');
    expect(normalizeCampaignRecipientAudience('sponsor')).toBe('importer');
    expect(normalizeCampaignRecipientAudience('washing_station')).toBe('processing_facility');
  });

  it('builds role-specific benefit bullets', () => {
    expect(buildCampaignWhyRespondBullets('farmer')[0]).toContain('phone');
    expect(buildCampaignWhyRespondBullets('exporter')[0]).toContain('dashboard');
    expect(recipientAudienceLabel('cooperative')).toBe('cooperative');
    expect(normalizeCampaignSenderRole('exporter')).toBe('exporter');
  });
});
