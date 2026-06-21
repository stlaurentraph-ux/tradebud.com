#!/usr/bin/env node
/**
 * Guardrail 1.2 — report Turbo remote cache auth in CI.
 *
 * Remote cache is optional until humans add TURBO_TOKEN + TURBO_TEAM in GitHub.
 * CI still passes with local-only Turbo cache.
 *
 * Run: npm run turbo:cache:report
 */
import fs from 'node:fs';

const strict = process.argv.includes('--strict');

function hasValue(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

const tokenSet = hasValue('TURBO_TOKEN');
const teamSet = hasValue('TURBO_TEAM');
const remoteEnabled = tokenSet && teamSet;

const lines = [
  '## Turbo remote cache',
  '',
  `- TURBO_TOKEN: ${tokenSet ? 'set' : 'missing'}`,
  `- TURBO_TEAM: ${teamSet ? 'set' : 'missing'}`,
  `- Remote cache: ${remoteEnabled ? 'enabled' : 'local-only (add GitHub secrets to enable)'}`,
  '',
  'Setup: `product-os/04-quality/ci-secrets-and-fixtures.md` (slice 1.2).',
];

const summary = lines.join('\n');
console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (strict && !remoteEnabled) {
  console.error('Turbo remote cache secrets are not configured.');
  process.exit(1);
}
