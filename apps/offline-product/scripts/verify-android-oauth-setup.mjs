#!/usr/bin/env node
/**
 * Preflight for Android preview/production Google sign-in.
 * Validates env, Supabase provider, and app.config intent-filter wiring.
 *
 * Note: Google Android OAuth cannot be fully verified from a server HTTP probe —
 * SHA-1 + package are checked on-device when the signed APK opens the auth session.
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

console.log('\nAndroid Google OAuth setup verification\n');

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));
loadEasPreviewEnv();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

if (!webClientId) {
  fail('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (.env.local or EAS preview environment)');
} else {
  ok('Google web client ID present');
}

if (!androidClientId) {
  fail('Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (.env.local or EAS preview environment)');
} else if (androidClientId === webClientId) {
  fail('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID must not equal the Web client ID');
} else if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(androidClientId)) {
  fail('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID format is invalid');
} else {
  ok('Google Android client ID present and distinct from Web client');
}

const reversedScheme = googleReversedScheme(androidClientId);
if (reversedScheme) {
  ok(`Native redirect scheme: ${reversedScheme}:/oauth2redirect`);
} else if (androidClientId) {
  fail('Could not derive Google reversed scheme from Android client ID');
}

const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const androidPackage = appJson?.expo?.android?.package;
if (androidPackage !== 'com.tracebud.app') {
  fail(`Expected android.package com.tracebud.app (got ${androidPackage ?? 'undefined'})`);
} else {
  ok('Android package com.tracebud.app');
}

if (androidClientId) {
  process.env.EAS_BUILD_PROFILE = process.env.EAS_BUILD_PROFILE ?? 'preview';
  const { exp } = getConfig(root, { skipSDKVersionRequirement: true });
  const intentFilters = exp.android?.intentFilters ?? [];
  const hasGoogleScheme = intentFilters.some((filter) =>
    filter.data?.some((entry) => entry.scheme === reversedScheme),
  );
  const hasAppScheme = (exp.scheme ?? appJson.expo.scheme) === 'tracebudoffline';
  if (!hasGoogleScheme) {
    fail(
      `Resolved Expo config missing Android intent filter for ${reversedScheme} — rebuild required after app.config.js fix`,
    );
  } else {
    ok('Resolved Expo config includes Google OAuth Android intent filter');
  }
  if (!hasAppScheme) {
    warn('Expected app scheme tracebudoffline:// for Supabase OAuth callback');
  } else {
    ok('App scheme tracebudoffline:// configured');
  }
  const bakedAndroidId = exp.extra?.googleOAuth?.androidClientId?.trim();
  if (bakedAndroidId && bakedAndroidId !== androidClientId) {
    warn('Resolved googleOAuth.androidClientId differs from env — ensure EAS preview environment is loaded at build time');
  } else if (bakedAndroidId) {
    ok('googleOAuth.androidClientId baked into Expo extra');
  }
}

console.log('');
console.log('Google Cloud Console checklist (manual, on device only):');
console.log('  1. Credentials → OAuth 2.0 Client ID → type Android');
console.log('  2. Package name: com.tracebud.app');
console.log('  3. SHA-1: expo.dev → tracebud-offline → Credentials → Android (upload keystore)');
console.log('  4. After changing SHA-1 or intent filters → new EAS preview APK (OTA is not enough for OAuth native wiring)');
console.log('  5. On device: Sign out → Google → account picker (not “Access blocked / invalid_request”)');
console.log('');
console.log(
  '[info] Server-side HTTP probes against accounts.google.com are not valid for Android installed clients.',
);
console.log('[info] Confirm sign-in on a physical device with the preview APK you will ship to testers.');
console.log('');

const oauthVerify = spawnSync('node', ['./scripts/verify-oauth-providers.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (oauthVerify.status !== 0) failed = true;

const structuralGuard = spawnSync('node', ['./scripts/android-oauth-guard.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (structuralGuard.status !== 0) failed = true;

console.log('');
if (failed) {
  console.error('Android OAuth setup verification failed.\n');
  process.exit(1);
}

console.log('Android OAuth setup verification passed (config + Supabase).');
console.log('Next: install a fresh preview APK and complete Google sign-in on device.\n');
process.exit(0);
