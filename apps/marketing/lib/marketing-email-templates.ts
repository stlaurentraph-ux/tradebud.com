import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export interface WaitlistEmailTemplateVars {
  firstName: string;
  organisationName: string;
  roleLabel: string;
  commodity: string;
  websiteUrl: string;
  year: string;
}

export const WAITLIST_CONFIRMATION_SUBJECT = "You're on the Tracebud waitlist";

const templateRootCache: { root: string | null } = { root: null };
const fileCache = new Map<string, string>();

function resolveTemplateRoot(): string {
  if (templateRootCache.root) {
    return templateRootCache.root;
  }

  const candidates = [
    path.join(process.cwd(), 'email-templates'),
    path.join(process.cwd(), 'apps', 'marketing', 'email-templates'),
    path.join(moduleDir, '..', 'email-templates'),
  ];

  for (const candidate of candidates) {
    const probe = path.join(candidate, 'html', 'waitlist-confirmation.html');
    if (fs.existsSync(probe)) {
      templateRootCache.root = candidate;
      return candidate;
    }
  }

  throw new Error(
    'Marketing email templates not found. Ensure apps/marketing/email-templates is deployed.',
  );
}

function readTemplateFile(relativePath: string): string {
  const cached = fileCache.get(relativePath);
  if (cached) {
    return cached;
  }

  const fullPath = path.join(resolveTemplateRoot(), relativePath);
  const contents = fs.readFileSync(fullPath, 'utf8');
  fileCache.set(relativePath, contents);
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

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function applyWaitlistTemplatePlaceholders(
  template: string,
  vars: WaitlistEmailTemplateVars,
  options?: { escapeHtml?: boolean },
): string {
  const escape = options?.escapeHtml ?? false;
  const entries: Record<string, string> = {
    firstName: vars.firstName,
    organisationName: vars.organisationName,
    roleLabel: vars.roleLabel,
    commodity: vars.commodity,
    websiteUrl: vars.websiteUrl,
    year: vars.year,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const raw = entries[key] ?? '';
    return escape ? escapeHtml(raw) : raw;
  });
}

export function renderWaitlistConfirmationHtml(vars: WaitlistEmailTemplateVars): string {
  const raw = readTemplateFile('html/waitlist-confirmation.html');
  return applyWaitlistTemplatePlaceholders(raw, vars, { escapeHtml: true });
}

export function renderWaitlistConfirmationText(vars: WaitlistEmailTemplateVars): string {
  const raw = readTemplateFile('text/waitlist-confirmation.txt');
  const body = stripTextTemplateHeader(raw);
  return applyWaitlistTemplatePlaceholders(body, vars, { escapeHtml: false }).trim();
}

export function buildWaitlistTemplateVars(input: {
  firstName: string;
  organisation: string;
  role: string;
  commodity: string;
  websiteUrl?: string;
}): WaitlistEmailTemplateVars {
  return {
    firstName: input.firstName.trim(),
    organisationName: input.organisation.trim(),
    roleLabel: input.role.trim(),
    commodity: input.commodity.trim(),
    websiteUrl: input.websiteUrl?.trim() || 'https://www.tracebud.com/en',
    year: String(new Date().getFullYear()),
  };
}
