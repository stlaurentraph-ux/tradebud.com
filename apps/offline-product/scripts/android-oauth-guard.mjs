#!/usr/bin/env node
/**
 * Ensures native Android Google OAuth wiring in app.config.js matches EAS preview builds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  const issues = [];
  const appJson = JSON.parse(read('app.json'));
  const appConfig = read('app.config.js');
  const verifyOAuth = read('scripts/verify-oauth-providers.mjs');
  const packageJson = JSON.parse(read('package.json'));

  const androidPackage = appJson?.expo?.android?.package;
  if (androidPackage !== 'com.tracebud.app') {
    issues.push(`app.json android.package must be com.tracebud.app (got ${androidPackage ?? 'undefined'})`);
  }

  const requiredSnippets = [
    'googleReversedSchemeFromClientId',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'androidGoogleScheme',
    'android.intentFilters',
    'googleOAuth',
  ];
  for (const snippet of requiredSnippets) {
    if (!appConfig.includes(snippet)) {
      issues.push(`app.config.js missing Android Google OAuth wiring: ${snippet}`);
    }
  }

  if (!appConfig.includes("entry.scheme === androidGoogleScheme")) {
    issues.push('app.config.js must register Google OAuth reversed scheme in Android intentFilters');
  }

  if (!verifyOAuth.includes('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID')) {
    issues.push('verify-oauth-providers.mjs must validate EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  }

  if (!packageJson.scripts?.['oauth:verify:android']) {
    issues.push('package.json missing oauth:verify:android script');
  }

  const googleSignInNative = read('features/auth/googleSignIn.native.ts');
  if (!googleSignInNative.includes('getOAuthBrowserSessionOptions')) {
    issues.push('googleSignIn.native.ts must use getOAuthBrowserSessionOptions');
  }
  if (!googleSignInNative.includes('captureGoogleNativeOAuthCode')) {
    issues.push('googleSignIn.native.ts must recover oauth2redirect codes after Android task split');
  }
  const orchestratorPolicy = read('features/auth/oauthOrchestratorPolicy.ts');
  if (!orchestratorPolicy.includes('androidNativeRedirectInstalled')) {
    issues.push('oauthOrchestratorPolicy must allow Android browser fallback when oauth2redirect is missing from APK');
  }

  if (!packageJson.scripts?.['release:preview:android:safe']) {
    issues.push('package.json missing release:preview:android:safe script');
  }

  const smokePath = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');
  if (!fs.existsSync(smokePath)) {
    issues.push('missing DEVICE_SMOKE_CHECKLIST.md');
  } else {
    const smoke = fs.readFileSync(smokePath, 'utf8');
    if (!/SHA-1/i.test(smoke)) {
      issues.push('DEVICE_SMOKE_CHECKLIST.md must document Android Google SHA-1 setup');
    }
  }

  if (issues.length === 0) {
    console.log('android-oauth-guard: OK');
    process.exit(0);
  }

  console.error('android-oauth-guard: FAILED\n');
  for (const issue of issues) {
    console.error(`  → ${issue}`);
  }
  process.exit(1);
}

main();
