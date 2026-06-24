#!/usr/bin/env node
/**
 * Ensures native iOS Google OAuth wiring in app.config.js matches EAS preview/production builds.
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
  const layout = read('app/_layout.tsx');
  const oauthOrchestrator = read('features/auth/oauthOrchestrator.ts');
  const verifyOAuth = read('scripts/verify-oauth-providers.mjs');
  const packageJson = JSON.parse(read('package.json'));

  const iosBundle = appJson?.expo?.ios?.bundleIdentifier;
  if (iosBundle !== 'com.tracebud.app') {
    issues.push(`app.json ios.bundleIdentifier must be com.tracebud.app (got ${iosBundle ?? 'undefined'})`);
  }

  const requiredConfigSnippets = [
    'googleReversedSchemeFromClientId',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'iosGoogleScheme',
    'CFBundleURLTypes',
    'googleOAuth',
  ];
  for (const snippet of requiredConfigSnippets) {
    if (!appConfig.includes(snippet)) {
      issues.push(`app.config.js missing iOS Google OAuth wiring: ${snippet}`);
    }
  }

  if (!layout.includes("import '@/features/auth/googleOAuthEnv'")) {
    issues.push('app/_layout.tsx must import googleOAuthEnv so OTA bundles inline EXPO_PUBLIC_GOOGLE_*');
  }

  if (!oauthOrchestrator.includes('Platform.OS === \'ios\' && !__DEV__')) {
    issues.push('oauthOrchestrator.ts must allow iOS EAS browser fallback when native Google fails');
  }

  if (!verifyOAuth.includes('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID')) {
    issues.push('verify-oauth-providers.mjs must validate EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  }

  if (!packageJson.scripts?.['oauth:verify:ios']) {
    issues.push('package.json missing oauth:verify:ios script');
  }

  if (!packageJson.scripts?.['oauth:sso:health-check']) {
    issues.push('package.json missing oauth:sso:health-check script');
  }

  for (const flow of ['oauth-sign-in-sheet-smoke.yaml', 'oauth-callback-missing-url-smoke.yaml']) {
    if (!fs.existsSync(path.join(root, '.maestro/flows', flow))) {
      issues.push(`missing Maestro OAuth flow: ${flow}`);
    }
  }

  const smokePath = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');
  if (!fs.existsSync(smokePath)) {
    issues.push('missing DEVICE_SMOKE_CHECKLIST.md');
  } else {
    const smoke = fs.readFileSync(smokePath, 'utf8');
    if (!/iOS.*Google sign-in/i.test(smoke)) {
      issues.push('DEVICE_SMOKE_CHECKLIST.md must document iOS Google sign-in smoke (§4)');
    }
  }

  if (issues.length === 0) {
    console.log('ios-oauth-guard: OK');
    process.exit(0);
  }

  console.error('ios-oauth-guard: FAILED\n');
  for (const issue of issues) {
    console.error(`  → ${issue}`);
  }
  process.exit(1);
}

main();
