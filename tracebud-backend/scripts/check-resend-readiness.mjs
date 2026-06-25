#!/usr/bin/env node
/**
 * Verify Resend is configured for onboarding welcome + delivery buyer + campaign request invites.
 *
 * Usage:
 *   npm run check:resend
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) out[key] = value;
  }
  return out;
}

const env = {
  ...loadEnvFile(resolve(process.cwd(), '.env')),
  ...loadEnvFile(resolve(process.cwd(), '.env.local')),
  ...process.env,
};

let failed = false;

function fail(message) {
  console.error(`FAIL ${message}`);
  failed = true;
}

function ok(message) {
  console.log(`OK ${message}`);
}

function warn(message) {
  console.warn(`WARN ${message}`);
}

if (!env.RESEND_API_KEY?.trim()) {
  fail('RESEND_API_KEY is not set');
} else {
  ok('RESEND_API_KEY is set');
}

if (!env.RESEND_FROM_EMAIL?.trim()) {
  fail('RESEND_FROM_EMAIL is not set (must be a verified Resend sender domain)');
} else {
  ok(`RESEND_FROM_EMAIL=${env.RESEND_FROM_EMAIL.trim()}`);
}

if (!env.TRACEBUD_DASHBOARD_PUBLIC_URL?.trim()) {
  warn('TRACEBUD_DASHBOARD_PUBLIC_URL not set — emails default to https://dashboard.tracebud.com');
} else {
  ok(`TRACEBUD_DASHBOARD_PUBLIC_URL=${env.TRACEBUD_DASHBOARD_PUBLIC_URL.trim()}`);
}

for (const file of [
  'email-templates/html/delivery-buyer-invite.html',
  'email-templates/text/delivery-buyer-invite.txt',
  'email-templates/html/delivery-buyer-invite-reminder.html',
  'email-templates/text/delivery-buyer-invite-reminder.txt',
  'email-templates/html/delivery-buyer-invite-reminder-final.html',
  'email-templates/text/delivery-buyer-invite-reminder-final.txt',
  'email-templates/html/campaign-request-invite.html',
  'email-templates/text/campaign-request-invite.txt',
  'email-templates/html/campaign-request-invite-reminder.html',
  'email-templates/text/campaign-request-invite-reminder.txt',
  'email-templates/html/campaign-request-invite-reminder-final.html',
  'email-templates/text/campaign-request-invite-reminder-final.txt',
  'email-templates/html/welcome.html',
]) {
  const full = resolve(process.cwd(), file);
  if (!existsSync(full)) {
    fail(`${file} missing from deploy bundle`);
  } else {
    ok(`${file} present`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('\nResend readiness: OK');
console.log('Delivery buyer invites: delivery-buyer-invite + reminder templates (D/D2/D3).');
console.log('Campaign request invites: campaign-request-invite + reminder templates (E/E2/E3).');
console.log('Configure RESEND_* on Railway and verify your sending domain at resend.com.');
