#!/usr/bin/env node
/**
 * Maestro OAuth smoke wiring — sign-in sheet testIDs + callback error route.
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

console.log('OAuth Maestro guard\n');

const flows = [
  'oauth-sign-in-sheet-smoke.yaml',
  'oauth-callback-missing-url-smoke.yaml',
];

for (const flow of flows) {
  const rel = path.join('.maestro/flows', flow);
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`FAIL: missing ${rel}`);
    process.exit(1);
  }
  console.log(`OK file: ${flow}`);
}

assertIncludes('components/auth/OAuthProviderButtons.tsx', 'testID="sign-in-oauth-google"', 'Google OAuth testID');
assertIncludes('components/auth/OAuthProviderButtons.tsx', 'testID="sign-in-oauth-apple"', 'Apple OAuth testID');
assertIncludes('features/auth/SignInSheetContext.tsx', 'testID="sign-in-sheet"', 'sign-in sheet testID');
assertIncludes('features/auth/SignInSheetContext.tsx', 'testID="sign-in-use-email"', 'email fallback testID');
assertIncludes('app/(tabs)/settings.tsx', 'testID="settings-open-sign-in"', 'settings sign-in CTA testID');
assertIncludes('app/auth/callback.tsx', 'testID="auth-callback-error-title"', 'callback error title testID');

assertIncludes('.maestro/flows/oauth-sign-in-sheet-smoke.yaml', 'settings-open-sign-in', 'Maestro opens sign-in sheet');
assertIncludes('.maestro/flows/oauth-sign-in-sheet-smoke.yaml', 'sign-in-oauth-google', 'Maestro asserts Google CTA');
assertIncludes('.maestro/flows/oauth-callback-missing-url-smoke.yaml', 'tracebudoffline://auth/callback', 'Maestro callback deep link');
assertIncludes('.maestro/flows/oauth-callback-missing-url-smoke.yaml', 'auth-callback-error-title', 'Maestro callback error assert');

const baseline = JSON.parse(read('qa/automation-baselines/maestro-flows.json'));
for (const flow of flows) {
  if (!baseline.flows.includes(flow)) {
    console.error(`FAIL: ${flow} missing from maestro-flows.json baseline`);
    process.exit(1);
  }
}
console.log('OK: maestro-flows.json includes OAuth smoke flows');

console.log('\noauth-maestro-guard: OK');
