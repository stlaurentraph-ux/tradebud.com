import { Resend } from 'resend';

import {
  WAITLIST_CONFIRMATION_SUBJECT,
  buildWaitlistTemplateVars,
  renderWaitlistConfirmationHtml,
  renderWaitlistConfirmationText,
} from '@/lib/marketing-email-templates';

const FROM_ADDRESS = 'Tracebud <hello@tracebud.com>';

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function teamNotifyAddress(): string {
  return process.env.MARKETING_TEAM_NOTIFY_EMAIL?.trim() || 'hello@tracebud.com';
}

export type TeamNotificationInput = {
  subject: string;
  headline: string;
  fields: Record<string, string | null | undefined>;
};

export async function sendTeamFormNotification(
  input: TeamNotificationInput,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const rows = Object.entries(input.fields)
    .filter(([, value]) => value != null && String(value).trim().length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;color:#064e3b;">${label}</td><td style="padding:6px 0;color:#1f2937;">${escapeHtmlInline(String(value))}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#022c22;padding:24px;max-width:640px;">
      <h1 style="font-size:20px;margin:0 0 16px;">${escapeHtmlInline(input.headline)}</h1>
      <table style="border-collapse:collapse;font-size:14px;line-height:1.5;">${rows}</table>
      <p style="font-size:12px;color:#64748b;margin-top:24px;">Submitted via tracebud.com marketing forms.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: teamNotifyAddress(),
    subject: input.subject,
    html,
  });

  return !error;
}

export async function sendWaitlistConfirmation(input: {
  email: string;
  firstName: string;
  organisation: string;
  role: string;
  commodity: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const templateVars = buildWaitlistTemplateVars({
    firstName: input.firstName,
    organisation: input.organisation,
    role: input.role,
    commodity: input.commodity,
  });

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: input.email,
    subject: WAITLIST_CONFIRMATION_SUBJECT,
    html: renderWaitlistConfirmationHtml(templateVars),
    text: renderWaitlistConfirmationText(templateVars),
  });

  return !error;
}

export async function sendLeadConfirmation(input: {
  email: string;
  name: string;
  formLabel: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: input.email,
    subject: 'Tracebud — we received your request',
    html: `
      <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#022c22;padding:24px;max-width:640px;">
        <h1 style="font-size:20px;margin:0 0 12px;">Hi ${escapeHtmlInline(input.name)},</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
          Thanks for your ${escapeHtmlInline(input.formLabel)} submission on tracebud.com.
        </p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
          A member of our team will review your details and follow up by email.
        </p>
        <p style="font-size:14px;line-height:1.6;margin:24px 0 8px;">
          Warm regards,<br/>The Tracebud team
        </p>
      </div>
    `,
  });

  return !error;
}

function escapeHtmlInline(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
