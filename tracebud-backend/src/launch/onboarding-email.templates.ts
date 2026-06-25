import fs from 'node:fs';
import path from 'node:path';

export type OnboardingEmailTemplateId =
  | 'welcome'
  | 'farmer-welcome'
  | 'resume-nudge-first'
  | 'resume-nudge-final'
  | 'delivery-buyer-invite'
  | 'delivery-buyer-invite-reminder'
  | 'delivery-buyer-invite-reminder-final'
  | 'campaign-request-invite'
  | 'campaign-request-invite-reminder'
  | 'campaign-request-invite-reminder-final';

export const ONBOARDING_EMAIL_SUBJECTS: Record<OnboardingEmailTemplateId, string> = {
  welcome: 'Welcome to Tracebud — your workspace is ready',
  'farmer-welcome': 'Welcome to Tracebud — your farmer account is ready',
  'resume-nudge-first': 'Finish setting up your Tracebud workspace',
  'resume-nudge-final': 'Reminder: your Tracebud workspace is almost ready',
  'delivery-buyer-invite': 'A producer shared a delivery record with you',
  'delivery-buyer-invite-reminder': 'Reminder: a delivery is still waiting for you',
  'delivery-buyer-invite-reminder-final': 'Last reminder: claim your delivery on Tracebud',
  'campaign-request-invite': 'A compliance request was sent to you on Tracebud',
  'campaign-request-invite-reminder': 'Reminder: a compliance request is still waiting',
  'campaign-request-invite-reminder-final': 'Last reminder: respond to your Tracebud request',
};

export interface OnboardingEmailTemplateVars {
  firstName: string;
  organizationName?: string;
  country?: string;
  roleLabel?: string;
  loginUrl?: string;
  signupUrl?: string;
  resumeUrl?: string;
  appUrl?: string;
  unsubscribeUrl?: string;
  recipientEmail?: string;
  producerLabel?: string;
  deliveryKgLabel?: string;
  deliveryDateLabel?: string;
  tripRefLabel?: string;
  learnMoreUrl?: string;
  senderOrgLabel?: string;
  senderContextLine?: string;
  recipientRoleLabel?: string;
  campaignTitle?: string;
  campaignDescription?: string;
  dueDateLabel?: string;
  requestTypeLabel?: string;
  connectUrl?: string;
  connectLabel?: string;
  acceptUrl?: string;
  refuseUrl?: string;
  docsUrl?: string;
  tracebudExplainer?: string;
  whyRespondBulletsHtml?: string;
  whyRespondBulletsText?: string;
  year: string;
}

const templateRootCache: { root: string | null } = { root: null };
const fileCache = new Map<string, string>();

function resolveTemplateRoot(): string {
  if (templateRootCache.root) {
    return templateRootCache.root;
  }
  const candidates = [
    path.join(process.cwd(), 'email-templates'),
    path.join(__dirname, '..', '..', 'email-templates'),
    path.join(__dirname, '..', '..', '..', 'email-templates'),
  ];
  for (const candidate of candidates) {
    const probe = path.join(candidate, 'html', 'welcome.html');
    if (fs.existsSync(probe)) {
      templateRootCache.root = candidate;
      return candidate;
    }
  }
  throw new Error(
    'Onboarding email templates not found. Ensure tracebud-backend/email-templates is deployed (see Dockerfile).',
  );
}

function readTemplateFile(relativePath: string): string {
  const cacheKey = relativePath;
  const cached = fileCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const fullPath = path.join(resolveTemplateRoot(), relativePath);
  const contents = fs.readFileSync(fullPath, 'utf8');
  fileCache.set(cacheKey, contents);
  return contents;
}

function stripTextTemplateHeader(raw: string): string {
  const lines = raw.split('\n');
  let start = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (
      line.startsWith('Subject:') ||
      line.startsWith('Preheader:') ||
      /^─+$/.test(line) ||
      (line === '' && start === i)
    ) {
      start = i + 1;
      continue;
    }
    break;
  }
  return lines.slice(start).join('\n');
}

export function clearOnboardingEmailTemplateCache(): void {
  templateRootCache.root = null;
  fileCache.clear();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function applyTemplatePlaceholders(
  template: string,
  vars: OnboardingEmailTemplateVars,
  options?: { escapeHtml?: boolean },
): string {
  const escape = options?.escapeHtml ?? false;
  const entries: Record<string, string> = {
    firstName: vars.firstName,
    organizationName: vars.organizationName ?? '',
    country: vars.country ?? '',
    roleLabel: vars.roleLabel ?? '',
    loginUrl: vars.loginUrl ?? '',
    signupUrl: vars.signupUrl ?? '',
    resumeUrl: vars.resumeUrl ?? '',
    appUrl: vars.appUrl ?? '',
    unsubscribeUrl: vars.unsubscribeUrl ?? '',
    recipientEmail: vars.recipientEmail ?? '',
    producerLabel: vars.producerLabel ?? '',
    deliveryKgLabel: vars.deliveryKgLabel ?? '',
    deliveryDateLabel: vars.deliveryDateLabel ?? '',
    tripRefLabel: vars.tripRefLabel ?? '',
    learnMoreUrl: vars.learnMoreUrl ?? '',
    senderOrgLabel: vars.senderOrgLabel ?? '',
    senderContextLine: vars.senderContextLine ?? '',
    recipientRoleLabel: vars.recipientRoleLabel ?? '',
    campaignTitle: vars.campaignTitle ?? '',
    campaignDescription: vars.campaignDescription ?? '',
    dueDateLabel: vars.dueDateLabel ?? '',
    requestTypeLabel: vars.requestTypeLabel ?? '',
    connectUrl: vars.connectUrl ?? '',
    connectLabel: vars.connectLabel ?? '',
    acceptUrl: vars.acceptUrl ?? '',
    refuseUrl: vars.refuseUrl ?? '',
    docsUrl: vars.docsUrl ?? '',
    tracebudExplainer: vars.tracebudExplainer ?? '',
    whyRespondBulletsHtml: vars.whyRespondBulletsHtml ?? '',
    whyRespondBulletsText: vars.whyRespondBulletsText ?? '',
    year: vars.year,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const raw = entries[key] ?? '';
    const rawHtmlKeys = new Set(['whyRespondBulletsHtml']);
    if (escape && !rawHtmlKeys.has(key)) {
      return escapeHtml(raw);
    }
    return raw;
  });
}

export function renderOnboardingEmailHtml(
  templateId: OnboardingEmailTemplateId,
  vars: OnboardingEmailTemplateVars,
): string {
  const relativePath = `html/${templateId}.html`;
  const raw = readTemplateFile(relativePath);
  return applyTemplatePlaceholders(raw, vars, { escapeHtml: true });
}

export function renderOnboardingEmailText(
  templateId: OnboardingEmailTemplateId,
  vars: OnboardingEmailTemplateVars,
): string {
  const relativePath = `text/${templateId}.txt`;
  const raw = readTemplateFile(relativePath);
  const body = stripTextTemplateHeader(raw);
  return applyTemplatePlaceholders(body, vars, { escapeHtml: false }).trim();
}

export function getResumeNudgeTemplateId(resumeNudgeCount: number): 'resume-nudge-first' | 'resume-nudge-final' {
  return resumeNudgeCount >= 1 ? 'resume-nudge-final' : 'resume-nudge-first';
}

export function buildOnboardingTemplateVars(input: {
  firstName: string;
  organizationName?: string;
  country?: string;
  roleLabel?: string;
  loginUrl?: string;
  resumeUrl?: string;
  dashboardBaseUrl: string;
}): OnboardingEmailTemplateVars {
  const dashboardBase = input.dashboardBaseUrl.replace(/\/$/, '');
  return {
    firstName: input.firstName,
    organizationName: input.organizationName,
    country: input.country,
    roleLabel: input.roleLabel,
    loginUrl: input.loginUrl ?? `${dashboardBase}/login`,
    resumeUrl: input.resumeUrl,
    unsubscribeUrl:
      process.env.TRACEBUD_ONBOARDING_UNSUBSCRIBE_URL?.trim() ||
      `${dashboardBase}/settings`,
    year: String(new Date().getFullYear()),
  };
}

export function buildFarmerWelcomeTemplateVars(input: {
  firstName: string;
}): OnboardingEmailTemplateVars {
  const appUrl =
    process.env.TRACEBUD_FIELD_APP_PUBLIC_URL?.trim()?.replace(/\/$/, '') ||
    'https://tracebud.com';
  return {
    firstName: input.firstName,
    appUrl,
    unsubscribeUrl:
      process.env.TRACEBUD_ONBOARDING_UNSUBSCRIBE_URL?.trim() || `${appUrl}/privacy`,
    year: String(new Date().getFullYear()),
  };
}

export function firstNameFromRecipientEmail(recipientEmail: string): string {
  const local = recipientEmail.split('@')[0] ?? '';
  const token = local.split(/[._+-]/)[0] ?? local;
  return token.length > 0 ? token.charAt(0).toUpperCase() + token.slice(1) : 'there';
}

function formatDeliveryKgLabel(kg: number | null | undefined): string {
  if (kg == null || !Number.isFinite(kg)) {
    return '—';
  }
  const rounded = Math.round(kg * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display} kg`;
}

function formatDeliveryDateLabel(harvestDate: string | Date | null | undefined): string {
  const fallback = new Date();
  const parsed =
    harvestDate instanceof Date
      ? harvestDate
      : typeof harvestDate === 'string' && harvestDate.trim().length > 0
        ? new Date(harvestDate)
        : fallback;
  const date = Number.isNaN(parsed.getTime()) ? fallback : parsed;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildTripRefLabel(tripRef: string | null | undefined): string {
  const label = tripRef?.trim().toUpperCase() ?? '';
  return label || '—';
}

export function buildDeliveryBuyerInviteSubject(producerLabel?: string | null): string {
  const label = producerLabel?.trim() || 'A Tracebud producer';
  return `${label} shared a delivery record with you`;
}

export function getDeliveryBuyerInviteReminderTemplateId(
  reminderNudgeCount: number,
): 'delivery-buyer-invite-reminder' | 'delivery-buyer-invite-reminder-final' {
  return reminderNudgeCount >= 1 ? 'delivery-buyer-invite-reminder-final' : 'delivery-buyer-invite-reminder';
}

export function buildDeliveryBuyerInviteReminderSubject(
  producerLabel: string | null | undefined,
  reminderNudgeCount: number,
): string {
  const label = producerLabel?.trim() || 'A Tracebud producer';
  if (reminderNudgeCount >= 1) {
    return `Last reminder: delivery from ${label} is waiting`;
  }
  return `Reminder: delivery from ${label} is still waiting`;
}

export function buildDeliveryBuyerInviteTemplateVars(input: {
  recipientEmail: string;
  producerLabel?: string | null;
  dashboardBaseUrl?: string;
  deliveryKg?: number | null;
  deliveryDate?: string | Date | null;
  tripRef?: string | null;
}): OnboardingEmailTemplateVars {
  const dashboardBase = (input.dashboardBaseUrl ?? 'https://dashboard.tracebud.com').replace(/\/$/, '');
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const producerLabel = input.producerLabel?.trim() || 'A Tracebud producer';
  const learnMoreUrl =
    process.env.TRACEBUD_MARKETING_PUBLIC_URL?.trim()?.replace(/\/$/, '') || 'https://tracebud.com';
  return {
    firstName: firstNameFromRecipientEmail(recipientEmail),
    recipientEmail,
    producerLabel,
    deliveryKgLabel: formatDeliveryKgLabel(input.deliveryKg),
    deliveryDateLabel: formatDeliveryDateLabel(input.deliveryDate),
    tripRefLabel: buildTripRefLabel(input.tripRef),
    signupUrl: `${dashboardBase}/signup`,
    loginUrl: `${dashboardBase}/login`,
    learnMoreUrl,
    unsubscribeUrl:
      process.env.TRACEBUD_ONBOARDING_UNSUBSCRIBE_URL?.trim() || `${dashboardBase}/settings`,
    year: String(new Date().getFullYear()),
  };
}
