import {
  buildBulletsHtml,
  buildBulletsText,
  buildCampaignWhyRespondBullets,
  campaignConnectLabel,
  campaignSenderContextLine,
  normalizeCampaignRecipientAudience,
  normalizeCampaignSenderRole,
  recipientAudienceLabel,
  tracebudExplainerSentence,
  type CampaignRecipientAudience,
} from '../common/cold-recipient-email-copy';
import {
  firstNameFromRecipientEmail,
  type OnboardingEmailTemplateVars,
} from '../launch/onboarding-email.templates';

export function buildCampaignRequestInviteSubject(senderOrgLabel: string | null | undefined): string {
  const sender = senderOrgLabel?.trim() || 'A Tracebud organization';
  return `${sender} sent you a compliance request`;
}

export function getCampaignRequestInviteReminderTemplateId(
  reminderNudgeCount: number,
): 'campaign-request-invite-reminder' | 'campaign-request-invite-reminder-final' {
  return reminderNudgeCount >= 1
    ? 'campaign-request-invite-reminder-final'
    : 'campaign-request-invite-reminder';
}

export function buildCampaignRequestInviteReminderSubject(
  senderOrgLabel: string | null | undefined,
  reminderNudgeCount: number,
): string {
  const sender = senderOrgLabel?.trim() || 'A Tracebud organization';
  if (reminderNudgeCount >= 1) {
    return `Last reminder: ${sender} is waiting for your compliance response`;
  }
  return `Reminder: ${sender} is waiting for your compliance response`;
}

function sanitizeRequestTypeLabel(raw: string | null | undefined): string {
  const value = raw?.trim();
  if (!value) return 'Compliance evidence';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeAudience(raw: string | null | undefined): CampaignRecipientAudience {
  return normalizeCampaignRecipientAudience(raw);
}

export function buildCampaignRequestInviteTemplateVars(input: {
  recipientEmail: string;
  senderOrgLabel: string;
  senderRole?: string | null;
  recipientContactType?: string | null;
  campaignTitle: string;
  campaignDescription?: string | null;
  dueDateLabel: string;
  requestTypeLabel?: string | null;
  connectUrl: string;
  acceptUrl: string;
  refuseUrl: string;
  docsUrl: string;
  dashboardBaseUrl?: string;
}): OnboardingEmailTemplateVars {
  const dashboardBase = (input.dashboardBaseUrl ?? 'https://dashboard.tracebud.com').replace(/\/$/, '');
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const senderOrgLabel = input.senderOrgLabel.trim() || 'A Tracebud organization';
  const senderRole = normalizeCampaignSenderRole(input.senderRole);
  const audience = normalizeAudience(input.recipientContactType);
  const bullets = buildCampaignWhyRespondBullets(audience);

  return {
    firstName: firstNameFromRecipientEmail(recipientEmail),
    recipientEmail,
    senderOrgLabel,
    senderContextLine: campaignSenderContextLine(senderOrgLabel, senderRole),
    recipientRoleLabel: recipientAudienceLabel(audience),
    campaignTitle: input.campaignTitle.trim() || 'Compliance request',
    campaignDescription:
      input.campaignDescription?.trim() ||
      'Please review this request and share the required evidence through Tracebud.',
    dueDateLabel: input.dueDateLabel,
    requestTypeLabel: sanitizeRequestTypeLabel(input.requestTypeLabel),
    connectUrl: input.connectUrl,
    connectLabel: campaignConnectLabel(audience),
    acceptUrl: input.acceptUrl,
    refuseUrl: input.refuseUrl,
    docsUrl: input.docsUrl,
    tracebudExplainer: tracebudExplainerSentence(),
    whyRespondBulletsHtml: buildBulletsHtml(bullets),
    whyRespondBulletsText: buildBulletsText(bullets),
    loginUrl: `${dashboardBase}/login`,
    signupUrl: `${dashboardBase}/create-account`,
    unsubscribeUrl:
      process.env.TRACEBUD_ONBOARDING_UNSUBSCRIBE_URL?.trim() || `${dashboardBase}/settings`,
    year: String(new Date().getFullYear()),
  };
}
