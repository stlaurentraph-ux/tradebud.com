#!/usr/bin/env node
/**
 * Verify Supabase Auth providers required by the Tracebud field app.
 *
 * Uses EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY from .env.local / .env,
 * or falls back to eas.json preview build env.
 *
 * Optional: SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF to validate redirect allow-list.
 */
import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_REDIRECT = 'tracebudoffline://auth/callback';
const RECOMMENDED_REDIRECT_PATTERNS = [
  'tracebudoffline://auth/callback',
  'tracebudoffline://**',
  'exp://**',
  'exp://**/--/auth/callback',
  'https://dashboard.tracebud.com/**',
];
const REQUIRED_PROVIDERS = ['google', 'apple', 'email'];

function loadEnvFileIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadSupabaseFromEas(projectRoot) {
  const easPath = path.join(projectRoot, 'eas.json');
  if (!fs.existsSync(easPath)) return;
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  const env = eas?.build?.preview?.env ?? eas?.build?.production?.env;
  if (!env) return;
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL && env.EXPO_PUBLIC_SUPABASE_URL) {
    process.env.EXPO_PUBLIC_SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }
}

function projectRefFromUrl(supabaseUrl) {
  try {
    const host = new URL(supabaseUrl).hostname;
    return host.split('.')[0] || null;
  } catch {
    return null;
  }
}

async function fetchAuthSettings(supabaseUrl, anonKey) {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`auth/v1/settings failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function fetchRedirectAllowList(projectRef, accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Management API auth config failed (${res.status}): ${body}`);
  }
  const config = await res.json();
  const raw = config.uri_allow_list ?? '';
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function main() {
  const projectRoot = process.cwd();
  loadEnvFileIfPresent(path.join(projectRoot, '.env.local'));
  loadEnvFileIfPresent(path.join(projectRoot, '.env'));
  loadSupabaseFromEas(projectRoot);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) {
    console.error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY (.env.local or eas.json).',
    );
    process.exit(1);
  }

  const issues = [];
  const warnings = [];

  const settings = await fetchAuthSettings(supabaseUrl, anonKey);
  const external = settings.external ?? {};

  for (const provider of REQUIRED_PROVIDERS) {
    if (external[provider]) {
      console.log(`[ok] ${provider}: enabled`);
    } else {
      issues.push(`${provider} is not enabled in Supabase Auth`);
      console.error(`[fail] ${provider}: disabled`);
    }
  }

  if (settings.disable_signup) {
    issues.push('User signups are disabled (disable_signup=true)');
    console.error('[fail] signups: disabled');
  } else {
    console.log('[ok] signups: enabled');
  }

  if (settings.mailer_autoconfirm) {
    console.log('[ok] email confirm: skipped (mailer_autoconfirm)');
  } else {
    warnings.push('Email confirmation required before first sign-in (mailer_autoconfirm=false)');
    console.warn('[warn] email confirm: required');
  }

  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromUrl(supabaseUrl);
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

  if (accessToken && projectRef) {
    try {
      const allowList = await fetchRedirectAllowList(projectRef, accessToken);
      const hasNativeRedirect = allowList.some(
        (entry) => entry === EXPECTED_REDIRECT || entry.includes('tracebudoffline://'),
      );
      const hasExpoDevRedirect = allowList.some((entry) => entry.includes('exp://'));
      if (hasNativeRedirect) {
        console.log(`[ok] redirect allow-list: includes field-app scheme`);
      } else {
        issues.push(
          `Redirect URL ${EXPECTED_REDIRECT} missing from Supabase uri_allow_list (found: ${allowList.join(', ') || 'empty'})`,
        );
        console.error(`[fail] redirect allow-list: missing tracebudoffline://`);
      }
      if (hasExpoDevRedirect) {
        console.log('[ok] redirect allow-list: includes exp:// (Expo Go dev)');
      } else {
        warnings.push(
          'Add exp://** to Supabase redirect URLs for Google OAuth in Expo Go (npx expo start). Preview/production builds use tracebudoffline://.',
        );
        console.warn('[warn] redirect allow-list: missing exp://** (Expo Go OAuth will fall back to dashboard site_url)');
      }
      const missingRecommended = RECOMMENDED_REDIRECT_PATTERNS.filter(
        (pattern) => !allowList.includes(pattern),
      );
      if (missingRecommended.length > 0) {
        console.warn(
          `[warn] optional redirect patterns missing: ${missingRecommended.join(', ')} — run: node scripts/merge-supabase-redirect-urls.mjs`,
        );
      }
    } catch (error) {
      warnings.push(`Could not verify redirect allow-list: ${error.message}`);
      console.warn(`[warn] redirect allow-list: ${error.message}`);
    }
  } else {
    warnings.push(
      `Set SUPABASE_ACCESS_TOKEN to verify redirect allow-list includes ${EXPECTED_REDIRECT}`,
    );
    console.warn(
      `[warn] redirect allow-list: skipped (set SUPABASE_ACCESS_TOKEN to verify ${EXPECTED_REDIRECT})`,
    );
  }

  if (projectRef) {
    console.log('');
    console.log('OAuth callback URLs (Google Cloud + Apple Services ID):');
    console.log(`  https://${projectRef}.supabase.co/auth/v1/callback`);
    console.log(`App redirect (Supabase → URL Configuration): ${EXPECTED_REDIRECT}`);
    console.log('');
    console.log('Google sign-in branding (browser “Continue to …” line):');
    console.log('  1. Google Cloud Console → OAuth consent screen → App name: Tracebud');
    console.log('  2. Optional: Supabase custom auth domain (e.g. auth.tracebud.com) to replace *.supabase.co');
  }

  if (warnings.length > 0) {
    console.log('');
    for (const warning of warnings) {
      console.warn(`[warn] ${warning}`);
    }
  }

  if (issues.length > 0) {
    console.log('');
    for (const issue of issues) {
      console.error(`[error] ${issue}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('OAuth provider check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
