import {
  applyTemplatePlaceholders,
  escapeHtml,
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
