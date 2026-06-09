import fs from 'node:fs';
import path from 'node:path';

export type OnboardingEmailTemplateId = 'welcome' | 'resume-nudge-first' | 'resume-nudge-final';

export const ONBOARDING_EMAIL_SUBJECTS: Record<OnboardingEmailTemplateId, string> = {
  welcome: 'Welcome to Tracebud — your workspace is ready',
  'resume-nudge-first': 'Finish setting up your Tracebud workspace',
  'resume-nudge-final': 'Reminder: your Tracebud workspace is almost ready',
};

export interface OnboardingEmailTemplateVars {
  firstName: string;
  organizationName?: string;
  country?: string;
  roleLabel?: string;
  loginUrl?: string;
  resumeUrl?: string;
  unsubscribeUrl?: string;
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
    resumeUrl: vars.resumeUrl ?? '',
    unsubscribeUrl: vars.unsubscribeUrl ?? '',
    year: vars.year,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const raw = entries[key] ?? '';
    return escape ? escapeHtml(raw) : raw;
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
