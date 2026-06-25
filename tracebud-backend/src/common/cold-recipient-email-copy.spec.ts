import {
  buildCampaignSmsBody,
  buildCampaignWhyRespondBullets,
  campaignSenderContextLine,
  normalizeCampaignRecipientAudience,
  normalizeCampaignSenderRole,
  recipientAudienceLabel,
  resolveCampaignSenderRoleFromSignals,
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
    expect(normalizeCampaignSenderRole('sponsor')).toBe('sponsor');
  });

  it('resolves sponsor sender role from tenant signals', () => {
    expect(
      resolveCampaignSenderRoleFromSignals({
        primaryRole: 'compliance_manager',
        supplyChainRoles: [],
      }),
    ).toBe('sponsor');
    expect(
      resolveCampaignSenderRoleFromSignals({
        primaryRole: 'compliance_manager',
        supplyChainRoles: ['importer'],
      }),
    ).toBe('importer');
    expect(
      resolveCampaignSenderRoleFromSignals({
        adminRoles: ['sponsor'],
      }),
    ).toBe('sponsor');
  });

  it('uses programme language for sponsor sender copy', () => {
    expect(campaignSenderContextLine('Global Cocoa Initiative', 'sponsor')).toContain(
      'compliance programme',
    );
    expect(buildCampaignSmsBody({
      senderOrg: 'Global Cocoa Initiative',
      campaignTitle: 'Origin evidence Q3',
      claimUrl: 'https://field.tracebud.com/campaign?campaign=cmp_1',
      audience: 'farmer',
      senderRole: 'sponsor',
    })).toContain('invited you to a Tracebud compliance programme');
  });
});
