#!/usr/bin/env node
/**
 * Verify sentry-mobile-alert-rules.json wiring and (when token present) remote parity.
 *
 * Run: npm run sentry:alerts:check
 *
 * Token sources (first match wins):
 *   SENTRY_AUTH_TOKEN, SENTRY_RELEASE_HEALTH_AUTH_TOKEN, MOBILE_SLO_SENTRY_AUTH_TOKEN,
 *   or apps/offline-product/local/sentry-auth.env
 *
 * Flags:
 *   --strict-remote   fail when no token (use in CI once secret is configured)
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  loadManifest,
  loadToken,
  listProjectAlertRules,
  manifestPath,
  repoRoot,
} from './sentryMobileAlertsLib.mjs';

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function assertWiring(manifest) {
  const requiredFiles = [
    'product-os/04-quality/sentry-mobile-alert-rules.json',
    'product-os/04-quality/sentry-mobile-alert-rules.md',
    'apps/offline-product/scripts/setup-sentry-mobile-alerts.mjs',
    'apps/offline-product/scripts/check-sentry-mobile-alerts.mjs',
    'apps/offline-product/scripts/sentryMobileAlertsLib.mjs',
  ];
  for (const file of requiredFiles) {
    readRepo(file);
  }

  const pkg = JSON.parse(readRepo('apps/offline-product/package.json'));
  for (const script of ['sentry:alerts:setup', 'sentry:alerts:check']) {
    if (!pkg.scripts?.[script]) {
      throw new Error(`apps/offline-product/package.json must define ${script}`);
    }
  }

  const ci = readRepo('.github/workflows/ci.yml');
  if (!ci.includes('sentry:alerts:check')) {
    throw new Error('ci.yml app job must run npm run sentry:alerts:check');
  }

  const runbook = readRepo('product-os/04-quality/offline-automation-runbook.md');
  if (!runbook.includes('sentry:alerts:check')) {
    throw new Error('offline-automation-runbook.md must document sentry:alerts:check');
  }

  if (!runbook.includes('sentry-mobile-alert-rules.json')) {
    throw new Error('offline-automation-runbook.md must reference sentry-mobile-alert-rules.json');
  }

  console.log(
    `sentry:alerts:check wiring OK — ${manifest.rules.length} manifest rule(s) at ${path.relative(repoRoot, manifestPath)}`,
  );
}

async function assertRemoteParity(manifest, { strictRemote }) {
  const token = loadToken();
  if (!token) {
    const message =
      'Remote alert parity skipped (no SENTRY_AUTH_TOKEN). Wiring check passed; run locally with a project:read token for full parity.';
    if (strictRemote) {
      throw new Error(`${message}\nRe-run with SENTRY_RELEASE_HEALTH_AUTH_TOKEN in CI or local sentry-auth.env.`);
    }
    console.warn(`sentry:alerts:check: ${message}`);
    return;
  }

  const remoteRules = await listProjectAlertRules(token, manifest);
  const remoteNames = new Set(remoteRules.map((rule) => rule.name));
  const missing = manifest.rules
    .map((rule) => rule.name)
    .filter((name) => !remoteNames.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Sentry is missing ${missing.length} manifest alert rule(s): ${missing.join(', ')}\n` +
        'Apply with: cd apps/offline-product && npm run sentry:alerts:setup',
    );
  }

  console.log(
    `sentry:alerts:check remote OK — all ${manifest.rules.length} manifest rule(s) exist in ${manifest.projectSlug}`,
  );
}

async function main() {
  const strictRemote =
    process.argv.includes('--strict-remote') || process.env.SENTRY_ALERTS_CHECK_STRICT_REMOTE === '1';

  const manifest = loadManifest();
  assertWiring(manifest);
  await assertRemoteParity(manifest, { strictRemote });
}

main().catch((error) => {
  if (error?.status === 403) {
    console.error(
      'Token lacks permission to list alert rules. Use a token with project:read (CI: SENTRY_RELEASE_HEALTH_AUTH_TOKEN).',
    );
  }
  console.error(error.message ?? error);
  process.exit(1);
});
