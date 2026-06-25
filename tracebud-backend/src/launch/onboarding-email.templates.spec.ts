import {
  applyTemplatePlaceholders,
  buildDeliveryBuyerInviteSubject,
  buildDeliveryBuyerInviteTemplateVars,
  escapeHtml,
  getDeliveryBuyerInviteReminderTemplateId,
  getResumeNudgeTemplateId,
  renderOnboardingEmailHtml,
  renderOnboardingEmailText,
} from './onboarding-email.templates';

describe('onboarding-email.templates', () => {
  it('escapes html in placeholder values when requested', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(
      applyTemplatePlaceholders('{{firstName}}', { firstName: '<b>', year: '2026' }, { escapeHtml: true }),
    ).toBe('&lt;b&gt;');
  });

  it('renders welcome html and text from repo templates', () => {
    const vars = {
      firstName: 'Amara',
      organizationName: 'Côte Cacao Cooperative',
      country: "Côte d'Ivoire",
      roleLabel: 'Exporter',
      loginUrl: 'https://dashboard.tracebud.com/login',
      unsubscribeUrl: 'https://dashboard.tracebud.com/settings',
      year: '2026',
    };
    const html = renderOnboardingEmailHtml('welcome', vars);
    expect(html).toContain('Hi Amara');
    expect(html).toContain('Côte Cacao Cooperative');
    expect(html).toContain('Open my dashboard');
    expect(html).not.toContain('{{firstName}}');

    const text = renderOnboardingEmailText('welcome', vars);
    expect(text).toContain('Hi Amara');
    expect(text).not.toContain('{{organizationName}}');
  });

  it('renders farmer welcome html and text from repo templates', () => {
    const vars = {
      firstName: 'Maria',
      appUrl: 'https://tracebud.com',
      unsubscribeUrl: 'https://tracebud.com/privacy',
      year: '2026',
    };
    const html = renderOnboardingEmailHtml('farmer-welcome', vars);
    expect(html).toContain('Hi Maria');
    expect(html).toContain('Map plot boundaries offline');
    expect(html).not.toContain('{{firstName}}');

    const text = renderOnboardingEmailText('farmer-welcome', vars);
    expect(text).toContain('Welcome to Tracebud');
    expect(text).not.toContain('{{appUrl}}');
  });

  it('renders delivery buyer invite for cold recipients with delivery preview', () => {
    const vars = buildDeliveryBuyerInviteTemplateVars({
      recipientEmail: 'buyer@coop.example',
      producerLabel: 'Maria N.',
      dashboardBaseUrl: 'https://dashboard.tracebud.com',
      deliveryKg: 120,
      deliveryDate: '2026-06-25',
      tripRef: 'trip-abc',
    });
    expect(buildDeliveryBuyerInviteSubject('Maria N.')).toBe(
      'Maria N. shared a delivery record with you',
    );
    const html = renderOnboardingEmailHtml('delivery-buyer-invite', vars);
    expect(html).toContain('DELIVERY SHARED WITH YOU');
    expect(html).toContain('buyer@coop.example');
    expect(html).toContain('View delivery');
    expect(html).toContain('Maria N.');
    expect(html).toContain('120 kg');
    expect(html).toContain('TRIP-ABC');
    expect(html).toContain('What is Tracebud?');
    const text = renderOnboardingEmailText('delivery-buyer-invite', vars);
    expect(text).toContain('buyer@coop.example');
    expect(text).toContain('tracebud.com');
  });

  it('renders delivery buyer invite reminder variants', () => {
    const vars = buildDeliveryBuyerInviteTemplateVars({
      recipientEmail: 'buyer@coop.example',
      producerLabel: 'Maria N.',
      deliveryKg: 50,
    });
    expect(getDeliveryBuyerInviteReminderTemplateId(0)).toBe('delivery-buyer-invite-reminder');
    expect(getDeliveryBuyerInviteReminderTemplateId(1)).toBe('delivery-buyer-invite-reminder-final');
    expect(renderOnboardingEmailHtml('delivery-buyer-invite-reminder', vars)).toContain('REMINDER');
    expect(renderOnboardingEmailHtml('delivery-buyer-invite-reminder-final', vars)).toContain(
      'LAST REMINDER',
    );
  });

  it('renders resume nudge variants', () => {
    const vars = {
      firstName: 'Amara',
      resumeUrl: 'https://dashboard.tracebud.com/create-account?resume=workspace',
      unsubscribeUrl: 'https://dashboard.tracebud.com/settings',
      year: '2026',
    };
    expect(renderOnboardingEmailHtml('resume-nudge-first', vars)).toContain('Complete workspace setup');
    expect(renderOnboardingEmailHtml('resume-nudge-final', vars)).toContain('last reminder');
    expect(getResumeNudgeTemplateId(0)).toBe('resume-nudge-first');
    expect(getResumeNudgeTemplateId(1)).toBe('resume-nudge-final');
  });
});
