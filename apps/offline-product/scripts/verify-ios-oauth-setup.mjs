#!/usr/bin/env node
/**
 * Preflight for iOS preview/production Google sign-in.
 * Validates env, Supabase provider, app.config URL scheme wiring, and OTA env inlining.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '@expo/config';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadEasPreviewEnv() {
  const easPath = path.join(root, 'eas.json');
  if (!fs.existsSync(easPath)) return;
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  const env = eas?.build?.preview?.env;
  if (!env || typeof env !== 'object') return;
  for (const [key, value] of Object.entries(env)) {
    if (value == null || String(value).trim() === '') continue;
    if (!process.env[key]) process.env[key] = String(value).trim();
  }
}

function googleReversedScheme(clientId) {
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(String(clientId ?? '').trim());
  return match ? `com.googleusercontent.apps.${match[1]}` : null;
}

let failed = false;
const ok = (msg) => console.log(`[ok] ${msg}`);
const warn = (msg) => console.warn(`[warn] ${msg}`);
const fail = (msg) => {
  console.error(`[fail] ${msg}`);
  failed = true;
};

console.log('\niOS Google OAuth setup verification\n');

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));
loadEasPreviewEnv();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

if (!webClientId) {
  fail('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (.env.local or EAS preview environment)');
} else {
  ok('Google web client ID present');
}

if (!iosClientId) {
  fail('Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (.env.local or EAS preview environment)');
} else if (iosClientId === webClientId) {
  fail('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must not equal the Web client ID');
} else if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(iosClientId)) {
  fail('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID format is invalid');
} else {
  ok('Google iOS client ID present and distinct from Web client');
}

const reversedScheme = googleReversedScheme(iosClientId);
if (reversedScheme) {
  ok(`Native redirect scheme: ${reversedScheme}:/oauth2redirect`);
} else if (iosClientId) {
  fail('Could not derive Google reversed scheme from iOS client ID');
}

const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const iosBundle = appJson?.expo?.ios?.bundleIdentifier;
if (iosBundle !== 'com.tracebud.app') {
  fail(`Expected ios.bundleIdentifier com.tracebud.app (got ${iosBundle ?? 'undefined'})`);
} else {
  ok('iOS bundle com.tracebud.app');
}

if (iosClientId) {
  process.env.EAS_BUILD_PROFILE = process.env.EAS_BUILD_PROFILE ?? 'preview';
  const { exp } = getConfig(root, { skipSDKVersionRequirement: true });
  const urlTypes = exp.ios?.infoPlist?.CFBundleURLTypes ?? [];
  const hasGoogleScheme = urlTypes.some((entry) =>
    (entry.CFBundleURLSchemes ?? []).includes(reversedScheme),
  );
  const hasAppScheme = (exp.scheme ?? appJson.expo.scheme) === 'tracebudoffline';
  if (!hasGoogleScheme) {
    fail(
      `Resolved Expo config missing iOS CFBundleURLTypes scheme ${reversedScheme} — native rebuild required`,
    );
  } else {
    ok('Resolved Expo config includes Google OAuth iOS URL scheme');
  }
  if (!hasAppScheme) {
    warn('Expected app scheme tracebudoffline:// for Supabase OAuth callback');
  } else {
    ok('App scheme tracebudoffline:// configured');
  }
  const bakedIosId = exp.extra?.googleOAuth?.iosClientId?.trim();
  if (bakedIosId && bakedIosId !== iosClientId) {
    warn('Resolved googleOAuth.iosClientId differs from env — ensure EAS preview environment is loaded at build time');
  } else if (bakedIosId) {
    ok('googleOAuth.iosClientId baked into Expo extra');
  }
}

if (!fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8').includes('googleOAuthEnv')) {
  fail('app/_layout.tsx must import googleOAuthEnv for OTA Metro inlining');
} else {
  ok('googleOAuthEnv imported from app root (OTA env inlining)');
}

console.log('');
console.log('Google Cloud Console checklist (manual, on device only):');
console.log('  1. Credentials → OAuth 2.0 Client ID → type iOS');
console.log('  2. Bundle ID: com.tracebud.app');
console.log('  3. iOS client ID must be registered in Supabase (npm run oauth:sync-google-ids)');
console.log('  4. After changing iOS client or URL scheme → new EAS preview IPA if native wiring changed');
console.log('  5. On device: Sign out → Google → account picker → must land signed in (not generic OAuth error)');
console.log('');
console.log(
  '[info] npm run oauth:verify:ios cannot verify Google account picker — only a physical iPhone tap verifies end-to-end.',
);
console.log('');

const oauthVerify = spawnSync('node', ['./scripts/verify-oauth-providers.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (oauthVerify.status !== 0) failed = true;

const structuralGuard = spawnSync('node', ['./scripts/ios-oauth-guard.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (structuralGuard.status !== 0) failed = true;

console.log('');
if (failed) {
  console.error('iOS OAuth setup verification failed.\n');
  process.exit(1);
}

console.log('iOS OAuth setup verification passed (config + Supabase).');
console.log('Next: install a fresh preview build and complete Google sign-in on a physical iPhone.\n');
process.exit(0);
