import {
  buildCampaignRequestInviteReminderSubject,
  buildCampaignRequestInviteSubject,
  buildCampaignRequestInviteTemplateVars,
  getCampaignRequestInviteReminderTemplateId,
} from './campaign-request-email.templates';
import { renderOnboardingEmailHtml, renderOnboardingEmailText } from '../launch/onboarding-email.templates';

describe('campaign-request-email.templates', () => {
  it('builds exporter-focused campaign invite copy', () => {
    const vars = buildCampaignRequestInviteTemplateVars({
      recipientEmail: 'exports@partner.example',
      senderOrgLabel: 'BlueCocoa Import GmbH',
      senderRole: 'importer',
      recipientContactType: 'exporter',
      campaignTitle: 'Q3 Cocoa Supply Chain Evidence',
      campaignDescription: 'Upload plots, shipment proofs, and consent records.',
      dueDateLabel: '15 Jul 2026',
      requestTypeLabel: 'GENERAL_EVIDENCE',
      connectUrl: 'https://dashboard.tracebud.com/create-account?campaign=cmp_1',
      acceptUrl: 'https://dashboard.tracebud.com/requests/intent?campaign=cmp_1&decision=accept',
      refuseUrl: 'https://dashboard.tracebud.com/requests/intent?campaign=cmp_1&decision=refuse',
      docsUrl: 'https://docs.tracebud.com/getting-started/compliance-requests',
    });

    expect(buildCampaignRequestInviteSubject('BlueCocoa Import GmbH')).toBe(
      'BlueCocoa Import GmbH sent you a compliance request',
    );
    expect(vars.connectLabel).toBe('View request on Tracebud');
    expect(vars.senderContextLine).toContain('EU due-diligence requirements');
    expect(vars.requestTypeLabel).toBe('General Evidence');

    const html = renderOnboardingEmailHtml('campaign-request-invite', vars);
    expect(html).toContain('COMPLIANCE REQUEST');
    expect(html).toContain('Q3 Cocoa Supply Chain Evidence');
    expect(html).toContain('BlueCocoa Import GmbH');
    expect(html).toContain('View request on Tracebud');
  });

  it('builds farmer-focused campaign invite copy and reminder variants', () => {
    const vars = buildCampaignRequestInviteTemplateVars({
      recipientEmail: 'farmer.coop@example.com',
      senderOrgLabel: 'Kawa Cooperative Union',
      senderRole: 'cooperative',
      recipientContactType: 'farmer',
      campaignTitle: 'Farm Plot Validation',
      campaignDescription: null,
      dueDateLabel: '22 Jul 2026',
      requestTypeLabel: 'MISSING_PLOT_GEOMETRY',
      connectUrl: 'https://field.tracebud.com/campaign?campaign=cmp_farmer',
      acceptUrl: 'https://dashboard.tracebud.com/requests/intent?campaign=cmp_farmer&decision=accept',
      refuseUrl: 'https://dashboard.tracebud.com/requests/intent?campaign=cmp_farmer&decision=refuse',
      docsUrl: 'https://docs.tracebud.com/getting-started/compliance-requests',
    });

    expect(vars.connectLabel).toBe('Open Tracebud field app');
    expect(vars.whyRespondBulletsText).toContain('offline');
    expect(getCampaignRequestInviteReminderTemplateId(0)).toBe('campaign-request-invite-reminder');
    expect(getCampaignRequestInviteReminderTemplateId(1)).toBe('campaign-request-invite-reminder-final');
    expect(buildCampaignRequestInviteReminderSubject('Kawa Cooperative Union', 1)).toContain(
      'Last reminder',
    );

    const text = renderOnboardingEmailText('campaign-request-invite', vars);
    expect(text).toContain('Open Tracebud field app');
    expect(text).toContain('Farm Plot Validation');
  });
});
