#!/usr/bin/env node
/**
 * Preflight for local OAuth dev (`npm run dev:oauth:ios` / `dev:device`).
 * Checks env, redirect mode, Google client IDs, Supabase providers, and API reachability.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
const googleIds = [
  ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID],
  ['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID],
].filter(([, v]) => Boolean(v?.trim()));

let failed = false;
const ok = (msg) => console.log(`[ok] ${msg}`);
const warn = (msg) => console.warn(`[warn] ${msg}`);
const fail = (msg) => {
  console.error(`[fail] ${msg}`);
  failed = true;
};

console.log('\nLocal OAuth dev preflight\n');

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  fail('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local');
} else {
  ok('Supabase env present');
}

if (googleIds.length < 2) {
  fail('Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env.local');
} else {
  ok('Google OAuth client IDs present (web + iOS)');
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
  const schemeMatch = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(iosClientId);
  const plistPath = path.join(root, 'ios/TracebudOffline/Info.plist');
  if (schemeMatch && fs.existsSync(plistPath)) {
    const scheme = `com.googleusercontent.apps.${schemeMatch[1]}`;
    const plist = fs.readFileSync(plistPath, 'utf8');
    if (plist.includes(scheme)) {
      ok(`Info.plist includes Google OAuth URL scheme (${scheme})`);
    } else {
      fail(
        `Info.plist missing Google OAuth URL scheme. Run: node ./scripts/sync-ios-google-url-scheme.mjs`,
      );
    }
  }
}

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? '';
if (!androidClientId) {
  warn('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID unset — run npm run oauth:verify:android before preview APK');
} else {
  ok('Google Android client ID present for cross-check');
  const appConfigPath = path.join(root, 'app.config.js');
  if (fs.existsSync(appConfigPath)) {
    const appConfig = fs.readFileSync(appConfigPath, 'utf8');
    const schemeMatch = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(androidClientId);
    if (schemeMatch && appConfig.includes(`com.googleusercontent.apps.${schemeMatch[1]}`)) {
      ok('app.config.js references Android Google OAuth reversed scheme');
    } else {
      fail('app.config.js missing Android Google OAuth reversed scheme wiring');
    }
  }
}

const customScheme = process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME === '1';
if (customScheme) {
  ok('EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1');
} else {
  ok('Local `expo run:ios` uses tracebudoffline:// in __DEV__ (no env var needed)');
}

try {
  const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
  if (health.ok) {
    ok(`API reachable: ${apiUrl}/health`);
  } else {
    warn(`API returned ${health.status} at ${apiUrl} — OAuth may save session but sync will fail`);
  }
} catch {
  warn(
    `API not reachable at ${apiUrl} — use prod API for OAuth e2e: npm run dev:oauth:ios (or start tracebud-backend)`,
  );
}

const oauthVerify = spawnSync('node', ['./scripts/verify-oauth-providers.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (oauthVerify.status !== 0) failed = true;

console.log('\nNext: npm run dev:oauth:ios  (simulator)  or  npm run dev:oauth:device  (USB iPhone)\n');
process.exit(failed ? 1 : 0);
