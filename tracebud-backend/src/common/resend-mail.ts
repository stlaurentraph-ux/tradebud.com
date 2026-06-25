import { Resend } from 'resend';

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }
  return new Resend(apiKey);
}

export function formatResendFromAddress(): string {
  const senderEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
  const senderName = process.env.RESEND_FROM_NAME?.trim() || 'Tracebud';
  return `${senderName} <${senderEmail}>`;
}

/** Cold-invite sender line: human producer as trust anchor (Resend display name). */
export function formatResendFromAddressOnBehalf(producerLabel: string): string {
  const senderEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
  const label = producerLabel.trim() || 'A Tracebud producer';
  const displayName = `${label} via Tracebud`;
  return `${displayName} <${senderEmail}>`;
}

export function getResendReplyTo(from: string): string {
  return process.env.RESEND_REPLY_TO_EMAIL?.trim() || from.match(/<([^>]+)>/)?.[1] || from;
}

export function getDashboardPublicUrl(): string {
  const raw = process.env.TRACEBUD_DASHBOARD_PUBLIC_URL?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://dashboard.tracebud.com';
}

export function firstNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() ?? '';
  if (!local) return 'there';
  const token = local.split(/[._+-]/)[0] ?? local;
  return token.length > 0 ? token.charAt(0).toUpperCase() + token.slice(1) : 'there';
}
