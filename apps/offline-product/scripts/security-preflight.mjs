#!/usr/bin/env node
/**
 * Static security gates before field testing / production builds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assertIncludes(rel, needle, label) {
  const text = read(rel);
  if (!text.includes(needle)) {
    console.error(`FAIL: ${label} — expected "${needle}" in ${rel}`);
    process.exit(1);
  }
  console.log(`OK: ${label}`);
}

console.log('Security preflight — static wiring\n');

assertIncludes('features/api/postPlot.ts', "from './syncAuthSession'", 'postPlot delegates auth to syncAuthSession');
assertIncludes('features/api/postPlot.ts', 'getAccessTokenFromSupabase', 'postPlot uses unified access token');
assertIncludes('features/api/plots.ts', 'Authorization: `Bearer ${accessToken}`', 'plots API uses bearer token');
assertIncludes('features/api/harvest.ts', 'Authorization: `Bearer ${accessToken}`', 'harvest API uses bearer token');
assertIncludes('features/security/syncAuthStorage.ts', 'SecureStore', 'sync credentials use secure storage');
assertIncludes('features/security/syncAuthStorage.ts', 'saveOAuthSyncAuthCredentials', 'OAuth refresh token storage');
assertIncludes('features/errors/ErrorLogger.ts', 'sanitizeLogContext', 'error logger redacts sensitive context');
assertIncludes('features/observability/analytics.ts', 'sanitizeAnalyticsProperties', 'analytics redacts before Sentry');
assertIncludes('features/api/consentGrants.ts', '/v1/me/gdpr-erasure-request', 'GDPR erasure API wired');
assertIncludes('app/data-sharing.tsx', 'requestGdprErasure', 'GDPR erasure UI wired');
assertIncludes('app.json', 'NSUserNotificationsUsageDescription', 'iOS push usage string');

const eas = JSON.parse(read('eas.json'));
const prodEnv = eas?.build?.production?.env ?? {};
if (prodEnv.EXPO_PUBLIC_ALLOW_TEST_AUTH === '1') {
  console.error('FAIL: eas.json production profile must not set EXPO_PUBLIC_ALLOW_TEST_AUTH=1');
  process.exit(1);
}
console.log('OK: production eas profile has no test-auth flag');

console.log('\nSecurity preflight passed.');
