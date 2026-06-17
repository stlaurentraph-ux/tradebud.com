#!/usr/bin/env node
/**
 * Configure Supabase Auth for Tracebud field-app OAuth (Google + Apple).
 *
 * Prereqs:
 *   1. Supabase personal access token: https://supabase.com/dashboard/account/tokens
 *   2. Google Cloud OAuth Web client → redirect:
 *        https://<project-ref>.supabase.co/auth/v1/callback
 *   3. Apple Services ID → Return URL (same Supabase callback)
 *   4. Apple secret JWT: node scripts/generate-apple-oauth-secret.mjs
 *
 * Required env:
 *   SUPABASE_ACCESS_TOKEN
 *
 * Optional (enable providers when set):
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
 *   APPLE_SERVICES_ID, APPLE_OAUTH_SECRET
 *   APPLE_BUNDLE_ID (default com.tracebud.app) — added to Apple client IDs list
 *
 * Optional overrides:
 *   SUPABASE_PROJECT_REF (default uzsktajlnofosxeqwdwl)
 *   SUPABASE_SITE_URL (default https://dashboard.tracebud.com)
 *   SUPABASE_REDIRECT_URLS (comma-separated; default tracebudoffline://auth/callback)
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF?.trim() || 'uzsktajlnofosxeqwdwl';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const SITE_URL = process.env.SUPABASE_SITE_URL?.trim() || 'https://dashboard.tracebud.com';
const REDIRECT_URLS =
  process.env.SUPABASE_REDIRECT_URLS?.trim() ||
  [
    'tracebudoffline://auth/callback',
    'tracebudoffline://**',
    'exp://**',
    'exp://**/--/auth/callback',
    'https://app.tracebud.com/**',
    'https://dashboard.tracebud.com/**',
  ].join(',');
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID?.trim() || 'com.tracebud.app';

if (!ACCESS_TOKEN) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens',
  );
  process.exit(1);
}

function maybeGenerateAppleSecret() {
  if (process.env.APPLE_OAUTH_SECRET?.trim()) {
    return process.env.APPLE_OAUTH_SECRET.trim();
  }
  const hasAppleInputs =
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_SERVICES_ID &&
    process.env.APPLE_PRIVATE_KEY_PATH;
  if (!hasAppleInputs) return null;

  const script = resolve(dirname(fileURLToPath(import.meta.url)), 'generate-apple-oauth-secret.mjs');
  const result = spawnSync(process.execPath, [script], {
    env: process.env,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(result.stderr || 'Failed to generate Apple OAuth secret');
    process.exit(1);
  }
  return result.stdout.trim();
}

async function main() {
  const getRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!getRes.ok) {
    const body = await getRes.text();
    console.error(`GET auth config failed (${getRes.status}): ${body}`);
    process.exit(1);
  }

  const current = await getRes.json();
  const patch = {
    site_url: SITE_URL,
    uri_allow_list: REDIRECT_URLS,
  };

  const googleId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (googleId && googleSecret) {
    patch.external_google_enabled = true;
    patch.external_google_client_id = googleId;
    patch.external_google_secret = googleSecret;
    patch.external_google_skip_nonce_check = false;
    const googleIosId = process.env.GOOGLE_OAUTH_IOS_CLIENT_ID?.trim();
    const googleAndroidId = process.env.GOOGLE_OAUTH_ANDROID_CLIENT_ID?.trim();
    const nativeClientIds = [googleIosId, googleAndroidId].filter(Boolean);
    if (nativeClientIds.length > 0) {
      patch.external_google_client_id = [...new Set([googleId, ...nativeClientIds])].join(',');
    }
  } else {
    console.warn('Skipping Google: set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to enable.');
  }

  const appleServicesId = process.env.APPLE_SERVICES_ID?.trim();
  const appleSecret = maybeGenerateAppleSecret();
  if (appleServicesId && appleSecret) {
    patch.external_apple_enabled = true;
    patch.external_apple_client_id = appleServicesId;
    patch.external_apple_secret = appleSecret;
    patch.external_apple_email_optional = true;
    patch.external_apple_skip_nonce_check = true;
    const extraIds = [APPLE_BUNDLE_ID].filter((id) => id && id !== appleServicesId);
    if (extraIds.length > 0) {
      patch.external_apple_additional_client_ids = extraIds.join(',');
    }
  } else {
    console.warn(
      'Skipping Apple: set APPLE_SERVICES_ID + APPLE_OAUTH_SECRET (or APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY_PATH).',
    );
  }

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    console.error(`PATCH auth config failed (${patchRes.status}): ${body}`);
    process.exit(1);
  }

  const updated = await patchRes.json();
  console.log('Supabase auth config updated for project', PROJECT_REF);
  console.log('  site_url:', updated.site_url ?? SITE_URL);
  console.log('  uri_allow_list:', updated.uri_allow_list ?? REDIRECT_URLS);
  console.log('  Google enabled:', updated.external_google_enabled ?? patch.external_google_enabled ?? current.external_google_enabled);
  console.log('  Apple enabled:', updated.external_apple_enabled ?? patch.external_apple_enabled ?? current.external_apple_enabled);
  console.log('');
  console.log('Apple Developer → Services ID return URL must be:');
  console.log(`  https://${PROJECT_REF}.supabase.co/auth/v1/callback`);
  console.log('Google Cloud → Web client authorized redirect URI must be the same URL.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
